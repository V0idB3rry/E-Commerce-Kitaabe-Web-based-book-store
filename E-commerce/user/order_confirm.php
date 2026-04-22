<?php
// ============================================================
//  order_confirm.php
//  Shown after payment is verified / COD order placed
// ============================================================

include 'connect_database.php';

$order_id = (int)($_GET['order_id'] ?? 0);

if (!$order_id) {
    header('Location: index.php');
    exit;
}

$oid    = mysqli_real_escape_string($conn, (string)$order_id);
$order  = mysqli_fetch_assoc(mysqli_query($conn, "SELECT * FROM orders WHERE order_id=$oid"));

if (!$order) {
    header('Location: index.php');
    exit;
}

$items  = mysqli_query($conn, "SELECT * FROM order_items WHERE order_id=$oid");
$is_cod = $order['payment_method'] === 'cod';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Confirmed — ShopCart</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css" crossorigin="anonymous" referrerpolicy="no-referrer"/>
    <style>
        *{margin:0;padding:0;box-sizing:border-box;font-family:Arial,sans-serif}
        body{background:#eaeded;color:#111;min-height:100vh}
        .header{background:#232f3e;padding:14px 20px;display:flex;align-items:center;justify-content:space-between}
        .logo{color:#fff;font-size:22px;font-weight:700;text-decoration:none}
        .logo i{color:#ff9900;margin-right:6px}

        .page{max-width:780px;margin:40px auto;padding:0 16px}

        /* ── Hero banner ── */
        .banner{background:#fff;border-radius:8px;padding:36px 32px;text-align:center;margin-bottom:24px;border:1px solid #ddd}
        .check-circle{width:72px;height:72px;background:#007600;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 18px}
        .check-circle i{color:#fff;font-size:32px}
        .banner h1{font-size:26px;color:#007600;margin-bottom:8px}
        .banner p{color:#555;font-size:15px}
        .order-num{display:inline-block;background:#f0f8f0;border:1px solid #007600;color:#007600;
                   padding:6px 18px;border-radius:20px;font-weight:700;margin-top:14px;font-size:15px}

        /* ── Details card ── */
        .card{background:#fff;border-radius:8px;border:1px solid #ddd;margin-bottom:20px;overflow:hidden}
        .card-header{background:#37475a;color:#fff;padding:12px 20px;font-size:16px;font-weight:600}
        .card-body{padding:20px}

        /* delivery + payment grid */
        .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}
        @media(max-width:600px){.info-grid{grid-template-columns:1fr}}
        .info-block dt{font-size:12px;color:#888;text-transform:uppercase;letter-spacing:.5px;margin-bottom:4px}
        .info-block dd{font-size:14px;color:#111;line-height:1.6}

        /* payment badge */
        .pay-badge{display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:12px;font-size:13px;font-weight:600}
        .pay-badge.paid{background:#e8f5e9;color:#007600}
        .pay-badge.cod{background:#fff8e1;color:#b8860b}

        /* items table */
        .items-table{width:100%;border-collapse:collapse;font-size:14px}
        .items-table th{text-align:left;padding:10px 12px;background:#f7f7f7;border-bottom:1px solid #ddd;color:#555;font-weight:600}
        .items-table td{padding:12px;border-bottom:1px solid #f0f0f0;vertical-align:middle}
        .items-table tr:last-child td{border-bottom:none}
        .item-img{width:52px;height:52px;object-fit:contain;border-radius:4px;border:1px solid #eee}

        /* totals */
        .totals{margin-top:16px;max-width:280px;margin-left:auto}
        .totals-row{display:flex;justify-content:space-between;padding:6px 0;font-size:14px;color:#555}
        .totals-row.grand{border-top:2px solid #ddd;margin-top:6px;padding-top:10px;font-size:17px;font-weight:700;color:#111}

        /* CTA */
        .cta{display:flex;gap:14px;justify-content:center;margin-top:28px;flex-wrap:wrap}
        .btn{padding:12px 28px;border-radius:20px;font-size:15px;font-weight:600;cursor:pointer;text-decoration:none;border:none}
        .btn-primary{background:#ff9900;color:#111}
        .btn-primary:hover{background:#e88a00}
        .btn-outline{background:#fff;border:1px solid #aaa;color:#333}
        .btn-outline:hover{border-color:#333}
    </style>
</head>
<body>

<header class="header">
    <a href="index.php" class="logo"><i class="fa-solid fa-cart-shopping"></i> ShopCart</a>
    <span style="color:#fff;font-size:14px"><i class="fa-solid fa-check-circle" style="color:#ff9900"></i> Order Confirmed</span>
</header>

<div class="page">

    <!-- Banner -->
    <div class="banner">
        <div class="check-circle"><i class="fa-solid fa-check"></i></div>
        <h1><?= $is_cod ? 'Order Placed!' : 'Payment Successful!' ?></h1>
        <p>
            <?php if ($is_cod): ?>
                Your order has been placed. Pay ₹<?= number_format($order['order_total'], 2) ?> at the time of delivery.
            <?php else: ?>
                Your payment was confirmed and your order is being processed.
            <?php endif; ?>
        </p>
        <div class="order-num">Order #<?= str_pad($order['order_id'], 6, '0', STR_PAD_LEFT) ?></div>
    </div>

    <!-- Delivery + Payment Info -->
    <div class="card">
        <div class="card-header">Order Details</div>
        <div class="card-body">
            <div class="info-grid">
                <dl class="info-block">
                    <dt>Deliver to</dt>
                    <dd>
                        <strong><?= htmlspecialchars($order['user_name']) ?></strong><br>
                        <?= nl2br(htmlspecialchars($order['delivery_address'])) ?><br>
                        <?= htmlspecialchars($order['city']) ?> — <?= htmlspecialchars($order['pincode']) ?>
                        <?php if ($order['user_phone']): ?>
                            <br><?= htmlspecialchars($order['user_phone']) ?>
                        <?php endif; ?>
                    </dd>
                </dl>
                <dl class="info-block">
                    <dt>Payment</dt>
                    <dd>
                        <?php if ($is_cod): ?>
                            <span class="pay-badge cod"><i class="fa-solid fa-money-bill-wave"></i> Cash on Delivery</span>
                        <?php else: ?>
                            <span class="pay-badge paid"><i class="fa-solid fa-shield-check"></i> Paid via Razorpay</span>
                            <?php if ($order['razorpay_payment_id']): ?>
                                <br><small style="color:#888;font-size:12px">Txn: <?= htmlspecialchars($order['razorpay_payment_id']) ?></small>
                            <?php endif; ?>
                        <?php endif; ?>
                    </dd>
                    <dt style="margin-top:16px">Order date</dt>
                    <dd><?= date('d M Y, h:i A', strtotime($order['order_date'])) ?></dd>
                    <dt style="margin-top:12px">Status</dt>
                    <dd><strong style="color:#007600"><?= ucfirst($order['order_status']) ?></strong></dd>
                </dl>
            </div>
        </div>
    </div>

    <!-- Items -->
    <div class="card">
        <div class="card-header">Items Ordered</div>
        <div class="card-body" style="padding:0">
            <table class="items-table">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Price</th>
                        <th>Qty</th>
                        <th style="text-align:right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    <?php while ($item = mysqli_fetch_assoc($items)): ?>
                    <tr>
                        <td>
                            <div style="display:flex;align-items:center;gap:12px">
                                <img class="item-img" src="product-Source/<?= htmlspecialchars($item['product_image']) ?>" alt="">
                                <span><?= htmlspecialchars($item['product_name']) ?></span>
                            </div>
                        </td>
                        <td>₹<?= number_format($item['product_price'], 2) ?></td>
                        <td><?= (int)$item['quantity'] ?></td>
                        <td style="text-align:right;font-weight:600">₹<?= number_format($item['line_total'], 2) ?></td>
                    </tr>
                    <?php endwhile; ?>
                </tbody>
            </table>

            <div style="padding:16px 20px">
                <div class="totals">
                    <div class="totals-row"><span>Subtotal</span><span>₹<?= number_format($order['order_total'] - $order['delivery_fee'], 2) ?></span></div>
                    <div class="totals-row">
                        <span>Delivery</span>
                        <span><?= $order['delivery_fee'] == 0 ? '<span style="color:#007600">FREE</span>' : '₹' . number_format($order['delivery_fee'], 2) ?></span>
                    </div>
                    <div class="totals-row grand"><span>Order Total</span><span>₹<?= number_format($order['order_total'], 2) ?></span></div>
                </div>
            </div>
        </div>
    </div>

    <div class="cta">
        <a href="index.php" class="btn btn-primary"><i class="fa-solid fa-arrow-left"></i> Continue Shopping</a>
        <a href="add_to_cart.php" class="btn btn-outline"><i class="fa-solid fa-cart-shopping"></i> View Cart</a>
    </div>

</div>
</body>
</html>