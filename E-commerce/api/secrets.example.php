<?php
// Copy this file to secrets.php (same folder) and fill in your own values.
// secrets.php is git-ignored — never commit real keys.
// Get test keys from https://dashboard.razorpay.com/app/keys

return [
    // MySQL: use the limited `shelf_app` user from database/README.md (leave these out to use XAMPP's root)
    'db_host' => 'localhost',
    'db_name' => 'e-commerce',
    'db_user' => 'shelf_app',
    'db_pass' => 'choose-a-strong-password',

    'razorpay_key_id'     => 'rzp_test_xxxxxxxxxxxxxx',
    'razorpay_key_secret' => 'xxxxxxxxxxxxxxxxxxxxxxxx',

    // Any long random string; enter the same one in Razorpay dashboard → Webhooks
    'razorpay_webhook_secret' => 'xxxxxxxxxxxxxxxxxxxxxxxx',
];
