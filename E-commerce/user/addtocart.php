
<?php
include "connect_database.php";
session_start();

if (isset($_GET['SNO'])) {
    $SNO = $_GET['SNO'];
    $query = "SELECT * FROM product_details WHERE SNO = $SNO";
    $result = mysqli_query($conn, $query);

    if(mysqli_num_rows($result) > 0){
        $row = mysqli_fetch_assoc($result);
        $productName = $row['product_name'];
        $productPrice = $row['product_price'];
        $productImage = $row['product_image'];

        $sql_insert_query = "INSERT INTO user_cart (product_name, product_price, product_image) 
               VALUES ('$productName', '$productPrice', '$productImage')";

        $inserted = mysqli_query($conn, $sql_insert_query);  
        
    }
}

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Item Added to your cart</title>
    <link rel="stylesheet" href="../user/CSS/itemAdded.css">
</head>
<body>
<div class="dialog--container">
    <div class="dialog-box">
    <video width="150px" height="150px" autoplay muted playsinline>
    <source src="http://localhost/E-commerce/user/product-Source/Animation.webm" type="video/webm">
</video>

    </div>
    <div class="para"><p>
    Item Added To Your Cart 
</p></div>
    <div class="btns">
    <a href="add_to_cart.php"><button id="cart--btn">Check Cart</button></a>
    <a href="index.php"><button id="shop--btn" >Continue shopping</button></a>
    </div>
</div>

    
</body>
</html>