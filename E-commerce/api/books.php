<?php
// GET books.php?id=3                     → one book + related books
// GET books.php?q=&category[]=&condition[]=&price=under150|150to250|above250&in_stock=1&sort=newest|price_asc|price_desc&limit=
//                                        → list of books

require __DIR__ . '/bootstrap.php';
allow_methods('GET');

$columns = 'SNO, product_image, product_name, writer_name, description, product_price, mrp,
            category, book_condition, product_quantity';

if (isset($_GET['id'])) {
    $stmt = db()->prepare("SELECT $columns FROM product_details WHERE SNO = ?");
    $stmt->execute([(int) $_GET['id']]);
    $row = $stmt->fetch();
    if (!$row) {
        fail('Book not found.', 404);
    }

    // Same category first, then anything else in stock
    $related = db()->prepare(
        "SELECT $columns FROM product_details
         WHERE SNO <> ? AND product_quantity > 0
         ORDER BY (category = ?) DESC, created_at DESC, SNO DESC
         LIMIT 5"
    );
    $related->execute([$row['SNO'], $row['category']]);

    send_json([
        'book'    => format_book($row),
        'related' => array_map('format_book', $related->fetchAll()),
    ]);
}

$where  = [];
$params = [];

// Every word has to appear somewhere in the title, author or category ("money housel" finds The Psychology of Money)
$q = trim(preg_replace('/\s+/', ' ', (string) ($_GET['q'] ?? '')));
$words = $q === '' ? [] : array_slice(explode(' ', $q), 0, 8);
foreach ($words as $word) {
    $where[] = '(product_name LIKE ? OR writer_name LIKE ? OR category LIKE ?)';
    $like = '%' . addcslashes($word, '%_\\') . '%';
    array_push($params, $like, $like, $like);
}

$categories = array_filter((array) ($_GET['category'] ?? []), 'is_string');
if ($categories) {
    $where[] = 'category IN (' . implode(',', array_fill(0, count($categories), '?')) . ')';
    array_push($params, ...array_values($categories));
}

$conditions = array_intersect((array) ($_GET['condition'] ?? []), ['Like New', 'Good', 'Fair']);
if ($conditions) {
    $where[] = 'book_condition IN (' . implode(',', array_fill(0, count($conditions), '?')) . ')';
    array_push($params, ...array_values($conditions));
}

$price_ranges = [
    'under150' => 'product_price < 150',
    '150to250' => 'product_price BETWEEN 150 AND 250',
    'above250' => 'product_price > 250',
];
if (isset($price_ranges[$_GET['price'] ?? ''])) {
    $where[] = $price_ranges[$_GET['price']];
}

if (!empty($_GET['in_stock'])) {
    $where[] = 'product_quantity > 0';
}

$order_by = [
    'newest'     => 'created_at DESC, SNO DESC',
    'price_asc'  => 'product_price ASC',
    'price_desc' => 'product_price DESC',
][$_GET['sort'] ?? 'newest'] ?? 'created_at DESC, SNO DESC';

// sort=relevance (used by search suggestions): titles starting with the query, then titles
// containing it, then author matches; in-stock books before sold-out ones
$order_params = [];
if (($_GET['sort'] ?? '') === 'relevance' && $q !== '') {
    $escaped  = addcslashes($q, '%_\\');
    $order_by = '(product_name LIKE ?) DESC, (product_name LIKE ?) DESC, (writer_name LIKE ?) DESC,
                 (product_quantity > 0) DESC, product_name ASC';
    $order_params = [$escaped . '%', '%' . $escaped . '%', '%' . $escaped . '%'];
}

$sql = "SELECT $columns FROM product_details"
     . ($where ? ' WHERE ' . implode(' AND ', $where) : '')
     . " ORDER BY $order_by";
$params = array_merge($params, $order_params);

$limit = (int) ($_GET['limit'] ?? 0);
if ($limit > 0) {
    $sql .= ' LIMIT ' . min($limit, 100);
}

$stmt = db()->prepare($sql);
$stmt->execute($params);

$total = (int) db()->query('SELECT COUNT(*) FROM product_details')->fetchColumn();

send_json([
    'books' => array_map('format_book', $stmt->fetchAll()),
    'total' => $total,
]);
