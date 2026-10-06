<?php
// GET  orders.php            → the signed-in customer's orders (newest first)
// GET  orders.php?id=12      → one order with its books
// POST orders.php {name, phone, email, address, city, pincode, payment_method: "razorpay"|"cod"}
//      cod      → order placed, stock reduced, cart cleared
//      razorpay → pending order + Razorpay order; the browser opens Razorpay, then calls verify_payment.php

require __DIR__ . '/bootstrap.php';
allow_methods('GET', 'POST');

$user_id = require_user();

function format_order(array $row): array
{
    return [
        'id'             => (int) $row['order_id'],
        'date'           => $row['order_date'],
        'name'           => $row['user_name'],
        'email'          => $row['user_email'],
        'phone'          => $row['user_phone'],
        'address'        => $row['delivery_address'],
        'city'           => $row['city'],
        'pincode'        => $row['pincode'],
        'payment_method' => $row['payment_method'],
        'payment_status' => $row['payment_status'],
        'order_status'   => $row['order_status'],
        'delivery_fee'   => (float) $row['delivery_fee'],
        'total'          => (float) $row['order_total'],
    ];
}

function order_items(int $order_id): array
{
    $stmt = db()->prepare(
        'SELECT i.product_id, i.product_name, i.product_image, i.product_price, i.quantity, i.line_total, p.book_condition
         FROM order_items i
         LEFT JOIN product_details p ON p.SNO = i.product_id
         WHERE i.order_id = ?
         ORDER BY i.id'
    );
    $stmt->execute([$order_id]);

    return array_map(fn ($r) => [
        'book_id'    => $r['product_id'] !== null ? (int) $r['product_id'] : null,
        'title'      => $r['product_name'],
        'image'      => $r['product_image'],
        'condition'  => $r['book_condition'],
        'price'      => (float) $r['product_price'],
        'quantity'   => (int) $r['quantity'],
        'line_total' => (float) $r['line_total'],
    ], $stmt->fetchAll());
}

if (method() === 'GET') {
    if (isset($_GET['id'])) {
        $stmt = db()->prepare('SELECT * FROM orders WHERE order_id = ? AND user_id = ?');
        $stmt->execute([(int) $_GET['id'], $user_id]);
        $row = $stmt->fetch() ?: fail('Order not found.', 404);

        send_json(['order' => format_order($row) + ['items' => order_items((int) $row['order_id'])]]);
    }

    $stmt = db()->prepare(
        "SELECT * FROM orders
         WHERE user_id = ? AND NOT (payment_method = 'razorpay' AND payment_status <> 'paid')
         ORDER BY order_date DESC, order_id DESC"
    );
    $stmt->execute([$user_id]);

    $orders = [];
    foreach ($stmt->fetchAll() as $row) {
        $orders[] = format_order($row) + ['items' => order_items((int) $row['order_id'])];
    }
    send_json(['orders' => $orders]);
}

// ── Place an order ───────────────────────────────────────────
$stmt = db()->prepare('SELECT email_verified_at FROM user_database WHERE id = ?');
$stmt->execute([$user_id]);
if (!$stmt->fetchColumn()) {
    fail('Please confirm your email address before placing an order. You can get a new link from your account page.', 403);
}

$input = body();

$name    = trim((string) ($input['name'] ?? ''));
$phone   = preg_replace('/\D/', '', (string) ($input['phone'] ?? ''));
$email   = trim((string) ($input['email'] ?? ''));
$address = trim((string) ($input['address'] ?? ''));
$city    = trim((string) ($input['city'] ?? ''));
$pincode = trim((string) ($input['pincode'] ?? ''));
$method  = ($input['payment_method'] ?? '') === 'cod' ? 'cod' : 'razorpay';

$errors = [];
if ($name === '')                                   $errors['name']    = 'Enter the name for delivery.';
if (strlen($phone) !== 10)                          $errors['phone']   = 'Enter a 10-digit phone number.';
if (!filter_var($email, FILTER_VALIDATE_EMAIL))     $errors['email']   = 'Enter a valid email address.';
if ($address === '')                                $errors['address'] = 'Enter your delivery address.';
if ($city === '')                                   $errors['city']    = 'Enter your city.';
if (!preg_match('/^\d{6}$/', $pincode))             $errors['pincode'] = 'Pincode should be 6 digits.';
if ($errors) {
    send_json(['error' => 'Please check the highlighted fields.', 'fields' => $errors], 422);
}

$stmt = db()->prepare(
    'SELECT c.quantity, p.SNO, p.product_name, p.product_image, p.product_price, p.product_quantity
     FROM user_cart c
     JOIN product_details p ON p.SNO = c.product_id
     WHERE c.user_id = ?'
);
$stmt->execute([$user_id]);
$lines = $stmt->fetchAll();

if (!$lines) {
    fail('Your cart is empty.');
}

$subtotal = 0.0;
foreach ($lines as $line) {
    if ((int) $line['quantity'] > (int) $line['product_quantity']) {
        fail('“' . $line['product_name'] . '” only has ' . (int) $line['product_quantity'] . ' left. Update your cart and try again.', 409);
    }
    $subtotal += (float) $line['product_price'] * (int) $line['quantity'];
}
$fee   = delivery_fee($subtotal);
$total = $subtotal + $fee;

// Razorpay order first, so a failed call leaves nothing behind in our database
$razorpay_order_id = null;
if ($method === 'razorpay') {
    if (RAZORPAY_KEY_ID === '' || RAZORPAY_KEY_SECRET === '') {
        fail('Online payment isn’t set up yet (api/secrets.php is missing). Choose cash on delivery instead.', 503);
    }

    $ch = curl_init('https://api.razorpay.com/v1/orders');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => json_encode([
            'amount'   => (int) round($total * 100),
            'currency' => CURRENCY,
            'receipt'  => 'user' . $user_id . '_' . time(),
        ]),
        CURLOPT_USERPWD        => RAZORPAY_KEY_ID . ':' . RAZORPAY_KEY_SECRET,
        CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
        CURLOPT_TIMEOUT        => 15,
    ]);
    $response = curl_exec($ch);
    $status   = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curl_err = curl_error($ch);
    curl_close($ch);

    $razorpay = json_decode((string) $response, true);
    if ($curl_err || $status !== 200 || empty($razorpay['id'])) {
        error_log('[razorpay] order create failed: ' . ($curl_err ?: $response));
        fail('We couldn’t start the online payment. Try again, or choose cash on delivery.', 502);
    }
    $razorpay_order_id = $razorpay['id'];
}

$pdo = db();
$pdo->beginTransaction();

$pdo->prepare(
    'INSERT INTO orders (user_id, user_name, user_email, user_phone, delivery_address, city, pincode,
                         payment_method, payment_status, razorpay_order_id, order_total, delivery_fee)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
)->execute([
    $user_id, $name, $email, $phone, $address, $city, $pincode,
    $method, $method === 'cod' ? 'cod_pending' : 'pending', $razorpay_order_id, $total, $fee,
]);
$order_id = (int) $pdo->lastInsertId();

$item_stmt = $pdo->prepare(
    'INSERT INTO order_items (order_id, product_id, product_name, product_image, product_price, quantity, line_total)
     VALUES (?, ?, ?, ?, ?, ?, ?)'
);
foreach ($lines as $line) {
    $qty = (int) $line['quantity'];
    $item_stmt->execute([
        $order_id, $line['SNO'], $line['product_name'], $line['product_image'],
        $line['product_price'], $qty, (float) $line['product_price'] * $qty,
    ]);
}

if ($method === 'cod') {
    fulfil_order($pdo, $order_id, $user_id);
}

$pdo->commit();

if ($method === 'cod') {
    send_json(['order_id' => $order_id, 'payment_method' => 'cod']);
}

send_json([
    'order_id'       => $order_id,
    'payment_method' => 'razorpay',
    'razorpay'       => [
        'key'      => RAZORPAY_KEY_ID,
        'order_id' => $razorpay_order_id,
        'amount'   => (int) round($total * 100),
        'currency' => CURRENCY,
        'name'     => STORE_NAME,
        'prefill'  => ['name' => $name, 'email' => $email, 'contact' => $phone],
    ],
]);
