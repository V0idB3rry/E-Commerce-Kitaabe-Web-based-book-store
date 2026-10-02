<?php
// POST sell_requests.php {name, email, phone, city, book_count, books, notes}
// "Sell your books" form. Signing in is optional.

require __DIR__ . '/bootstrap.php';
allow_methods('POST');
check_ip_limit('sell', 5);

$input = body();

$name       = trim((string) ($input['name'] ?? ''));
$email      = trim((string) ($input['email'] ?? ''));
$phone      = preg_replace('/\D/', '', (string) ($input['phone'] ?? ''));
$city       = trim((string) ($input['city'] ?? ''));
$book_count = (int) ($input['book_count'] ?? 0);
$books      = trim((string) ($input['books'] ?? ''));
$notes      = trim((string) ($input['notes'] ?? ''));

$errors = [];
if ($name === '')                               $errors['name']       = 'Enter your name.';
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) $errors['email']      = 'Enter a valid email address.';
if (strlen($phone) !== 10)                      $errors['phone']      = 'Enter a 10-digit phone number.';
if ($city === '')                               $errors['city']       = 'Enter your city.';
if ($book_count < 1 || $book_count > 500)       $errors['book_count'] = 'Enter how many books (1–500).';
if ($books === '')                              $errors['books']      = 'List the books you want to sell.';
if ($errors) {
    send_json(['error' => 'Please check the highlighted fields.', 'fields' => $errors], 422);
}

db()->prepare(
    'INSERT INTO sell_requests (user_id, name, email, phone, city, book_count, books, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
)->execute([current_user_id(), $name, $email, $phone, $city, $book_count, $books, $notes ?: null]);
$id = (int) db()->lastInsertId();
record_attempt('sell');

send_json(['id' => $id], 201);
