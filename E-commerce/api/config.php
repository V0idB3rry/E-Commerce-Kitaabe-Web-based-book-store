<?php
// Store settings shared by every API endpoint.

$secrets_file = __DIR__ . '/secrets.php';
$secrets = file_exists($secrets_file) ? require $secrets_file : [];

// MySQL (XAMPP defaults)
const DB_HOST = 'localhost';
const DB_NAME = 'e-commerce';
const DB_USER = 'root';
const DB_PASS = '';

// Razorpay keys live in secrets.php (git-ignored). Copy secrets.example.php to create it.
define('RAZORPAY_KEY_ID',     $secrets['razorpay_key_id']     ?? '');
define('RAZORPAY_KEY_SECRET', $secrets['razorpay_key_secret'] ?? '');

const STORE_NAME          = 'Second Shelf';
const CURRENCY            = 'INR';
const DELIVERY_FEE        = 40;   // ₹40 on smaller orders
const FREE_DELIVERY_ABOVE = 499;  // free delivery at or above ₹499
