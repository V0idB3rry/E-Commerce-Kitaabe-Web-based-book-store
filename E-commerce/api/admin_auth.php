<?php
// GET  admin_auth.php                              → the signed-in admin (or null)
// POST admin_auth.php {action:"login", email, password}
// POST admin_auth.php {action:"logout"}
// Admin accounts are created from the command line: php database/create_admin.php

require __DIR__ . '/bootstrap.php';
allow_methods('GET', 'POST');

function public_admin(array $row): array
{
    return ['id' => (int) $row['id'], 'name' => $row['name'], 'email' => $row['email']];
}

if (method() === 'GET') {
    $row = null;
    if ($id = current_admin_id()) {
        $stmt = db()->prepare('SELECT id, name, email FROM admins WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch() ?: null;
    }
    send_json(['admin' => $row ? public_admin($row) : null]);
}

$input  = body();
$action = $input['action'] ?? '';

if ($action === 'logout') {
    unset($_SESSION['admin_id']);
    session_regenerate_id(true);
    send_json(['admin' => null]);
}

if ($action === 'login') {
    $email    = strtolower(trim((string) ($input['email'] ?? '')));
    $password = (string) ($input['password'] ?? '');

    check_login_attempts('admin', $email);

    $stmt = db()->prepare('SELECT id, name, email, password_hash FROM admins WHERE email = ?');
    $stmt->execute([$email]);
    $row = $stmt->fetch();

    if (!$row || !password_verify($password, $row['password_hash'])) {
        record_attempt('admin', $email);
        fail('That email and password don’t match an admin account.', 401);
    }

    clear_login_failures('admin', $email);
    session_regenerate_id(true);
    $_SESSION['admin_id'] = (int) $row['id'];
    db()->prepare('UPDATE admins SET last_login_at = NOW() WHERE id = ?')->execute([$row['id']]);

    send_json(['admin' => public_admin($row)]);
}

fail('Unknown action.');
