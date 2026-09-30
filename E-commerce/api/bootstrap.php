<?php
// Included first by every endpoint: JSON responses, database, session and input helpers.

require __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', '0');

set_exception_handler(function (Throwable $e) {
    error_log('[api] ' . $e);
    send_json(['error' => 'Something went wrong on our side. Please try again.'], 500);
});

session_set_cookie_params(['httponly' => true, 'samesite' => 'Lax']);
session_start();

function send_json(array $data, int $status = 200): never
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function fail(string $message, int $status = 400): never
{
    send_json(['error' => $message], $status);
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        $pdo = new PDO(
            'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
            DB_USER,
            DB_PASS,
            [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]
        );
    }
    return $pdo;
}

/** JSON request body as an array (empty array when there is none). */
function body(): array
{
    static $data = null;
    if ($data === null) {
        $data = json_decode(file_get_contents('php://input'), true);
        if (!is_array($data)) {
            $data = [];
        }
    }
    return $data;
}

function method(): string
{
    return $_SERVER['REQUEST_METHOD'];
}

function allow_methods(string ...$methods): void
{
    if (!in_array(method(), $methods, true)) {
        header('Allow: ' . implode(', ', $methods));
        fail('Method not allowed', 405);
    }
}

function current_user_id(): ?int
{
    return isset($_SESSION['user_id']) ? (int) $_SESSION['user_id'] : null;
}

function require_user(): int
{
    $id = current_user_id();
    if ($id === null) {
        fail('Please sign in first.', 401);
    }
    return $id;
}

function current_admin_id(): ?int
{
    return isset($_SESSION['admin_id']) ? (int) $_SESSION['admin_id'] : null;
}

function require_admin(): int
{
    $id = current_admin_id();
    if ($id === null) {
        fail('Please sign in to the admin panel.', 401);
    }
    return $id;
}

/** Shape a product_details row for the frontend. */
function format_book(array $row): array
{
    $price = (float) $row['product_price'];
    $mrp   = $row['mrp'] !== null ? (float) $row['mrp'] : null;

    return [
        'id'          => (int) $row['SNO'],
        'title'       => $row['product_name'],
        'author'      => $row['writer_name'],
        'description' => $row['description'],
        'price'       => $price,
        'mrp'         => $mrp !== null && $mrp > $price ? $mrp : null,
        'category'    => $row['category'],
        'condition'   => $row['book_condition'],
        'stock'       => (int) $row['product_quantity'],
        'image'       => $row['product_image'],
    ];
}

function delivery_fee(float $subtotal): float
{
    return $subtotal >= FREE_DELIVERY_ABOVE ? 0 : DELIVERY_FEE;
}

/** Take an order's copies out of stock and empty the customer's cart. Call inside a transaction. */
function fulfil_order(PDO $pdo, int $order_id, int $user_id): void
{
    $pdo->prepare(
        'UPDATE product_details p
         JOIN order_items i ON i.product_id = p.SNO
         SET p.product_quantity = GREATEST(p.product_quantity - i.quantity, 0)
         WHERE i.order_id = ?'
    )->execute([$order_id]);

    $pdo->prepare('DELETE FROM user_cart WHERE user_id = ?')->execute([$user_id]);
}
