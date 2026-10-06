<?php
// POST verify_payment.php {order_id, razorpay_order_id, razorpay_payment_id, razorpay_signature}
// Called by the browser after Razorpay reports success. Checks the signature, then marks the order paid.

require __DIR__ . '/bootstrap.php';
allow_methods('POST');

$user_id = require_user();
$input   = body();

$order_id      = (int) ($input['order_id'] ?? 0);
$rz_order_id   = (string) ($input['razorpay_order_id'] ?? '');
$rz_payment_id = (string) ($input['razorpay_payment_id'] ?? '');
$rz_signature  = (string) ($input['razorpay_signature'] ?? '');

if (!$order_id || $rz_order_id === '' || $rz_payment_id === '' || $rz_signature === '') {
    fail('Missing payment details.');
}

$pdo = db();
$pdo->beginTransaction();

$stmt = $pdo->prepare(
    "SELECT order_id, payment_status FROM orders
     WHERE order_id = ? AND user_id = ? AND payment_method = 'razorpay' AND razorpay_order_id = ?
     FOR UPDATE"
);
$stmt->execute([$order_id, $user_id, $rz_order_id]);
$order = $stmt->fetch();

if (!$order) {
    $pdo->rollBack();
    fail('Order not found.', 404);
}
if ($order['payment_status'] === 'paid') {
    $pdo->commit();
    send_json(['order_id' => $order_id]);  // already verified (e.g. a double click)
}

// Razorpay signs "order_id|payment_id" with the key secret
$expected = hash_hmac('sha256', $rz_order_id . '|' . $rz_payment_id, RAZORPAY_KEY_SECRET);

if (!hash_equals($expected, $rz_signature)) {
    $pdo->prepare("UPDATE orders SET payment_status = 'failed' WHERE order_id = ?")->execute([$order_id]);
    $pdo->commit();
    fail('We couldn’t confirm this payment. If money was taken, contact us with your order number.', 400);
}

mark_paid($pdo, $order_id, $user_id, $rz_payment_id);
$pdo->commit();

send_json(['order_id' => $order_id]);
