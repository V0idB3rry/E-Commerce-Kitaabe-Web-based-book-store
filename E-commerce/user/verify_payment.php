<?php
// ============================================================
//  verify_payment.php
//  Called via fetch() after Razorpay payment succeeds on client
//  Verifies HMAC signature → marks order paid → clears cart
// ============================================================

header('Content-Type: application/json');
include 'connect_database.php';
include 'razorpay_config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Invalid request']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);

$rz_order_id   = trim($input['razorpay_order_id']   ?? '');
$rz_payment_id = trim($input['razorpay_payment_id'] ?? '');
$rz_signature  = trim($input['razorpay_signature']  ?? '');
$db_order_id   = (int)($input['db_order_id'] ?? 0);

if (!$rz_order_id || !$rz_payment_id || !$rz_signature || !$db_order_id) {
    echo json_encode(['success' => false, 'error' => 'Missing payment details']);
    exit;
}

// ── Verify Razorpay HMAC-SHA256 signature ────────────────────
// Razorpay signs: razorpay_order_id + "|" + razorpay_payment_id
$expected_signature = hash_hmac(
    'sha256',
    $rz_order_id . '|' . $rz_payment_id,
    RAZORPAY_KEY_SECRET
);

if (!hash_equals($expected_signature, $rz_signature)) {
    // Signature mismatch — mark order as failed
    $oid = mysqli_real_escape_string($conn, (string)$db_order_id);
    mysqli_query($conn, "UPDATE orders SET payment_status='failed' WHERE order_id=$oid");
    echo json_encode(['success' => false, 'error' => 'Payment verification failed. Please contact support.']);
    exit;
}

// ── Signature valid → update order ──────────────────────────
$pay_id_esc = mysqli_real_escape_string($conn, $rz_payment_id);
$ord_id_esc = mysqli_real_escape_string($conn, $rz_order_id);

$sql = "UPDATE orders
        SET payment_status      = 'paid',
            razorpay_payment_id = '$pay_id_esc',
            razorpay_order_id   = '$ord_id_esc'
        WHERE order_id = $db_order_id";

if (!mysqli_query($conn, $sql)) {
    echo json_encode(['success' => false, 'error' => 'Could not update order: ' . mysqli_error($conn)]);
    exit;
}

// ── Clear the cart ───────────────────────────────────────────
mysqli_query($conn, "DELETE FROM user_cart");

echo json_encode(['success' => true, 'order_id' => $db_order_id]);