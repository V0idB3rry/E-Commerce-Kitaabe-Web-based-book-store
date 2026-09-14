<?php
// GET    cart.php                               → the signed-in customer's cart
// POST   cart.php {product_id, quantity}        → add copies (adds to what is already there)
// PATCH  cart.php {product_id, quantity}        → set the quantity
// DELETE cart.php?product_id=3                  → remove the book
// Every call responds with the full, updated cart.

require __DIR__ . '/bootstrap.php';
allow_methods('GET', 'POST', 'PATCH', 'DELETE');

$user_id = require_user();

/** Cart lines joined with live book data, plus totals. */
function load_cart(int $user_id): array
{
    $stmt = db()->prepare(
        'SELECT c.quantity, p.SNO, p.product_image, p.product_name, p.writer_name, p.description,
                p.product_price, p.mrp, p.category, p.book_condition, p.product_quantity
         FROM user_cart c
         JOIN product_details p ON p.SNO = c.product_id
         WHERE c.user_id = ?
         ORDER BY c.sno'
    );
    $stmt->execute([$user_id]);

    $items = [];
    $count = 0;
    $subtotal = 0.0;
    $cover_total = 0.0;

    foreach ($stmt->fetchAll() as $row) {
        $book = format_book($row);
        $qty  = (int) $row['quantity'];
        $items[] = ['book' => $book, 'quantity' => $qty];

        $count       += $qty;
        $subtotal    += $book['price'] * $qty;
        $cover_total += ($book['mrp'] ?? $book['price']) * $qty;
    }

    $fee = $items ? delivery_fee($subtotal) : 0;

    return [
        'items'  => $items,
        'totals' => [
            'count'               => $count,
            'cover_total'         => $cover_total,
            'subtotal'            => $subtotal,
            'savings'             => $cover_total - $subtotal,
            'delivery_fee'        => $fee,
            'total'               => $subtotal + $fee,
            'free_delivery_above' => FREE_DELIVERY_ABOVE,
            'standard_fee'        => DELIVERY_FEE,
        ],
    ];
}

function book_stock(int $product_id): array
{
    $stmt = db()->prepare('SELECT SNO, product_name, product_price, product_image, product_quantity FROM product_details WHERE SNO = ?');
    $stmt->execute([$product_id]);
    return $stmt->fetch() ?: fail('Book not found.', 404);
}

if (method() === 'GET') {
    send_json(load_cart($user_id));
}

if (method() === 'DELETE') {
    $stmt = db()->prepare('DELETE FROM user_cart WHERE user_id = ? AND product_id = ?');
    $stmt->execute([$user_id, (int) ($_GET['product_id'] ?? 0)]);
    send_json(load_cart($user_id));
}

$input      = body();
$product_id = (int) ($input['product_id'] ?? 0);
$quantity   = (int) ($input['quantity'] ?? 1);
$book       = book_stock($product_id);

$existing = db()->prepare('SELECT quantity FROM user_cart WHERE user_id = ? AND product_id = ?');
$existing->execute([$user_id, $product_id]);
$current = (int) ($existing->fetchColumn() ?: 0);

$wanted = method() === 'POST' ? $current + $quantity : $quantity;

if ($wanted < 1) {
    fail('Quantity must be at least 1.');
}
if ($wanted > (int) $book['product_quantity']) {
    $left = (int) $book['product_quantity'];
    fail($left > 0
        ? "Only $left " . ($left === 1 ? 'copy' : 'copies') . ' of this book in stock.'
        : 'Sorry, this book is out of stock.', 409);
}

// product_name/price/image are kept filled because the old columns are NOT NULL
$stmt = db()->prepare(
    'INSERT INTO user_cart (user_id, product_id, product_name, product_price, product_image, quantity)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE quantity = VALUES(quantity)'
);
$stmt->execute([$user_id, $product_id, $book['product_name'], $book['product_price'], $book['product_image'], $wanted]);

send_json(load_cart($user_id));
