<?php
// Catch ALL PHP errors and return them as JSON instead of HTML
ob_start();
ini_set('display_errors', 0);
header('Content-Type: application/json');

set_error_handler(function($errno, $errstr, $errfile, $errline) {
    ob_clean();
    echo json_encode(['success' => false, 'error' => "PHP Error: $errstr (line $errline in " . basename($errfile) . ")"]);
    exit;
});
set_exception_handler(function($e) {
    ob_clean();
    echo json_encode(['success' => false, 'error' => 'PHP Exception: ' . $e->getMessage()]);
    exit;
});

include 'connect_database.php';

if (!file_exists(__DIR__ . '/razorpay_config.php')) {
    echo json_encode(['success' => false, 'error' => 'razorpay_config.php is missing from the user/ folder']);
    exit;
}
include 'razorpay_config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'error' => 'Invalid request method']);
    exit;
}

if (!$conn) {
    echo json_encode(['success' => false, 'error' => 'Database connection failed']);
    exit;
}

// Check orders table exists
$tableCheck = mysqli_query($conn, "SHOW TABLES LIKE 'orders'");
if (mysqli_num_rows($tableCheck) === 0) {
    echo json_encode(['success' => false, 'error' => "The 'orders' table is missing. Open phpMyAdmin → select your database → Import → choose payment_setup.sql → click Go."]);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
if (!$input) {
    echo json_encode(['success' => false, 'error' => 'Invalid request data']);
    exit;
}

$user_name  = trim(mysqli_real_escape_string($conn, $input['user_name']   ?? ''));
$user_email = trim(mysqli_real_escape_string($conn, $input['user_email']  ?? ''));
$user_phone = trim(mysqli_real_escape_string($conn, $input['user_phone']  ?? ''));
$address    = trim(mysqli_real_escape_string($conn, $input['address']     ?? ''));
$city       = trim(mysqli_real_escape_string($conn, $input['city']        ?? ''));
$pincode    = trim(mysqli_real_escape_string($conn, $input['pincode']     ?? ''));
$pay_method = ($input['payment_method'] ?? '') === 'cod' ? 'cod' : 'razorpay';

if (!$user_name || !$address || !$city || !$pincode) {
    echo json_encode(['success' => false, 'error' => 'Please fill all delivery details']);
    exit;
}

$cart_result = mysqli_query($conn, "SELECT * FROM user_cart");
$items    = [];
$subtotal = 0;
while ($row = mysqli_fetch_assoc($cart_result)) {
    $qty        = max(1, (int)($row['quantity'] ?? 1));
    $price      = (float)$row['product_price'];
    $line_total = $qty * $price;
    $subtotal  += $line_total;
    $items[]    = [
        'product_name'  => $row['product_name'],
        'product_image' => $row['product_image'] ?? '',
        'product_price' => $price,
        'quantity'      => $qty,
        'line_total'    => $line_total,
    ];
}

if (empty($items)) {
    echo json_encode(['success' => false, 'error' => 'Your cart is empty']);
    exit;
}

$delivery_fee = $subtotal >= FREE_DELIVERY_ABOVE ? 0 : DELIVERY_FEE;
$order_total  = $subtotal + $delivery_fee;

// COD path
if ($pay_method === 'cod') {
    $order_id = savePendingOrder($conn, $user_name, $user_email, $user_phone,
        $address, $city, $pincode, 'cod', 'cod_pending',
        null, $order_total, $delivery_fee, $items);
    if (!$order_id) {
        echo json_encode(['success' => false, 'error' => 'Could not save order: ' . mysqli_error($conn)]);
        exit;
    }
    clearCart($conn);
    ob_clean();
    echo json_encode(['success' => true, 'method' => 'cod', 'order_id' => $order_id]);
    exit;
}

// Razorpay path
if (!function_exists('curl_init')) {
    echo json_encode(['success' => false, 'error' => 'cURL is not enabled. Open C:\xampp\php\php.ini, find ;extension=curl, remove the semicolon, then restart Apache.']);
    exit;
}

$amount_paise = (int)round($order_total * 100);
$rz_payload   = json_encode([
    'amount'   => $amount_paise,
    'currency' => CURRENCY,
    'receipt'  => 'order_' . time() . '_' . rand(1000, 9999),
    'notes'    => ['customer' => $user_name],
]);

$ch = curl_init('https://api.razorpay.com/v1/orders');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $rz_payload,
    CURLOPT_USERPWD        => RAZORPAY_KEY_ID . ':' . RAZORPAY_KEY_SECRET,
    CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
    CURLOPT_TIMEOUT        => 15,
    CURLOPT_SSL_VERIFYPEER => false,
]);
$rz_response = curl_exec($ch);
$http_code   = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curl_error  = curl_error($ch);
curl_close($ch);

if ($curl_error) {
    echo json_encode(['success' => false, 'error' => 'Could not reach Razorpay: ' . $curl_error]);
    exit;
}

if ($http_code !== 200) {
    $err = json_decode($rz_response, true);
    $msg = $err['error']['description'] ?? $err['error']['code'] ?? "HTTP $http_code";
    echo json_encode(['success' => false, 'error' => 'Razorpay error: ' . $msg . '. Check your Key ID and Key Secret in razorpay_config.php.']);
    exit;
}

$rz_order    = json_decode($rz_response, true);
$rz_order_id = $rz_order['id'];

$order_id = savePendingOrder($conn, $user_name, $user_email, $user_phone,
    $address, $city, $pincode, 'razorpay', 'pending',
    $rz_order_id, $order_total, $delivery_fee, $items);

if (!$order_id) {
    echo json_encode(['success' => false, 'error' => 'Could not save order to database: ' . mysqli_error($conn)]);
    exit;
}

ob_clean();
echo json_encode([
    'success'     => true,
    'method'      => 'razorpay',
    'rz_order_id' => $rz_order_id,
    'db_order_id' => $order_id,
    'amount'      => $amount_paise,
    'key_id'      => RAZORPAY_KEY_ID,
    'store_name'  => STORE_NAME,
    'currency'    => CURRENCY,
    'customer'    => ['name' => $user_name, 'email' => $user_email, 'phone' => $user_phone],
]);


function savePendingOrder($conn, $name, $email, $phone, $address, $city, $pincode,
                          $pay_method, $pay_status, $rz_order_id,
                          $total, $delivery_fee, $items) {
    $rz_esc = $rz_order_id ? "'" . mysqli_real_escape_string($conn, $rz_order_id) . "'" : 'NULL';
    $sql = "INSERT INTO orders (user_name, user_email, user_phone, delivery_address, city, pincode,
                payment_method, payment_status, razorpay_order_id, order_total, delivery_fee)
            VALUES ('$name','$email','$phone','$address','$city','$pincode',
                '$pay_method','$pay_status',$rz_esc,'$total','$delivery_fee')";
    if (!mysqli_query($conn, $sql)) return false;
    $order_id = mysqli_insert_id($conn);
    foreach ($items as $item) {
        $pname  = mysqli_real_escape_string($conn, $item['product_name']);
        $pimg   = mysqli_real_escape_string($conn, $item['product_image']);
        $price  = (float)$item['product_price'];
        $qty    = (int)$item['quantity'];
        $ltotal = (float)$item['line_total'];
        mysqli_query($conn, "INSERT INTO order_items (order_id, product_name, product_image, product_price, quantity, line_total)
            VALUES ($order_id,'$pname','$pimg',$price,$qty,$ltotal)");
    }
    return $order_id;
}

function clearCart($conn) {
    mysqli_query($conn, "DELETE FROM user_cart");
}