<?php
// GET admin_stats.php → numbers and short lists for the admin dashboard

require __DIR__ . '/bootstrap.php';
allow_methods('GET');
require_admin();

// A "real" order is cash on delivery or a completed online payment (abandoned Razorpay attempts don't count)
const REAL_ORDER = "(payment_method = 'cod' OR payment_status = 'paid')";
const LOW_STOCK  = 4;

$pdo = db();

$revenue = (float) $pdo->query(
    "SELECT COALESCE(SUM(order_total), 0) FROM orders
     WHERE order_date >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
       AND order_status <> 'cancelled'
       AND (payment_status = 'paid' OR (payment_method = 'cod' AND order_status = 'delivered'))"
)->fetchColumn();

$month = $pdo->query(
    'SELECT COUNT(*) AS total, COALESCE(SUM(DATE(order_date) = CURDATE()), 0) AS today FROM orders
     WHERE order_date >= DATE_FORMAT(CURDATE(), \'%Y-%m-01\') AND ' . REAL_ORDER
)->fetch();

$waiting = $pdo->query(
    "SELECT COUNT(*) AS total, MIN(order_date) AS oldest FROM orders
     WHERE order_status = 'processing' AND " . REAL_ORDER
)->fetch();

$low = $pdo->prepare(
    'SELECT SNO, product_image, product_name, writer_name, description, product_price, mrp,
            category, book_condition, product_quantity
     FROM product_details WHERE product_quantity <= ?
     ORDER BY product_quantity ASC, product_name ASC'
);
$low->execute([LOW_STOCK]);
$low_books = array_map('format_book', $low->fetchAll());

$new_sell_requests = (int) $pdo->query("SELECT COUNT(*) FROM sell_requests WHERE status = 'new'")->fetchColumn();

send_json([
    'revenue_this_month' => $revenue,
    'orders_this_month'  => (int) $month['total'],
    'orders_today'       => (int) $month['today'],
    'waiting_to_ship'    => (int) $waiting['total'],
    'oldest_waiting'     => $waiting['oldest'],
    'low_stock_limit'    => LOW_STOCK,
    'low_stock_count'    => count($low_books),
    'low_stock'          => array_slice($low_books, 0, 5),
    'new_sell_requests'  => $new_sell_requests,
]);
