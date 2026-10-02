<?php
// Included first by every endpoint: JSON responses, database, session and input helpers.

require __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', '0');

set_exception_handler(function (Throwable $e) {
    error_log('[api] ' . $e);
    send_json(['error' => 'Something went wrong on our side. Please try again.'], 500);
});

// ponytail: only sees HTTPS terminated by Apache itself; behind a proxy, also check X-Forwarded-Proto
define('IS_HTTPS', !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off');
session_set_cookie_params(['httponly' => true, 'samesite' => 'Lax', 'secure' => IS_HTTPS]);
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

/** Mark a Razorpay order paid and fulfil it. Call inside a transaction, with the order row locked. */
function mark_paid(PDO $pdo, int $order_id, int $user_id, string $payment_id): void
{
    $pdo->prepare("UPDATE orders SET payment_status = 'paid', razorpay_payment_id = ? WHERE order_id = ?")
        ->execute([$payment_id, $order_id]);
    fulfil_order($pdo, $order_id, $user_id);
}

/**
 * Send a plain-text email through the SMTP server set in secrets.php. With no SMTP server (local dev),
 * the whole email, links included, goes to the PHP error log so you can still click through.
 */
function send_email(string $to, string $subject, string $text): void
{
    if (SMTP_HOST === '') {
        error_log("[mail] SMTP isn't set up in api/secrets.php, so this email was only logged. To: $to | $subject\n$text");
        return;
    }
    try {
        smtp_send($to, $subject, $text);
    } catch (RuntimeException $e) {
        error_log("[mail] sending to $to failed: " . $e->getMessage());  // never log the body: it holds live links
    }
}

/** Minimal SMTP client: smtp_encryption "ssl" (port 465), "tls" (STARTTLS, port 587) or "none" (local test servers). */
function smtp_send(string $to, string $subject, string $text): void
{
    $remote = (SMTP_ENCRYPTION === 'ssl' ? 'ssl://' : 'tcp://') . SMTP_HOST . ':' . SMTP_PORT;
    $smtp = @stream_socket_client($remote, $errno, $errstr, 10);
    if (!$smtp) {
        throw new RuntimeException("can't connect to $remote: $errstr");
    }
    stream_set_timeout($smtp, 10);

    // Each command gets a reply; multi-line replies use "250-" on every line but the last
    $send = function (?string $command, int $expected) use ($smtp): void {
        if ($command !== null) {
            fwrite($smtp, $command . "\r\n");
        }
        do {
            $line = fgets($smtp, 515);
        } while ($line !== false && ($line[3] ?? ' ') === '-');

        if ($line === false || (int) $line !== $expected) {
            throw new RuntimeException('server replied: ' . ($line === false ? 'nothing (timed out)' : trim($line)));
        }
    };

    $host = parse_url(APP_URL, PHP_URL_HOST) ?: 'localhost';
    $from = preg_match('/<([^>]+)>/', MAIL_FROM, $m) ? $m[1] : MAIL_FROM;

    $send(null, 220);
    $send("EHLO $host", 250);
    if (SMTP_ENCRYPTION === 'tls') {
        $send('STARTTLS', 220);
        if (!stream_socket_enable_crypto($smtp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
            throw new RuntimeException('STARTTLS handshake failed');
        }
        $send("EHLO $host", 250);
    }
    if (SMTP_USER !== '') {
        $send('AUTH LOGIN', 334);
        $send(base64_encode(SMTP_USER), 334);
        $send(base64_encode(SMTP_PASS), 235);
    }
    $send("MAIL FROM:<$from>", 250);
    $send("RCPT TO:<$to>", 250);
    $send('DATA', 354);

    $headers = [
        'Date: ' . date('r'),
        'From: ' . MAIL_FROM,
        "To: <$to>",
        'Subject: =?UTF-8?B?' . base64_encode($subject) . '?=',
        'Message-ID: <' . bin2hex(random_bytes(16)) . "@$host>",
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=utf-8',
        'Content-Transfer-Encoding: base64',
    ];
    // A base64 body never has a line that is just ".", so it can't end the message early
    $send(implode("\r\n", $headers) . "\r\n\r\n" . chunk_split(base64_encode($text)) . '.', 250);

    fwrite($smtp, "QUIT\r\n");  // the email is already accepted; no need to wait for the goodbye
    fclose($smtp);
}

/** Stop password guessing: 429 after 5 failures for one email, or 20 from one IP, in 15 minutes. */
function check_login_attempts(string $scope, string $email): void
{
    $stmt = db()->prepare(
        'SELECT COALESCE(SUM(email = ?), 0) AS by_email, COALESCE(SUM(ip = ?), 0) AS by_ip
         FROM login_attempts
         WHERE scope = ? AND created_at > NOW() - INTERVAL 15 MINUTE AND (email = ? OR ip = ?)'
    );
    $ip = $_SERVER['REMOTE_ADDR'] ?? '';
    $stmt->execute([$email, $ip, $scope, $email, $ip]);
    $counts = $stmt->fetch();

    if ($counts['by_email'] >= 5 || $counts['by_ip'] >= 20) {
        header('Retry-After: 900');
        fail('Too many sign-in attempts. Please wait 15 minutes and try again.', 429);
    }
}

/** 429 once this IP has $max entries for $scope ("register", "sell") in the last hour. Pair with record_attempt(). */
function check_ip_limit(string $scope, int $max): void
{
    $stmt = db()->prepare('SELECT COUNT(*) FROM login_attempts WHERE scope = ? AND ip = ? AND created_at > NOW() - INTERVAL 1 HOUR');
    $stmt->execute([$scope, $_SERVER['REMOTE_ADDR'] ?? '']);

    if ($stmt->fetchColumn() >= $max) {
        header('Retry-After: 3600');
        fail('Too many requests from your network. Please try again in an hour.', 429);
    }
}

/** Log a failed sign-in (with its email) or a submitted form (no email) for the limits above. */
function record_attempt(string $scope, string $email = ''): void
{
    $pdo = db();
    $pdo->prepare('INSERT INTO login_attempts (scope, email, ip) VALUES (?, ?, ?)')
        ->execute([$scope, $email, $_SERVER['REMOTE_ADDR'] ?? '']);
    $pdo->exec('DELETE FROM login_attempts WHERE created_at < NOW() - INTERVAL 1 DAY');
}

function clear_login_failures(string $scope, string $email): void
{
    db()->prepare('DELETE FROM login_attempts WHERE scope = ? AND email = ?')->execute([$scope, $email]);
}

// CSRF: a browser request that changes data must come from our own site (Origin host = our host; the
// port may differ, for the Vite dev server) and carry JSON or a file upload, which a plain HTML form on
// another site can't send as JSON. Requests with no Origin (Razorpay's webhook, curl) are let through.
if (!in_array(method(), ['GET', 'HEAD', 'OPTIONS'], true)) {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? null;
    if ($origin !== null && parse_url($origin, PHP_URL_HOST) !== parse_url('http://' . ($_SERVER['HTTP_HOST'] ?? ''), PHP_URL_HOST)) {
        fail('This request came from another website and was blocked.', 403);
    }
    $type = $_SERVER['CONTENT_TYPE'] ?? '';
    if ($type !== '' && !preg_match('#^(application/json|multipart/form-data)\b#i', $type)) {
        fail('Unsupported content type.', 415);
    }
    unset($origin, $type);
}

// Central access guard: runs for every endpoint. Endpoints not listed here are admin-only,
// so a new file is locked down until it's added to the right list.
const PUBLIC_ENDPOINTS = ['auth', 'admin_auth', 'books', 'categories', 'sell_requests', 'razorpay_webhook'];
const USER_ENDPOINTS   = ['cart', 'orders', 'verify_payment'];

$endpoint = basename($_SERVER['SCRIPT_FILENAME'], '.php');
if (in_array($endpoint, USER_ENDPOINTS, true)) {
    require_user();
} elseif (!in_array($endpoint, PUBLIC_ENDPOINTS, true)) {
    require_admin();
}
unset($endpoint);
