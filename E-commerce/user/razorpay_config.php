<?php

// Keys live in secrets.php (git-ignored). Copy secrets.example.php to create it.
$secrets_file = __DIR__ . '/secrets.php';
$secrets = file_exists($secrets_file) ? require $secrets_file : [];

define('RAZORPAY_KEY_ID',     $secrets['razorpay_key_id']     ?? '');
define('RAZORPAY_KEY_SECRET', $secrets['razorpay_key_secret'] ?? '');

// Store name shown in Razorpay popup
define('STORE_NAME', 'Second Shelf');

// Currency
define('CURRENCY', 'INR');

// Delivery fee settings
define('DELIVERY_FEE', 40);           // Rs.40 delivery charge
define('FREE_DELIVERY_ABOVE', 499);   // Free delivery above Rs.499
