<?php
// ============================================================
//  test_payment.php — drop in user/ folder, open in browser
//  Tells you exactly what's broken. DELETE after fixing!
// ============================================================

$results = [];

// 1. Check payment_handler.php exists
$results[] = ['check' => 'payment_handler.php exists', 'ok' => file_exists(__DIR__ . '/payment_handler.php'), 'fix' => 'Download payment_handler.php and put it in C:\xampp\htdocs\E-commerce\user\\'];
$results[] = ['check' => 'verify_payment.php exists',  'ok' => file_exists(__DIR__ . '/verify_payment.php'),  'fix' => 'Download verify_payment.php and put it in the user/ folder'];
$results[] = ['check' => 'order_confirm.php exists',   'ok' => file_exists(__DIR__ . '/order_confirm.php'),   'fix' => 'Download order_confirm.php and put it in the user/ folder'];
$results[] = ['check' => 'razorpay_config.php exists', 'ok' => file_exists(__DIR__ . '/razorpay_config.php'), 'fix' => 'Download razorpay_config.php and put it in the user/ folder'];

include_once __DIR__ . '/connect_database.php';
$results[] = ['check' => 'Database connected', 'ok' => isset($conn) && $conn, 'fix' => 'Check connect_database.php credentials'];

if (isset($conn) && $conn) {
    $r = mysqli_query($conn, "SHOW TABLES LIKE 'orders'");
    $results[] = ['check' => "'orders' table exists", 'ok' => mysqli_num_rows($r) > 0, 'fix' => 'Open phpMyAdmin → Import → select payment_setup.sql'];
    $r2 = mysqli_query($conn, "SHOW TABLES LIKE 'order_items'");
    $results[] = ['check' => "'order_items' table exists", 'ok' => mysqli_num_rows($r2) > 0, 'fix' => 'Same — run payment_setup.sql in phpMyAdmin'];
    $r3 = mysqli_query($conn, "SELECT COUNT(*) AS c FROM user_cart");
    $cnt = mysqli_fetch_assoc($r3)['c'];
    $results[] = ['check' => "Cart has items ($cnt item/s)", 'ok' => $cnt > 0, 'fix' => 'Add items to cart before testing checkout'];
}

$results[] = ['check' => 'cURL extension enabled', 'ok' => function_exists('curl_init'), 'fix' => 'Open C:\xampp\php\php.ini → find ;extension=curl → remove the semicolon → restart Apache'];

$all_ok = array_reduce($results, fn($c, $r) => $c && $r['ok'], true);
?>
<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Payment Check</title>
<style>
body{font-family:Arial,sans-serif;background:#f4f4f4;padding:30px}
.card{background:#fff;border-radius:8px;overflow:hidden;max-width:650px;box-shadow:0 2px 8px rgba(0,0,0,.1)}
.row{display:flex;gap:12px;padding:13px 18px;border-bottom:1px solid #f0f0f0;align-items:flex-start}
.row:last-child{border-bottom:none}
.label{font-weight:600;font-size:14px}
.fix{font-size:12px;background:#fff3cd;color:#856404;padding:4px 10px;border-radius:4px;margin-top:5px}
.banner{max-width:650px;padding:13px 18px;border-radius:8px;margin-bottom:16px;font-weight:600}
.good{background:#d4edda;color:#155724} .bad{background:#f8d7da;color:#721c24}
.note{background:#fff3cd;color:#856404;padding:10px 14px;border-radius:6px;font-size:13px;margin-top:14px;max-width:650px}
</style></head><body>
<h2 style="margin-bottom:14px">Payment Setup Checker</h2>
<div class="banner <?= $all_ok ? 'good' : 'bad' ?>">
  <?= $all_ok ? '✓ All good! Payment should work.' : '✗ Issues found — fix the red items below.' ?>
</div>
<div class="card">
<?php foreach ($results as $r): ?>
  <div class="row">
    <div style="font-size:18px;flex-shrink:0"><?= $r['ok'] ? '✅' : '❌' ?></div>
    <div>
      <div class="label"><?= $r['check'] ?></div>
      <?php if (!$r['ok']): ?><div class="fix">Fix: <?= htmlspecialchars($r['fix']) ?></div><?php endif; ?>
    </div>
  </div>
<?php endforeach; ?>
</div>
<div class="note">⚠ Delete <strong>test_payment.php</strong> after everything is fixed.</div>
</body></html>