<?php
// GET   admin_orders.php?status=&q=&page=&limit=   → orders, newest first
// GET   admin_orders.php?id=12                     → one order with its books
// PATCH admin_orders.php {id, order_status}        → change the delivery status
//
// Abandoned online payments (Razorpay pending/failed) are hidden unless ?include_unpaid=1.

require __DIR__ . '/bootstrap.php';
allow_methods('GET', 'PATCH');
require_admin();

const STATUSES = ['processing', 'shipped', 'delivered', 'cancelled'];

function admin_order(array $row): array
{
    return [
        'id'             => (int) $row['order_id'],
        'date'           => $row['order_date'],
        'customer_id'    => $row['user_id'] !== null ? (int) $row['user_id'] : null,
        'name'           => $row['user_name'],
        'email'          => $row['user_email'],
        'phone'          => $row['user_phone'],
        'address'        => $row['delivery_address'],
        'city'           => $row['city'],
        'pincode'        => $row['pincode'],
        'payment_method' => $row['payment_method'],
        'payment_status' => $row['payment_status'],
        'order_status'   => $row['order_status'],
        'razorpay_id'    => $row['razorpay_payment_id'],
        'delivery_fee'   => (float) $row['delivery_fee'],
        'total'          => (float) $row['order_total'],
        'item_count'     => isset($row['item_count']) ? (int) $row['item_count'] : null,
    ];
}

function is_fulfilled(array $order): bool
{
    return $order['payment_method'] === 'cod' || $order['payment_status'] === 'paid';
}

if (method() === 'GET' && isset($_GET['id'])) {
    $stmt = db()->prepare('SELECT * FROM orders WHERE order_id = ?');
    $stmt->execute([(int) $_GET['id']]);
    $row = $stmt->fetch() ?: fail('Order not found.', 404);

    $items = db()->prepare(
        'SELECT i.product_id, i.product_name, i.product_image, i.product_price, i.quantity, i.line_total,
                p.book_condition, p.product_quantity
         FROM order_items i LEFT JOIN product_details p ON p.SNO = i.product_id
         WHERE i.order_id = ? ORDER BY i.id'
    );
    $items->execute([$row['order_id']]);

    send_json(['order' => admin_order($row) + [
        'items' => array_map(fn ($r) => [
            'book_id'    => $r['product_id'] !== null ? (int) $r['product_id'] : null,
            'title'      => $r['product_name'],
            'image'      => $r['product_image'],
            'condition'  => $r['book_condition'],
            'price'      => (float) $r['product_price'],
            'quantity'   => (int) $r['quantity'],
            'line_total' => (float) $r['line_total'],
            'stock_now'  => $r['product_quantity'] !== null ? (int) $r['product_quantity'] : null,
        ], $items->fetchAll()),
    ]]);
}

if (method() === 'GET') {
    $where  = [];
    $params = [];

    if (empty($_GET['include_unpaid'])) {
        $where[] = "(o.payment_method = 'cod' OR o.payment_status = 'paid')";
    }
    if (in_array($_GET['status'] ?? '', STATUSES, true)) {
        $where[]  = 'o.order_status = ?';
        $params[] = $_GET['status'];
    }

    $q = trim((string) ($_GET['q'] ?? ''));
    if ($q !== '') {
        $id = (int) ltrim($q, '#');
        $like = '%' . addcslashes($q, '%_\\') . '%';
        $where[] = '(o.order_id = ? OR o.user_name LIKE ? OR o.user_email LIKE ? OR o.user_phone LIKE ? OR o.city LIKE ?)';
        array_push($params, $id, $like, $like, $like, $like);
    }

    $where_sql = $where ? 'WHERE ' . implode(' AND ', $where) : '';
    $limit  = max(1, min(100, (int) ($_GET['limit'] ?? 20)));
    $page   = max(1, (int) ($_GET['page'] ?? 1));
    $offset = ($page - 1) * $limit;

    $count = db()->prepare("SELECT COUNT(*) FROM orders o $where_sql");
    $count->execute($params);
    $total = (int) $count->fetchColumn();

    $stmt = db()->prepare(
        "SELECT o.*, (SELECT COALESCE(SUM(quantity), 0) FROM order_items WHERE order_id = o.order_id) AS item_count
         FROM orders o $where_sql
         ORDER BY o.order_date DESC, o.order_id DESC
         LIMIT $limit OFFSET $offset"
    );
    $stmt->execute($params);

    send_json([
        'orders' => array_map('admin_order', $stmt->fetchAll()),
        'total'  => $total,
        'page'   => $page,
        'pages'  => max(1, (int) ceil($total / $limit)),
    ]);
}

// ── PATCH: change status ─────────────────────────────────────
$input  = body();
$status = $input['order_status'] ?? '';
if (!in_array($status, STATUSES, true)) {
    fail('Choose a valid status.');
}

$pdo = db();
$pdo->beginTransaction();

$stmt = $pdo->prepare('SELECT * FROM orders WHERE order_id = ? FOR UPDATE');
$stmt->execute([(int) ($input['id'] ?? 0)]);
$order = $stmt->fetch();
if (!$order) {
    $pdo->rollBack();
    fail('Order not found.', 404);
}

// Cancelling a placed order puts its copies back on the shelf; un-cancelling takes them off again
if (is_fulfilled($order) && ($order['order_status'] === 'cancelled') !== ($status === 'cancelled')) {
    $sign = $status === 'cancelled' ? '+' : '-';
    $pdo->prepare(
        "UPDATE product_details p JOIN order_items i ON i.product_id = p.SNO
         SET p.product_quantity = GREATEST(p.product_quantity $sign i.quantity, 0)
         WHERE i.order_id = ?"
    )->execute([$order['order_id']]);
}

$pdo->prepare('UPDATE orders SET order_status = ? WHERE order_id = ?')->execute([$status, $order['order_id']]);
$pdo->commit();

$order['order_status'] = $status;
send_json(['order' => admin_order($order)]);
