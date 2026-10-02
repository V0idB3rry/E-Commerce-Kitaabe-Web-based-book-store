<?php
// Store settings shared by every API endpoint.

$secrets_file = __DIR__ . '/secrets.php';
$secrets = file_exists($secrets_file) ? require $secrets_file : [];

// MySQL login comes from secrets.php; without it, XAMPP's defaults (root, no password) are used
define('DB_HOST', $secrets['db_host'] ?? 'localhost');
define('DB_NAME', $secrets['db_name'] ?? 'e-commerce');
define('DB_USER', $secrets['db_user'] ?? 'root');
define('DB_PASS', $secrets['db_pass'] ?? '');

// Razorpay keys live in secrets.php (git-ignored). Copy secrets.example.php to create it.
define('RAZORPAY_KEY_ID',         $secrets['razorpay_key_id']         ?? '');
define('RAZORPAY_KEY_SECRET',     $secrets['razorpay_key_secret']     ?? '');
define('RAZORPAY_WEBHOOK_SECRET', $secrets['razorpay_webhook_secret'] ?? '');

// Links in emails (password reset, verification) point here: the React app's address, no trailing slash
define('APP_URL',   rtrim($secrets['app_url'] ?? 'http://localhost:5173', '/'));
define('MAIL_FROM', $secrets['mail_from'] ?? 'Second Shelf <no-reply@localhost>');

const STORE_NAME         = 'Second Shelf';
const CURRENCY            = 'INR';
const DELIVERY_FEE        = 40;   // ₹40 on smaller orders
const FREE_DELIVERY_ABOVE = 499;  // free delivery at or above ₹499
