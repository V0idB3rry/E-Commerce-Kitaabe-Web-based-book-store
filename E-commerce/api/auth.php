<?php
// GET  auth.php                                         → the signed-in customer (or null)
// POST auth.php {action:"login", email, password, remember}
// POST auth.php {action:"register", name, email, phone, password}
// POST auth.php {action:"logout"}

require __DIR__ . '/bootstrap.php';
allow_methods('GET', 'POST');

function public_user(array $row): array
{
    return [
        'id'    => (int) $row['id'],
        'name'  => $row['Username'],
        'email' => $row['email'],
        'phone' => $row['Phone_number'],
    ];
}

function find_user(string $column, $value): ?array
{
    // $column is always one of our own literals, never user input
    $stmt = db()->prepare("SELECT id, Username, email, Phone_number, password FROM user_database WHERE $column = ?");
    $stmt->execute([$value]);
    return $stmt->fetch() ?: null;
}

function sign_in(array $row, bool $remember): never
{
    session_regenerate_id(true);
    $_SESSION['user_id'] = (int) $row['id'];

    if ($remember) {
        $days = 30;
        ini_set('session.gc_maxlifetime', (string) ($days * 86400));
        setcookie(session_name(), session_id(), [
            'expires'  => time() + $days * 86400,
            'path'     => '/',
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
    }

    send_json(['user' => public_user($row)]);
}

if (method() === 'GET') {
    $id = current_user_id();
    $row = $id ? find_user('id', $id) : null;
    send_json(['user' => $row ? public_user($row) : null]);
}

$input  = body();
$action = $input['action'] ?? '';

if ($action === 'logout') {
    $_SESSION = [];
    setcookie(session_name(), '', ['expires' => time() - 3600, 'path' => '/']);
    session_destroy();
    send_json(['user' => null]);
}

$email    = strtolower(trim((string) ($input['email'] ?? '')));
$password = (string) ($input['password'] ?? '');

if ($action === 'login') {
    check_login_attempts('customer', $email);
    $row = $email !== '' ? find_user('email', $email) : null;

    // Old accounts stored plain-text passwords; password_verify() rejects those, so they must sign up again.
    if (!$row || !password_verify($password, $row['password'])) {
        record_login_failure('customer', $email);
        fail('That email and password don’t match. Check them and try again.', 401);
    }
    clear_login_failures('customer', $email);
    sign_in($row, !empty($input['remember']));
}

if ($action === 'register') {
    $name  = trim((string) ($input['name'] ?? ''));
    $phone = preg_replace('/\D/', '', (string) ($input['phone'] ?? ''));

    if ($name === '') {
        fail('Please enter your name.');
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        fail('Please enter a valid email address.');
    }
    if ($phone !== '' && strlen($phone) !== 10) {
        fail('Phone number should be 10 digits.');
    }
    if (strlen($password) < 8) {
        fail('Password must be at least 8 characters.');
    }
    if (find_user('email', $email)) {
        fail('An account with this email already exists. Try signing in.', 409);
    }

    $stmt = db()->prepare('INSERT INTO user_database (Username, Phone_number, email, password) VALUES (?, ?, ?, ?)');
    $stmt->execute([$name, $phone ?: null, $email, password_hash($password, PASSWORD_DEFAULT)]);

    sign_in(find_user('id', (int) db()->lastInsertId()), false);
}

fail('Unknown action.');
