<?php
include "connect_database.php";

// Fetch all categories
$sql_category = "SELECT * FROM category";
$results_category = mysqli_query($conn, $sql_category);

// Initialize the WHERE clause
$where_clause = "";

// Check if form is submitted
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    if (isset($_POST['categories']) && is_array($_POST['categories'])) {
        $selected_categories = array_map(function($cat) use ($conn) {
            return "'" . mysqli_real_escape_string($conn, $cat) . "'";
        }, $_POST['categories']);
        $where_clause = "WHERE category IN (" . implode(",", $selected_categories) . ")";
    }
}

// Fetch products based on filter
$sql = "SELECT * FROM product_details $where_clause";
$results = mysqli_query($conn, $sql);
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Product Details | Second Shelf</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #2A6B3F;
            --primary-light: #3A8A55;
            --accent: #FFA726;
            --accent-dark: #F57C00;
            --light-bg: #F9F9F9;
            --card-bg: #FFFFFF;
            --text-dark: #2D3748;
            --text-light: #718096;
            --border: #E2E8F0;
            --shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
            --shadow-hover: 0 8px 24px rgba(0, 0, 0, 0.12);
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Inter', sans-serif;
        }
        
        body {
            background-color: var(--light-bg);
            color: var(--text-dark);
            line-height: 1.6;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        /* Main Product Section */
        .mainContainer {
            display: flex;
            flex-wrap: wrap;
            gap: 40px;
            background-color: var(--card-bg);
            padding: 30px;
            border-radius: 12px;
            box-shadow: var(--shadow);
            margin-bottom: 40px;
        }
        
        .productImageSection {
            flex: 1;
            min-width: 300px;
            display: flex;
            justify-content: center;
            align-items: flex-start;
        }
        
        .productImageSection img {
            max-width: 100%;
            height: auto;
            border-radius: 12px;
            box-shadow: var(--shadow);
        }
        
        .productDetails {
            flex: 1;
            min-width: 300px;
        }
        
        .productName p {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 10px;
            color: black;
        }
        
        .writerName p {
            font-size: 18px;
            color: black;
            margin-bottom: 10px;
        }
        
        .category p {
            font-size: 16px;
            color: black;
            margin-bottom: 20px;
        }
        
        .productPrice p {
            font-size: 28px;
            color: var(--primary);
            font-weight: 700;
            margin-bottom: 25px;
        }
        
        .productPrice sup {
            font-size: 18px;
        }
        
        .description {
            margin-bottom: 30px;
            padding: 20px;
            background-color: #f8f9fa;
            border-radius: 8px;
            
        }
        
        .description h3 {
            font-size: 18px;
            margin-bottom: 10px;
            color: var(--text-dark);
        }
        
        .description p {
            font-size: 16px;
            color: black;
            line-height: 1.6;
        }
        
        .more-button {
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
        }
        
        .more-button button {
            padding: 14px 28px;
            font-size: 16px;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.3s ease;
            font-weight: 600;
            border: none;
        }
        
        #addToCartBtn {
            background-color: var(--accent);
            color: white;
        }
        
        #addToCartBtn:hover {
            background-color: var(--accent-dark);
        }
        
        .buy-now {
            background-color: var(--primary);
            color: white;
        }
        
        .buy-now:hover {
            background-color: var(--primary-light);
        }
        
        /* Recommendations Section */
        .recommend {
            margin-top: 50px;
        }
        
        .recommend h1 {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 25px;
            padding: 15px 20px;
            background-color: var(--accent);
            color: white;
            border-radius: 8px;
            text-align: center;
        }
        
        .carousel {
            display: flex;
            overflow-x: auto;
            gap: 20px;
            padding: 10px 5px 25px;
            scroll-behavior: smooth;
        }
        
        .carousel .product {
            background-color: var(--card-bg);
            padding: 20px;
            border-radius: 12px;
            box-shadow: var(--shadow);
            text-align: center;
            min-width: 250px;
            flex: 0 0 auto;
            transition: transform 0.3s, box-shadow 0.3s;
        }
        
        .carousel .product:hover {
            transform: translateY(-5px);
            box-shadow: var(--shadow-hover);
        }
        
        .carousel .product img {
            width: 100%;
            height: 280px;
            object-fit: contain;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            padding: 25px;
            border-radius: 8px;
        }
        
        .carousel .product h2 {
            font-size: 18px;
            font-weight: 600;
            margin: 0 0 10px;
            color: var(--text-dark);
        }
        
        .carousel .product p {
            font-size: 18px;
            font-weight: 700;
            color: var(--primary);
            margin-bottom: 15px;
        }
        
        .carousel .product button {
            background-color: var(--accent);
            color: white;
            border: none;
            padding: 10px 20px;
            font-size: 14px;
            border-radius: 6px;
            cursor: pointer;
            transition: background-color 0.3s ease;
            font-weight: 600;
        }
        
        .carousel .product button:hover {
            background-color: var(--accent-dark);
        }
        
        /* Scrollbar Styling */
        .carousel::-webkit-scrollbar {
            height: 8px;
        }
        
        .carousel::-webkit-scrollbar-thumb {
            background-color: #c1c1c1;
            border-radius: 4px;
        }
        
        .carousel::-webkit-scrollbar-track {
            background-color: #f1f1f1;
            border-radius: 4px;
        }
        
        /* Success Dialog */
        .dialog {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 1000;
            justify-content: center;
            align-items: center;
        }
        
        .dialog-content {
            background-color: white;
            padding: 30px;
            border-radius: 12px;
            text-align: center;
            box-shadow: var(--shadow-hover);
            max-width: 400px;
            width: 90%;
        }
        
        .tick-icon {
            color: var(--primary);
            font-size: 48px;
            margin-bottom: 20px;
        }
        
        .dialog h2 {
            margin-bottom: 15px;
            color: var(--text-dark);
        }
        
        .dialog p {
            margin-bottom: 25px;
            color: var(--text-light);
        }
        
        #closeDialogBtn {
            padding: 12px 24px;
            background-color: var(--primary);
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
            transition: background-color 0.3s;
        }
        
        #closeDialogBtn:hover {
            background-color: var(--primary-light);
        }
        
        /* Responsive Design */
        @media (max-width: 768px) {
            .mainContainer {
                flex-direction: column;
                gap: 25px;
            }
            
            .productImageSection, .productDetails {
                width: 100%;
            }
            
            .more-button {
                flex-direction: column;
            }
            
            .more-button button {
                width: 100%;
            }
            
            .carousel .product {
                min-width: 220px;
            }
        }
        
        @media (max-width: 480px) {
            .container {
                padding: 15px;
            }
            
            .mainContainer {
                padding: 20px;
            }
            
            .productName p {
                font-size: 24px;
            }
            
            .productPrice p {
                font-size: 24px;
            }
            
            .recommend h1 {
                font-size: 20px;
            }
        }
        
        /* Breadcrumb */
        .breadcrumb {
            margin-bottom: 20px;
            font-size: 14px;
            color: var(--text-light);
        }
        
        .breadcrumb a {
            color: var(--primary);
            text-decoration: none;
        }
        
        .breadcrumb a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <?php require 'navbar.php'; require 'loader.php'; ?>

    <div class="container">
        <!-- Breadcrumb -->
        <div class="breadcrumb">
            <a href="index.php">Home</a> &gt; 
            <a href="index.php">Shop</a> &gt; 
            <span>Product Details</span>
        </div>

        <!-- Main Product Section -->
        <div class="mainContainer">
            <div class="productImageSection">
                <?php
                if (isset($_GET['SNO'])) {
                    $SNO = $_GET['SNO'];
                    $query = "SELECT product_image FROM product_details WHERE SNO = $SNO";
                    $result = mysqli_query($conn, $query);
                    if (mysqli_num_rows($result) > 0) {
                        $row = mysqli_fetch_assoc($result);
                        $imagePath = "../user/product-Source/" . $row['product_image'];
                        echo "<img src='$imagePath' alt='Product Image' />";
                    } else {
                        echo "<img src='../images/default.jpg' alt='Default Image' />";
                    }
                }
                ?>
            </div>
            <div class="productDetails">
                <div class="productName">
                    <?php
                    if (isset($_GET['SNO'])) {
                        $query = "SELECT product_name FROM product_details WHERE SNO = $SNO";
                        $result = mysqli_query($conn, $query);
                        if (mysqli_num_rows($result) > 0) {
                            $row = mysqli_fetch_assoc($result);
                            echo "<p>" . $row['product_name'] . "</p>";
                        } else {
                            echo "<p>No Title Available</p>";
                        }
                    }
                    ?>
                </div>
                <div class="writerName">
                    <?php
                    if (isset($_GET['SNO'])) {
                        $query = "SELECT writer_name FROM product_details WHERE SNO = $SNO";
                        $result = mysqli_query($conn, $query);
                        if (mysqli_num_rows($result) > 0) {
                            $row = mysqli_fetch_assoc($result);
                            echo "<p>By: " . $row['writer_name'] . "</p>";
                        } else {
                            echo "<p>Author Unknown</p>";
                        }
                    }
                    ?>
                </div>
                <div class="category">
                    <?php
                    if (isset($_GET['SNO'])) {
                        $query = "SELECT category FROM product_details WHERE SNO = $SNO";
                        $result = mysqli_query($conn, $query);
                        if (mysqli_num_rows($result) > 0) {
                            $row = mysqli_fetch_assoc($result);
                            echo "<p>Category: " . $row['category'] . "</p>";
                        } else {
                            echo "<p>No Category Available</p>";
                        }
                    }
                    ?>
                </div>
                <div class="productPrice">
                    <?php
                    if (isset($_GET['SNO'])) {
                        $query = "SELECT product_price FROM product_details WHERE SNO = $SNO";
                        $result = mysqli_query($conn, $query);
                        if (mysqli_num_rows($result) > 0) {
                            $row = mysqli_fetch_assoc($result);
                            echo "<p><sup>₹</sup>" . $row['product_price'] . "</p>";
                        } else {
                            echo "<p>Price Unavailable</p>";
                        }
                    }
                    ?>
                </div>
                <div class="description">
                    <?php
                    if (isset($_GET['SNO'])) {
                        $query = "SELECT description FROM product_details WHERE SNO = $SNO";
                        $result = mysqli_query($conn, $query);
                        if (mysqli_num_rows($result) > 0) {
                            $row = mysqli_fetch_assoc($result);
                            echo "<h3>About this Item:</h3>";
                            echo "<p>" . $row['description'] . "</p>";
                        } else {
                            echo "<p>No Description Available</p>";
                        }
                    }
                    ?>
                </div>
                <div class="more-button">
                    <?php
                    if (isset($_GET['SNO'])) {
                        $SNO = $_GET['SNO'];
                        $query = "SELECT * FROM product_details WHERE SNO = $SNO";
                        $result = mysqli_query($conn, $query);
                        if (mysqli_num_rows($result) > 0) {
                            $row = mysqli_fetch_assoc($result);

                            echo "<button id='addToCartBtn' class='add-to-cart' onclick=\"window.location.href='addtocart.php?SNO=" . $row['SNO'] . "'\">Add to Cart</button>";
                            echo "<button class='buy-now'>Buy Now</button>";
                        } else {
                            echo "<p>Product not found.</p>";
                        }
                    }
                    ?>
                </div>
            </div>
        </div>

        <!-- Recommendations Section -->
        <div class="recommend">
            <h1>Recommended Books</h1>
            <div class="carousel">
                <?php
                if (isset($_GET['SNO'])) {
                    $query = "SELECT * FROM product_details WHERE category = (SELECT category FROM product_details WHERE SNO = $SNO) AND SNO != $SNO";
                    $result = mysqli_query($conn, $query);
                    if (mysqli_num_rows($result) > 0) {
                        while ($row = mysqli_fetch_assoc($result)) {
                            echo "<div class='product'>";
                            echo "<img src='../user/product-Source/" . $row['product_image'] . "' alt='" . $row['product_name'] . "' />";
                            echo "<h2>" . $row['product_name'] . "</h2>";
                            echo "<p><sup>₹</sup>" . $row['product_price'] . "</p>";
                            echo "<button onclick=\"window.location.href='productOverview.php?SNO=" . $row['SNO'] . "'\">View Details</button>";
                            echo "</div>";
                        }
                    } else {
                        echo "<p>No other products found in this category.</p>";
                    }
                }
                ?>
            </div>
        </div>
    </div>

    <!-- Success Dialog -->
    <div class="dialog" id="successDialog">
        <div class="dialog-content">
            <div class="tick-icon">
                <i class="fas fa-check-circle"></i>
            </div>
            <h2>Item Added to Cart!</h2>
            <p>Your product has been successfully added to your shopping cart.</p>
            <button id="closeDialogBtn">Continue Shopping</button>
        </div>
    </div>

    <script>
        // Dialog functionality
        document.addEventListener('DOMContentLoaded', function() {
            const dialog = document.getElementById('successDialog');
            const closeBtn = document.getElementById('closeDialogBtn');
            
            // Check if we should show the dialog (after adding to cart)
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('added') === 'true') {
                dialog.style.display = 'flex';
            }
            
            closeBtn.addEventListener('click', function() {
                dialog.style.display = 'none';
            });
            
            // Close dialog when clicking outside
            window.addEventListener('click', function(event) {
                if (event.target === dialog) {
                    dialog.style.display = 'none';
                }
            });
        });
    </script>
</body>
</html>