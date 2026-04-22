<?php
include 'connect_database.php';
session_start();
if (!isset($_SESSION["username"])) {
    header("Location: login.php");
    exit;
}

// ── Handle Add Product POST ───────────────────────────────────
if ($_SERVER["REQUEST_METHOD"] == "POST" && isset($_POST['product_name'])) {
    $product_name  = $_POST['product_name'];
    $writer_name   = $_POST['writer_name'];
    $description   = $_POST['description'];
    $product_price = $_POST['product_price'];
    $category      = $_POST['category'];
    $stock         = $_POST['productQuantity'];
    $file          = $_FILES['productImage'];
    $filename      = $file['name'];
    $filetmpname   = $file['tmp_name'];

    $target_directory = "../user/product-Source/";
    $target_file      = $target_directory . basename($filename);
    move_uploaded_file($filetmpname, $target_file);

    $sql = "INSERT INTO product_details (product_image, product_name, product_price, category, writer_name, description, product_quantity)
            VALUES ('$filename', '$product_name', '$product_price', '$category', '$writer_name', '$description', '$stock')";
    if (mysqli_query($conn, $sql)) {
        $message = "<div class='alert-success'>Product added successfully!</div>";
    } else {
        $message = "<div class='alert-error'>Error: " . mysqli_error($conn) . "</div>";
    }
}

// ── Handle Order Status Update ────────────────────────────────
if ($_SERVER["REQUEST_METHOD"] == "POST" && isset($_POST['order_id'], $_POST['order_status'])) {
    $oid    = (int)$_POST['order_id'];
    $status = mysqli_real_escape_string($conn, $_POST['order_status']);
    $allowed = ['processing', 'shipped', 'delivered', 'cancelled'];
    if (in_array($status, $allowed)) {
        mysqli_query($conn, "UPDATE orders SET order_status='$status' WHERE order_id=$oid");
    }
}

// ── Fetch data ────────────────────────────────────────────────
$results          = mysqli_query($conn, "SELECT * FROM product_details");
$results_category = mysqli_query($conn, "SELECT * FROM category");

// Stats
$total_products = mysqli_num_rows(mysqli_query($conn, "SELECT SNO FROM product_details"));
$total_orders   = 0;
$total_revenue  = 0;
$order_check    = mysqli_query($conn, "SHOW TABLES LIKE 'orders'");
$orders_exist   = mysqli_num_rows($order_check) > 0;

if ($orders_exist) {
    $r = mysqli_fetch_assoc(mysqli_query($conn, "SELECT COUNT(*) AS c, SUM(order_total) AS rev FROM orders"));
    $total_orders  = (int)$r['c'];
    $total_revenue = (float)($r['rev'] ?? 0);
    $recent_result = mysqli_query($conn, "SELECT * FROM orders ORDER BY order_date DESC LIMIT 10");
    $all_orders    = mysqli_query($conn, "SELECT * FROM orders ORDER BY order_date DESC");
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Panel</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        *{margin:0;padding:0;box-sizing:border-box;font-family:'Segoe UI',sans-serif}
        :root{--primary:#4361ee;--dark:#1e1e2c;--light:#f8f9fa;--gray:#6c757d;--danger:#e5383b;--success:#28a745;--warning:#fca311}
        body{background:#f5f7fb;color:#333;display:flex;min-height:100vh}

        /* Sidebar */
        .sidebar{width:230px;background:var(--dark);color:#fff;height:100vh;position:fixed;left:0;top:0;overflow-y:auto}
        .sidebar-header{padding:20px;background:var(--primary);text-align:center}
        .sidebar-header h3{font-weight:600;font-size:18px}
        .sidebar-menu{padding:10px 0}
        .sidebar-menu ul{list-style:none}
        .sidebar-menu li{margin-bottom:2px}
        .sidebar-menu a{color:#ccc;padding:12px 20px;text-decoration:none;display:flex;align-items:center;gap:10px;transition:all .2s;border-left:4px solid transparent;font-size:14px}
        .sidebar-menu a:hover,.sidebar-menu a.active{background:rgba(255,255,255,.1);border-left-color:var(--primary);color:#fff}
        .sidebar-menu a i{font-size:16px;width:18px}

        /* Main */
        .main-content{flex:1;margin-left:230px;padding:20px}
        .topbar{display:flex;justify-content:space-between;align-items:center;padding:14px 20px;background:#fff;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.08);margin-bottom:20px}
        .topbar h2{color:var(--dark);font-size:20px;font-weight:600}
        .admin-badge{background:var(--primary);color:#fff;padding:6px 14px;border-radius:20px;font-size:13px}

        /* Stats */
        .stats-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:24px}
        .stat-card{background:#fff;border-radius:8px;padding:20px;box-shadow:0 2px 8px rgba(0,0,0,.08);text-align:center}
        .stat-card i{font-size:30px;margin-bottom:12px;color:var(--primary)}
        .stat-card h3{font-size:26px;margin-bottom:4px;color:var(--dark)}
        .stat-card p{color:var(--gray);font-size:13px}

        /* Content sections */
        .content-section{display:none}
        #dashboard-content{display:block}

        /* Tables */
        .table-wrap{overflow-x:auto;margin-top:16px}
        table{width:100%;border-collapse:collapse;font-size:13px}
        thead th{background:#f8f9fa;padding:11px 14px;text-align:left;font-weight:600;color:var(--dark);border-bottom:2px solid #e0e0e0}
        tbody td{padding:11px 14px;border-bottom:1px solid #f0f0f0;vertical-align:middle}
        tbody tr:hover{background:#fafafa}

        /* Badges */
        .badge{display:inline-block;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600}
        .badge-paid{background:#d4edda;color:#155724}
        .badge-cod{background:#d1ecf1;color:#0c5460}
        .badge-pending{background:#fff3cd;color:#856404}
        .badge-failed{background:#f8d7da;color:#721c24}
        .badge-processing{background:#cce5ff;color:#004085}
        .badge-shipped{background:#fff3cd;color:#856404}
        .badge-delivered{background:#d4edda;color:#155724}
        .badge-cancelled{background:#f8d7da;color:#721c24}

        /* Forms */
        .form-card{background:#fff;border-radius:8px;padding:24px;box-shadow:0 2px 8px rgba(0,0,0,.08)}
        .form-group{margin-bottom:18px}
        .form-group label{display:block;margin-bottom:6px;font-weight:500;font-size:14px;color:var(--dark)}
        .form-control{width:100%;padding:10px 12px;border:1px solid #ddd;border-radius:6px;font-size:14px;transition:border .2s}
        .form-control:focus{border-color:var(--primary);outline:none;box-shadow:0 0 0 3px rgba(67,97,238,.15)}
        .form-row{display:flex;gap:16px}
        .form-row .form-group{flex:1}

        /* Buttons */
        .btn{padding:10px 18px;border:none;border-radius:6px;cursor:pointer;font-size:14px;font-weight:500;transition:all .2s;display:inline-flex;align-items:center;gap:6px}
        .btn-primary{background:var(--primary);color:#fff}
        .btn-primary:hover{background:#3451d1}
        .btn-danger{background:var(--danger);color:#fff}
        .btn-danger:hover{background:#c82333}
        .btn-sm{padding:6px 12px;font-size:12px}

        /* Product image in table */
        .prod-img{width:44px;height:44px;object-fit:contain;border-radius:4px;border:1px solid #eee}

        /* Alerts */
        .alert-success{background:#d4edda;color:#155724;padding:12px 16px;border-radius:6px;margin-bottom:16px;font-size:14px}
        .alert-error{background:#f8d7da;color:#721c24;padding:12px 16px;border-radius:6px;margin-bottom:16px;font-size:14px}

        /* Status select */
        .status-sel{padding:5px 8px;border-radius:4px;border:1px solid #ddd;font-size:12px;background:#fff;cursor:pointer}

        /* Section header */
        .section-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px}
        .section-head h2{font-size:18px;font-weight:600;color:var(--dark)}

        @media(max-width:768px){.main-content{margin-left:0}.sidebar{display:none}.form-row{flex-direction:column}}
    </style>
</head>
<body>

<!-- Sidebar -->
<div class="sidebar">
    <div class="sidebar-header"><h3>Admin Panel</h3></div>
    <div class="sidebar-menu">
        <ul>
            <li><a href="#" class="active" data-content="dashboard"><i class="fas fa-tachometer-alt"></i> <span>Dashboard</span></a></li>
            <li><a href="#" data-content="products"><i class="fas fa-box"></i> <span>Products</span></a></li>
            <li><a href="#" data-content="add-product"><i class="fas fa-plus-circle"></i> <span>Add Product</span></a></li>
            <li><a href="#" data-content="orders"><i class="fas fa-shopping-cart"></i> <span>Orders</span></a></li>
            <li><a href="logout.php"><i class="fas fa-sign-out-alt"></i> <span>Logout</span></a></li>
        </ul>
    </div>
</div>

<!-- Main Content -->
<div class="main-content">
    <div class="topbar">
        <h2 id="page-title">Dashboard</h2>
        <span class="admin-badge"><i class="fas fa-user-shield"></i> Admin</span>
    </div>

    <div id="dashboard-content">
        <!-- Real Stats -->
        <div class="stats-cards">
            <div class="stat-card">
                <i class="fas fa-shopping-cart"></i>
                <h3><?= $total_orders ?></h3>
                <p>Total Orders</p>
            </div>
            <div class="stat-card">
                <i class="fas fa-box"></i>
                <h3><?= $total_products ?></h3>
                <p>Total Products</p>
            </div>
            <div class="stat-card">
                <i class="fas fa-rupee-sign"></i>
                <h3>₹<?= number_format($total_revenue, 0) ?></h3>
                <p>Total Revenue</p>
            </div>
        </div>

        <!-- Recent Orders -->
        <div class="form-card">
            <div class="section-head">
                <h2>Recent Orders</h2>
                <a href="#" data-content="orders" class="btn btn-primary btn-sm sidebar-link"><i class="fas fa-eye"></i> View All</a>
            </div>
            <?php if (!$orders_exist): ?>
                <p style="color:#888;font-size:14px">Orders table not set up yet. Run payment_setup.sql in phpMyAdmin.</p>
            <?php elseif (mysqli_num_rows($recent_result) === 0): ?>
                <p style="color:#888;font-size:14px;text-align:center;padding:24px">No orders placed yet.</p>
            <?php else: ?>
            <div class="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>Payment</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php while ($o = mysqli_fetch_assoc($recent_result)): ?>
                        <?php
                            $pay_cls = match($o['payment_status']) {
                                'paid'        => 'badge-paid',
                                'cod_pending' => 'badge-cod',
                                'failed'      => 'badge-failed',
                                default       => 'badge-pending'
                            };
                            $ord_cls = match($o['order_status']) {
                                'shipped'   => 'badge-shipped',
                                'delivered' => 'badge-delivered',
                                'cancelled' => 'badge-cancelled',
                                default     => 'badge-processing'
                            };
                        ?>
                        <tr>
                            <td><strong>#<?= str_pad($o['order_id'], 4, '0', STR_PAD_LEFT) ?></strong></td>
                            <td><?= htmlspecialchars($o['user_name']) ?><br><small style="color:#888"><?= htmlspecialchars($o['user_phone'] ?? '') ?></small></td>
                            <td><?= date('d M Y', strtotime($o['order_date'])) ?></td>
                            <td><strong>₹<?= number_format($o['order_total'], 2) ?></strong></td>
                            <td><span class="badge <?= $pay_cls ?>"><?= ucfirst(str_replace('_', ' ', $o['payment_status'])) ?></span></td>
                            <td><span class="badge <?= $ord_cls ?>"><?= ucfirst($o['order_status']) ?></span></td>
                        </tr>
                        <?php endwhile; ?>
                    </tbody>
                </table>
            </div>
            <?php endif; ?>
        </div>
    </div>

    <!-- Products Section -->
    <div id="products-content" class="content-section">
        <div class="form-card">
            <div class="section-head"><h2>All Products</h2></div>
            <div class="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Image</th>
                            <th>Product Name</th>
                            <th>Category</th>
                            <th>Price</th>
                            <th>Stock</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php
                        // Re-query since pointer may be exhausted
                        $prod_list = mysqli_query($conn, "SELECT * FROM product_details");
                        while ($product = mysqli_fetch_assoc($prod_list)):
                        ?>
                        <tr>
                            <td><img class="prod-img" src="../user/product-Source/<?= htmlspecialchars($product['product_image']) ?>" alt=""></td>
                            <td><?= htmlspecialchars($product['product_name']) ?></td>
                            <td><?= htmlspecialchars($product['category']) ?></td>
                            <td>₹<?= number_format($product['product_price'], 2) ?></td>
                            <td><?= (int)($product['product_quantity'] ?? 0) ?></td>
                            <td>
                                <a href="update.php?SNO=<?= $product['SNO'] ?>"><button class="btn btn-primary btn-sm"><i class="fas fa-edit"></i></button></a>
                                <a href="delete.php?SNO=<?= $product['SNO'] ?>"><button class="btn btn-danger btn-sm"><i class="fas fa-trash"></i></button></a>
                            </td>
                        </tr>
                        <?php endwhile; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>

    <!-- Add Product Section -->
    <div id="add-product-content" class="content-section">
        <div class="form-card">
            <div class="section-head"><h2>Add New Product</h2></div>
            <?php if (isset($message)) echo $message; ?>
            <form method="POST" enctype="multipart/form-data">
                <div class="form-row">
                    <div class="form-group">
                        <label>Product Name *</label>
                        <input type="text" class="form-control" name="product_name" placeholder="Enter product name" required>
                    </div>
                    <div class="form-group">
                        <label>Writer / Brand Name *</label>
                        <input type="text" class="form-control" name="writer_name" placeholder="Enter writer or brand name" required>
                    </div>
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <textarea class="form-control" name="description" rows="3" placeholder="Enter product description"></textarea>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Price (₹) *</label>
                        <input type="number" class="form-control" name="product_price" placeholder="e.g. 499" required>
                    </div>
                    <div class="form-group">
                        <label>Stock Quantity *</label>
                        <input type="number" class="form-control" name="productQuantity" placeholder="e.g. 100" required>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label>Category *</label>
                        <select class="form-control" name="category">
                            <?php
                            $cat_list = mysqli_query($conn, "SELECT * FROM category");
                            while ($row = mysqli_fetch_assoc($cat_list)) {
                                echo "<option value='" . htmlspecialchars($row['category']) . "'>" . htmlspecialchars($row['category']) . "</option>";
                            }
                            ?>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Product Image *</label>
                        <input type="file" class="form-control" name="productImage" accept="image/*" required>
                    </div>
                </div>
                <button type="submit" class="btn btn-primary"><i class="fas fa-plus"></i> Add Product</button>
            </form>
        </div>
    </div>

    <!-- Orders Section -->
    <div id="orders-content" class="content-section">
        <div class="form-card">
            <div class="section-head"><h2>All Orders</h2></div>
            <?php if (!$orders_exist): ?>
                <p style="color:#888;font-size:14px">Run payment_setup.sql in phpMyAdmin to set up orders table.</p>
            <?php elseif (mysqli_num_rows($all_orders) === 0): ?>
                <p style="color:#888;text-align:center;padding:30px">No orders yet.</p>
            <?php else: ?>
            <div class="table-wrap">
                <table>
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Date</th>
                            <th>Total</th>
                            <th>Payment</th>
                            <th>Order Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php
                        $all_orders2 = mysqli_query($conn, "SELECT * FROM orders ORDER BY order_date DESC");
                        while ($o = mysqli_fetch_assoc($all_orders2)):
                            $pay_cls = match($o['payment_status']) {
                                'paid'        => 'badge-paid',
                                'cod_pending' => 'badge-cod',
                                'failed'      => 'badge-failed',
                                default       => 'badge-pending'
                            };
                        ?>
                        <tr>
                            <td><strong>#<?= str_pad($o['order_id'], 4, '0', STR_PAD_LEFT) ?></strong></td>
                            <td>
                                <?= htmlspecialchars($o['user_name']) ?><br>
                                <small style="color:#888"><?= htmlspecialchars($o['user_phone'] ?? '') ?></small><br>
                                <small style="color:#aaa"><?= htmlspecialchars($o['city'] ?? '') ?></small>
                            </td>
                            <td><?= date('d M Y, h:i A', strtotime($o['order_date'])) ?></td>
                            <td><strong>₹<?= number_format($o['order_total'], 2) ?></strong><br>
                                <small style="color:#888"><?= $o['delivery_fee'] == 0 ? 'Free delivery' : '+ ₹'.$o['delivery_fee'].' delivery' ?></small>
                            </td>
                            <td><span class="badge <?= $pay_cls ?>"><?= ucfirst(str_replace('_', ' ', $o['payment_status'])) ?></span><br>
                                <small style="color:#aaa"><?= strtoupper($o['payment_method']) ?></small>
                            </td>
                            <td>
                                <form method="POST" style="display:inline">
                                    <input type="hidden" name="order_id" value="<?= $o['order_id'] ?>">
                                    <select name="order_status" class="status-sel" onchange="this.form.submit()">
                                        <option value="processing" <?= $o['order_status']==='processing'?'selected':'' ?>>Processing</option>
                                        <option value="shipped"    <?= $o['order_status']==='shipped'?'selected':'' ?>>Shipped</option>
                                        <option value="delivered"  <?= $o['order_status']==='delivered'?'selected':'' ?>>Delivered</option>
                                        <option value="cancelled"  <?= $o['order_status']==='cancelled'?'selected':'' ?>>Cancelled</option>
                                    </select>
                                </form>
                            </td>
                        </tr>
                        <?php endwhile; ?>
                    </tbody>
                </table>
            </div>
            <?php endif; ?>
        </div>
    </div>

</div><!-- /.main-content -->

<script>
document.addEventListener('DOMContentLoaded', function () {
    const links   = document.querySelectorAll('.sidebar-menu a[data-content], a.sidebar-link[data-content]');
    const title   = document.getElementById('page-title');

    function showSection(contentId, label) {
        document.querySelectorAll('.content-section, #dashboard-content').forEach(s => s.style.display = 'none');
        const el = document.getElementById(contentId + '-content');
        if (el) el.style.display = 'block';
        title.textContent = label;
        document.querySelectorAll('.sidebar-menu a').forEach(l => l.classList.remove('active'));
        document.querySelectorAll('.sidebar-menu a[data-content="' + contentId + '"]').forEach(l => l.classList.add('active'));
    }

    links.forEach(link => {
        link.addEventListener('click', function (e) {
            const contentId = this.getAttribute('data-content');
            if (!contentId) return;
            e.preventDefault();
            const label = this.querySelector('span') ? this.querySelector('span').textContent : this.textContent.trim();
            showSection(contentId, label);
        });
    });
});
</script>
</body>
</html>