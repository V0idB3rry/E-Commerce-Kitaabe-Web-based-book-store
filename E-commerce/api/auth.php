<?php
// GET  auth.php                                         → the signed-in customer (or null)
// POST auth.php {action:"login", email, password, remember}
// POST auth.php {action:"register", name, email, phone, password}   → also emails a verification link
// POST auth.php {action:"logout"}
// POST auth.php {action:"forgot", email}                → emails a password reset link (same reply either way)
// POST auth.php {action:"reset", token, password}       → sets the new password and signs in
// POST auth.php {action:"verify", token}                → confirms the email address
// POST auth.php {action:"resend_verification"}          → emails a new verification link (signed in)

require __DIR__ . '/bootstrap.php';
allow_methods('GET', 'POST');

function public_user(array $row): array
{
    return [
        'id'       => (int) $row['id'],
        'name'     => $row['Username'],
        'email'    => $row['email'],
        'phone'    => $row['Phone_number'],
        'verified' => $row['email_verified_at'] !== null,
    ];
}

function find_user(string $column, $value): ?array
{
    // $column is always one of our own literals, never user input
    $stmt = db()->prepare("SELECT id, Username, email, Phone_number, password, email_verified_at FROM user_database WHERE $column = ?");
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
            'secure'   => IS_HTTPS,
        ]);
    }

    send_json(['user' => public_user($row)]);
}

/** Plain-text email. XAMPP's mail() isn't set up by default; then the message goes to the PHP error log. */
function send_email(string $to, string $subject, string $text): void
{
    // ponytail: the log fallback holds live links; fine on localhost, set up mail() (or SMTP) before going live
    if (!@mail($to, $subject, $text, ['From' => MAIL_FROM, 'Content-Type' => 'text/plain; charset=utf-8'])) {
        error_log("[mail] not sent (mail() isn't set up). To: $to | $subject\n$text");
    }
}

/** A one-time link: "verify" works for 48 hours, "reset" for 1 hour. Replaces earlier links of the same kind. */
function email_link(int $user_id, string $purpose): string
{
    $token = bin2hex(random_bytes(32));
    $pdo = db();
    $pdo->prepare('DELETE FROM email_tokens WHERE user_id = ? AND purpose = ?')->execute([$user_id, $purpose]);
    $pdo->prepare('INSERT INTO email_tokens (user_id, purpose, token_hash, expires_at) VALUES (?, ?, ?, NOW() + INTERVAL ? HOUR)')
        ->execute([$user_id, $purpose, hash('sha256', $token), $purpose === 'reset' ? 1 : 48]);

    return APP_URL . ($purpose === 'reset' ? '/reset-password' : '/verify-email') . '?token=' . $token;
}

/** At most one email a minute per account and kind, so the forms can't be used to flood someone's inbox. */
function sent_recently(int $user_id, string $purpose): bool
{
    $stmt = db()->prepare('SELECT 1 FROM email_tokens WHERE user_id = ? AND purpose = ? AND created_at > NOW() - INTERVAL 1 MINUTE');
    $stmt->execute([$user_id, $purpose]);
    return (bool) $stmt->fetchColumn();
}

/** The customer an unexpired link belongs to. */
function user_for_token(string $token, string $purpose): array
{
    $stmt = db()->prepare('SELECT user_id FROM email_tokens WHERE token_hash = ? AND purpose = ? AND expires_at > NOW()');
    $stmt->execute([hash('sha256', $token), $purpose]);
    $user_id = $stmt->fetchColumn();

    if (!$user_id) {
        fail('This link is invalid or has expired. Please ask for a new one.', 410);
    }
    return find_user('id', (int) $user_id);
}

function send_verification(array $row): void
{
    send_email($row['email'], 'Confirm your email for ' . STORE_NAME,
        "Hi {$row['Username']},\n\nPlease confirm your email address so you can place orders:\n"
        . email_link((int) $row['id'], 'verify') . "\n\nThe link works for 48 hours.");
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
    setcookie(session_name(), '', ['expires' => time() - 3600, 'path' => '/', 'secure' => IS_HTTPS]);
    session_destroy();
    send_json(['user' => null]);
}

$email    = strtolower(trim((string) ($input['email'] ?? '')));
$password = (string) ($input['password'] ?? '');
$token    = (string) ($input['token'] ?? '');

if ($action === 'login') {
    check_login_attempts('customer', $email);
    $row = $email !== '' ? find_user('email', $email) : null;

    // Old accounts stored plain-text passwords; password_verify() rejects those, so they must sign up again.
    if (!$row || !password_verify($password, $row['password'])) {
        record_attempt('customer', $email);
        fail('That email and password don’t match. Check them and try again.', 401);
    }
    clear_login_failures('customer', $email);
    sign_in($row, !empty($input['remember']));
}

if ($action === 'register') {
    check_ip_limit('register', 5);
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

    $row = find_user('id', (int) db()->lastInsertId());
    record_attempt('register');
    send_verification($row);
    sign_in($row, false);
}

if ($action === 'forgot') {
    $row = filter_var($email, FILTER_VALIDATE_EMAIL) ? find_user('email', $email) : null;

    if ($row && !sent_recently((int) $row['id'], 'reset')) {
        send_email($row['email'], 'Reset your ' . STORE_NAME . ' password',
            "Hi {$row['Username']},\n\nSomeone (hopefully you) asked to reset your password. Choose a new one here:\n"
            . email_link((int) $row['id'], 'reset')
            . "\n\nThe link works for 1 hour. If you didn't ask for this, you can ignore this email.");
    }
    send_json(['ok' => true]);  // same reply whether or not the account exists
}

if ($action === 'reset') {
    if (strlen($password) < 8) {
        fail('Password must be at least 8 characters.');
    }
    $row = user_for_token($token, 'reset');

    // Using the emailed link also proves they own the address
    db()->prepare('UPDATE user_database SET password = ?, email_verified_at = COALESCE(email_verified_at, NOW()) WHERE id = ?')
        ->execute([password_hash($password, PASSWORD_DEFAULT), $row['id']]);
    db()->prepare("DELETE FROM email_tokens WHERE user_id = ? AND purpose = 'reset'")->execute([$row['id']]);
    clear_login_failures('customer', $row['email']);

    sign_in(find_user('id', (int) $row['id']), false);
}

if ($action === 'verify') {
    // The link stays valid until it expires, so opening it twice is harmless
    $row = user_for_token($token, 'verify');
    db()->prepare('UPDATE user_database SET email_verified_at = COALESCE(email_verified_at, NOW()) WHERE id = ?')
        ->execute([$row['id']]);
    send_json(['ok' => true]);
}

if ($action === 'resend_verification') {
    $row = find_user('id', require_user());

    if ($row['email_verified_at'] === null) {
        if (sent_recently((int) $row['id'], 'verify')) {
            fail('We just sent one. Please wait a minute before asking again.', 429);
        }
        send_verification($row);
    }
    send_json(['ok' => true]);
}

fail('Unknown action.');
