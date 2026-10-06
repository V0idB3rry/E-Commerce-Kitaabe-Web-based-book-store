<?php
// Create or reset an admin account (command line only).
//   C:\xampp\php\php.exe database\create_admin.php
// You will be asked for a name, email and password (min 8 characters).

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

function ask(string $label): string
{
    echo $label . ': ';
    return trim((string) fgets(STDIN));
}

$name     = ask('Name');
$email    = strtolower(ask('Email'));
$password = ask('Password (min 8 characters, visible as you type)');

if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    fwrite(STDERR, "A name and a valid email are required.\n");
    exit(1);
}
if (strlen($password) < 8) {
    fwrite(STDERR, "Password must be at least 8 characters.\n");
    exit(1);
}

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
require __DIR__ . '/../api/config.php';
$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
$conn->set_charset('utf8mb4');

$hash = password_hash($password, PASSWORD_DEFAULT);
$stmt = $conn->prepare(
    'INSERT INTO admins (name, email, password_hash) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE name = VALUES(name), password_hash = VALUES(password_hash)'
);
$stmt->bind_param('sss', $name, $email, $hash);
$stmt->execute();

echo $stmt->affected_rows === 1 ? "Admin created: $email\n" : "Admin updated: $email\n";
