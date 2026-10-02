<?php
// GET    admin_books.php?q=&category=&stock=low|out    → every book (sold-out ones included)
// POST   admin_books.php  (multipart form)             → add a book; a cover image is required
// POST   admin_books.php  (multipart form with id)     → edit a book; a new cover is optional
// PATCH  admin_books.php {id, stock}                   → quick stock change ("Restock")
// DELETE admin_books.php?id=3                          → remove a book
//
// Form fields: title, author, description, category, condition, price, mrp, stock, cover (file)

require __DIR__ . '/bootstrap.php';
allow_methods('GET', 'POST', 'PATCH', 'DELETE');

const COLUMNS = 'SNO, product_image, product_name, writer_name, description, product_price, mrp,
                 category, book_condition, product_quantity';
const COVER_DIR   = __DIR__ . '/../uploads/books/';
const COVER_TYPES = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp'];
const COVER_MAX   = 5 * 1024 * 1024;

function load_book(int $id): array
{
    $stmt = db()->prepare('SELECT ' . COLUMNS . ' FROM product_details WHERE SNO = ?');
    $stmt->execute([$id]);
    return $stmt->fetch() ?: fail('Book not found.', 404);
}

/** Validate an uploaded cover and move it into uploads/books. Returns the stored file name. */
function save_cover(array $file, string $title): string
{
    if ($file['error'] === UPLOAD_ERR_INI_SIZE || $file['error'] === UPLOAD_ERR_FORM_SIZE || $file['size'] > COVER_MAX) {
        send_json(['error' => 'Please check the highlighted fields.', 'fields' => ['cover' => 'Cover image must be 5 MB or smaller.']], 422);
    }
    if ($file['error'] !== UPLOAD_ERR_OK || !is_uploaded_file($file['tmp_name'])) {
        send_json(['error' => 'Please check the highlighted fields.', 'fields' => ['cover' => 'The cover image didn’t upload. Try again.']], 422);
    }

    // Trust the file's contents, not its name or the browser's claimed type
    $type = (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
    if (!isset(COVER_TYPES[$type]) || @getimagesize($file['tmp_name']) === false) {
        send_json(['error' => 'Please check the highlighted fields.', 'fields' => ['cover' => 'Use a JPG, PNG or WebP image.']], 422);
    }

    $slug = trim(preg_replace('/[^a-z0-9]+/', '-', strtolower($title)), '-') ?: 'book';
    $name = substr($slug, 0, 60) . '-' . bin2hex(random_bytes(4)) . '.' . COVER_TYPES[$type];

    if (!move_uploaded_file($file['tmp_name'], COVER_DIR . $name)) {
        throw new RuntimeException('Could not save cover image to ' . COVER_DIR);
    }
    return $name;
}

/** Read and validate the book form. Returns [values, errors]. */
function read_book_form(bool $creating): array
{
    $v = [
        'title'       => trim((string) ($_POST['title'] ?? '')),
        'author'      => trim((string) ($_POST['author'] ?? '')),
        'description' => trim((string) ($_POST['description'] ?? '')),
        'category'    => trim((string) ($_POST['category'] ?? '')),
        'condition'   => (string) ($_POST['condition'] ?? ''),
        'price'       => $_POST['price'] ?? '',
        'mrp'         => trim((string) ($_POST['mrp'] ?? '')),
        'stock'       => $_POST['stock'] ?? '',
    ];
    $errors = [];

    if ($v['title'] === '')  $errors['title']  = 'Enter the book title.';
    if ($v['author'] === '') $errors['author'] = 'Enter the author.';

    $cat = db()->prepare('SELECT COUNT(*) FROM category WHERE category = ?');
    $cat->execute([$v['category']]);
    if (!$cat->fetchColumn()) $errors['category'] = 'Choose a category.';

    if (!in_array($v['condition'], ['Like New', 'Good', 'Fair'], true)) $errors['condition'] = 'Choose a condition.';

    if (!is_numeric($v['price']) || (float) $v['price'] <= 0) {
        $errors['price'] = 'Enter a price above ₹0.';
    }
    if ($v['mrp'] !== '' && (!is_numeric($v['mrp']) || (float) $v['mrp'] <= 0)) {
        $errors['mrp'] = 'Enter the new-copy price, or leave it empty.';
    } elseif ($v['mrp'] !== '' && is_numeric($v['price']) && (float) $v['mrp'] < (float) $v['price']) {
        $errors['mrp'] = 'Cover price should be at least the selling price.';
    }
    if (filter_var($v['stock'], FILTER_VALIDATE_INT, ['options' => ['min_range' => 0, 'max_range' => 100000]]) === false) {
        $errors['stock'] = 'Enter how many copies (0 or more).';
    }

    $has_cover = isset($_FILES['cover']) && $_FILES['cover']['error'] !== UPLOAD_ERR_NO_FILE;
    if ($creating && !$has_cover) $errors['cover'] = 'Add a cover image.';

    return [$v, $errors, $has_cover];
}

// ── GET ──────────────────────────────────────────────────────
if (method() === 'GET') {
    if (isset($_GET['id'])) {
        send_json(['book' => format_book(load_book((int) $_GET['id']))]);
    }

    $where = [];
    $params = [];
    $q = trim((string) ($_GET['q'] ?? ''));
    if ($q !== '') {
        $like = '%' . addcslashes($q, '%_\\') . '%';
        $where[] = '(product_name LIKE ? OR writer_name LIKE ?)';
        array_push($params, $like, $like);
    }
    if (($_GET['category'] ?? '') !== '') {
        $where[] = 'category = ?';
        $params[] = $_GET['category'];
    }
    if (($_GET['stock'] ?? '') === 'low') $where[] = 'product_quantity BETWEEN 1 AND 4';
    if (($_GET['stock'] ?? '') === 'out') $where[] = 'product_quantity = 0';

    $stmt = db()->prepare('SELECT ' . COLUMNS . ', (SELECT COALESCE(SUM(i.quantity), 0) FROM order_items i
                             JOIN orders o ON o.order_id = i.order_id
                             WHERE i.product_id = product_details.SNO AND o.order_status <> \'cancelled\'
                               AND (o.payment_method = \'cod\' OR o.payment_status = \'paid\')) AS sold
                           FROM product_details'
        . ($where ? ' WHERE ' . implode(' AND ', $where) : '')
        . ' ORDER BY created_at DESC, SNO DESC');
    $stmt->execute($params);

    send_json(['books' => array_map(fn ($r) => format_book($r) + ['sold' => (int) $r['sold']], $stmt->fetchAll())]);
}

// ── DELETE ───────────────────────────────────────────────────
if (method() === 'DELETE') {
    $book = load_book((int) ($_GET['id'] ?? 0));
    // Past orders keep their own copy of the title, price and image name, so they stay intact
    db()->prepare('DELETE FROM product_details WHERE SNO = ?')->execute([$book['SNO']]);
    send_json(['deleted' => (int) $book['SNO']]);
}

// ── PATCH: quick stock change ────────────────────────────────
if (method() === 'PATCH') {
    $input = body();
    $book  = load_book((int) ($input['id'] ?? 0));
    $stock = filter_var($input['stock'] ?? null, FILTER_VALIDATE_INT, ['options' => ['min_range' => 0, 'max_range' => 100000]]);
    if ($stock === false) {
        fail('Enter how many copies (0 or more).');
    }
    db()->prepare('UPDATE product_details SET product_quantity = ? WHERE SNO = ?')->execute([$stock, $book['SNO']]);
    send_json(['book' => format_book(load_book((int) $book['SNO']))]);
}

// ── POST: create or edit ─────────────────────────────────────
$editing = isset($_POST['id']) && $_POST['id'] !== '';
$current = $editing ? load_book((int) $_POST['id']) : null;

[$v, $errors, $has_cover] = read_book_form(!$editing);
if ($errors) {
    send_json(['error' => 'Please check the highlighted fields.', 'fields' => $errors], 422);
}

$image = $has_cover ? save_cover($_FILES['cover'], $v['title']) : $current['product_image'];
$values = [
    $image, $v['title'], $v['author'], $v['description'] ?: null, (float) $v['price'],
    $v['mrp'] !== '' ? (float) $v['mrp'] : null, $v['category'], $v['condition'], (int) $v['stock'],
];

if ($editing) {
    db()->prepare(
        'UPDATE product_details SET product_image = ?, product_name = ?, writer_name = ?, description = ?,
                product_price = ?, mrp = ?, category = ?, book_condition = ?, product_quantity = ?
         WHERE SNO = ?'
    )->execute([...$values, $current['SNO']]);
    $id = (int) $current['SNO'];
} else {
    db()->prepare(
        'INSERT INTO product_details (product_image, product_name, writer_name, description,
                product_price, mrp, category, book_condition, product_quantity)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )->execute($values);
    $id = (int) db()->lastInsertId();
}

send_json(['book' => format_book(load_book($id))], $editing ? 200 : 201);
