<?php
include 'connect_database.php';

/* -----------------------------
   HANDLE ACTIONS (DELETE / QTY)
------------------------------*/

if(isset($_GET['delete'])){
    $id = (int)$_GET['delete'];
    mysqli_query($conn,"DELETE FROM user_cart WHERE sno=$id");
    header("Location: add_to_cart.php");
    exit;
}

if(isset($_GET['inc'])){
    $id = (int)$_GET['inc'];
    mysqli_query($conn,"UPDATE user_cart SET quantity = quantity + 1 WHERE sno=$id");
    header("Location: add_to_cart.php");
    exit;
}

if(isset($_GET['dec'])){
    $id = (int)$_GET['dec'];
    mysqli_query($conn,"UPDATE user_cart SET quantity = GREATEST(quantity-1,1) WHERE sno=$id");
    header("Location: add_to_cart.php");
    exit;
}

/* -----------------------------
   FETCH CART
------------------------------*/

$sql = "SELECT * FROM user_cart";
$result = mysqli_query($conn,$sql);

$total_price = 0;
$delivery_fee = 40;
$free_delivery_threshold = 499;

$items = [];

while($row = mysqli_fetch_assoc($result)){
    $qty = isset($row['quantity']) ? (int)$row['quantity'] : 1;
    $line_total = $qty * (int)$row['product_price'];
    $total_price += $line_total;

    $row['qty'] = $qty;
    $row['line_total'] = $line_total;
    $items[] = $row;
}

$is_free = $total_price >= $free_delivery_threshold;
$final_total = $is_free ? $total_price : $total_price + $delivery_fee;
?>

<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Cart</title>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css">
<style>
body{font-family:Arial;background:#eaeded;margin:0}
.container{max-width:1400px;margin:20px auto;display:flex;gap:20px}
.cart{flex:7;background:white;border-radius:6px}
.summary{flex:3;background:white;border-radius:6px;padding:20px;height:fit-content}
.heading{background:#37475a;color:white;padding:15px;font-size:24px}
.product{display:flex;padding:20px;border-bottom:1px solid #ddd}
.product img{width:140px;height:140px;object-fit:contain}
.details{flex:1;padding-left:20px}
.name{font-size:18px;color:#0066c0}
.price{color:#b12704;font-weight:bold;margin:10px 0}
.qty-box{display:flex;align-items:center;margin-top:10px}
.qty-box a{padding:5px 10px;border:1px solid #aaa;text-decoration:none;margin:0 5px;background:#f0f0f0}
.delete{color:red;margin-left:15px;text-decoration:none}
.subtotal{display:flex;justify-content:space-between;margin:10px 0;font-size:18px}
.checkout{background:#ff9900;border:none;width:100%;padding:12px;border-radius:20px;cursor:pointer}
.empty{text-align:center;padding:40px}
</style>
</head>

<body>

<?php include 'navbar.php'; ?>

<div class="container">

<div class="cart">
<div class="heading">Shopping Cart</div>

<?php if(count($items)>0): ?>
<?php foreach($items as $row): ?>

<div class="product">
<img src="../user/product-Source/<?php echo $row['product_image']; ?>">

<div class="details">
<div class="name"><?php echo $row['product_name']; ?></div>
<div class="price">₹<?php echo $row['product_price']; ?></div>

<div class="qty-box">
<a href="?dec=<?php echo $row['sno']; ?>">−</a>
<span><?php echo $row['qty']; ?></span>
<a href="?inc=<?php echo $row['sno']; ?>">+</a>

<a class="delete" href="?delete=<?php echo $row['sno']; ?>">
<i class="fa fa-trash"></i> Delete
</a>
</div>

<div style="margin-top:8px;font-weight:bold">
Item total: ₹<?php echo $row['line_total']; ?>
</div>

</div>
</div>

<?php endforeach; ?>
<?php else: ?>

<div class="empty">
<h2>Your cart is empty</h2>
<a href="index.php"><button>Shop Now</button></a>
</div>

<?php endif; ?>
</div>

<?php if(count($items)>0): ?>
<div class="summary">

<h3>Order Summary</h3>

<div class="subtotal">
<span>Subtotal</span>
<span>₹<?php echo $total_price; ?></span>
</div>

<?php if($is_free): ?>
<div class="subtotal" style="color:green;">
<span>Delivery</span>
<span>FREE</span>
</div>
<?php else: ?>
<div class="subtotal">
<span>Delivery</span>
<span>₹<?php echo $delivery_fee; ?></span>
</div>
<?php endif; ?>

<hr>

<div class="subtotal" style="font-weight:bold;font-size:20px">
<span>Total</span>
<span>₹<?php echo $final_total; ?></span>
</div>

<button class="checkout" onclick="window.location.href='checkout.php'">Proceed to Checkout</button>

<div style="text-align:center;margin-top:10px;font-size:13px">
<?php
if($is_free){
    echo "You got FREE delivery 🎉";
}else{
    $remain = $free_delivery_threshold - $total_price;
    echo "Add ₹$remain more for FREE delivery";
}
?>
</div>

</div>
<?php endif; ?>

</div>
</body>
</html>
