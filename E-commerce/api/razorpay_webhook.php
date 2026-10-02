<?php
// POST razorpay_webhook.php   (called by Razorpay, not the browser)
// Marks an order paid even if the customer closed the tab before verify_payment.php ran.
// Razorpay dashboard → Webhooks: URL = this file, events = payment.captured, order.paid,
// secret = razorpay_webhook_secret in secrets.php. Razorpay retries until it gets a 2xx.

require __DIR__ . '/bootstrap.php';
allow_methods('POST');

if (RAZORPAY_WEBHOOK_SECRET === '') {
    fail('Webhook secret is not set in api/secrets.php.', 503);  // an empty key would accept forged calls
}

// Razorpay signs the raw request body with the webhook secret
$expected = hash_hmac('sha256', file_get_contents('php://input'), RAZORPAY_WEBHOOK_SECRET);
if (!hash_equals($expected, (string) ($_SERVER['HTTP_X_RAZORPAY_SIGNATURE'] ?? ''))) {
    fail('Invalid signature.', 401);
}

$event   = body();
$payment = $event['payload']['payment']['entity'] ?? null;

if (!in_array($event['event'] ?? '', ['payment.captured', 'order.paid'], true) || empty($payment['order_id'])) {
    send_json(['ignored' => true]);  // other events: acknowledge so Razorpay stops retrying
}

$pdo = db();
$pdo->beginTransaction();

$stmt = $pdo->prepare(
    "SELECT order_id, user_id, payment_status FROM orders
     WHERE razorpay_order_id = ? AND payment_method = 'razorpay'
     FOR UPDATE"
);
$stmt->execute([$payment['order_id']]);
$order = $stmt->fetch();

if (!$order) {
    $pdo->rollBack();
    send_json(['ignored' => true]);  // not one of ours (e.g. another site on the same Razorpay account)
}

// Already paid via verify_payment.php or an earlier delivery of this event: nothing to do
if ($order['payment_status'] !== 'paid') {
    mark_paid($pdo, (int) $order['order_id'], (int) $order['user_id'], (string) $payment['id']);
}
$pdo->commit();

send_json(['ok' => true]);
