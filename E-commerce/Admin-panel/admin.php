<?php
include "connect_database.php";
session_start();
if(!isset($_SESSION["username"])){
    header("Location: login.php");
}

$sql = "SELECT * FROM product_details";
$results = mysqli_query($conn, $sql);
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard</title>
    <link rel="stylesheet" href="admin.css">
</head>
<body>

    <?php
    include '../user/loader.php';
    ?>

    <?php require '../user/navbar.php'; ?>
    <div class="header">
        <div class="logo">
            <h1>Admin Dashboard</h1>
        </div>
        <div class="hamburger" onclick="toggleMenu()">
            &#9776;
        </div>
        <div class="nav-links">
            <a href='logout.php'>Logout</a>
            <a href='addproduct.php'>Add Product</a>
            <a href='../user/index.php'>Home Page</a>
        </div>
    </div>

    <div class="content">
        <h3 class="login-message" style="color: green; margin-top: 20px;">You are logged in</h3>

        <table>
            <thead>
                <tr>
                    <th>S.NO.</th>
                    <th>Product Image</th>
                    <th>Product Name</th>
                    <th>Product Price</th>
                    <th>Category</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <?php while($product = mysqli_fetch_assoc($results)): ?>
                    <tr>
                        <td><?php echo $product["SNO"]; ?></td>
                        <td><img src="../user/product-Source/<?php echo $product['product_image']; ?>" alt="Product Image"></td>
                        <td><?php echo $product["product_name"]; ?></td>
                        <td>₹<?php echo $product["product_price"]; ?></td>
                        <td><?php echo $product["category"]; ?></td>
                        <td>
                            <a href="update.php?SNO=<?php echo $product['SNO']; ?>"><button class="btn btn-primary"><i class="fas fa-edit"></i></button></a>
                            <a href="delete.php?SNO=<?php echo $product['SNO']; ?>"><button class="btn btn-danger"><i class="fas fa-trash"></i></button></a>
                        </td>
                    </tr>
                <?php endwhile; ?>
            </tbody>
        </table>
    </div>

    <script>
        function toggleMenu() {
            var navLinks = document.querySelector('.nav-links');
            navLinks.classList.toggle('active');
        }

        setTimeout(function() {
            var message = document.querySelector('.login-message');
            if (message) {
                message.style.transition = "opacity 0.5s ease";
                message.style.opacity = '0';
                setTimeout(() => message.remove(), 500);
            }
        }, 2000);
    </script>
</body>
</html>
