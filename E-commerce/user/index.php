<?php
include 'connect_database.php';

session_start();

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
    <title>Second Shelf - Premium Products</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        :root {
            --primary: #2A6B3F;
            --primary-light: #3A8A55;   
            --primary-dark: #1E5630;
            --accent: #FFA726;
            --accent-dark: #F57C00;
            --light-bg: #F9F9F9;
            --card-bg: #FFFFFF;
            --text-dark: #2D3748;
            --text-light: #718096;
            --border: #E2E8F0;
            --shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
            --shadow-hover: 0 8px 24px rgba(0, 0, 0, 0.08);
            --radius: 8px;
            --transition: all 0.3s ease;
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
            max-width: 1400px;
            margin: 0 auto;
            padding: 0 20px;
        }
        
        /* Header Styles */
        .navbar {
            background-color: var(--primary);
            padding: 15px 0;
            position: sticky;
            top: 0;
            z-index: 100;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        
        .res-nav {
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
        }
        
        .logo {
            color: white;
            font-weight: 700;
            font-size: 24px;
            display: flex;
            align-items: center;
        }
        
        .logo sup {
            font-size: 12px;
            margin-left: 2px;
        }
        
        .search {
            flex: 1;
            max-width: 500px;
            margin: 0 20px;
        }
        
        .search form {
            display: flex;
            position: relative;
        }
        
        .search input {
            padding: 12px 20px;
            width: 100%;
            border-radius: 30px;
            border: none;
            font-size: 16px;
            box-shadow: var(--shadow);
            background: rgba(255, 255, 255, 0.9);
            transition: var(--transition);
        }
        
        .search input:focus {
            outline: none;
            background: white;
            box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.3);
        }
        
        .search button {
            position: absolute;
            right: 5px;
            top: 5px;
            background: var(--accent);
            border: none;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: var(--transition);
        }
        
        .search button:hover {
            background: var(--accent-dark);
            transform: scale(1.05);
        }
        
        .search button i {
            color: white;
            font-size: 16px;
        }
        
        .menu-toggle {
            display: none;
            color: white;
            font-size: 24px;
            cursor: pointer;
        }
        
        .links {
            display: flex;
            list-style: none;
            gap: 30px;
        }
        
        .links a {
            color: white;
            text-decoration: none;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: var(--transition);
            padding: 8px 12px;
            border-radius: var(--radius);
        }
        
        .links a:hover {
            background: rgba(255, 255, 255, 0.1);
        }
        
        /* Banner */
        .upper--img {
            margin: 30px 0;
            border-radius: var(--radius);
            overflow: hidden;
            box-shadow: var(--shadow);
        }
        
        .upper--img img {
            width: 100%;
            display: block;
        }
        
        /* Main Content */
        .main {
            display: flex;
            gap: 30px;
            margin: 30px 0;
        }
        
        /* Sidebar */
        .sidebar {
            background: var(--card-bg);
            border-radius: var(--radius);
            padding: 25px;
            box-shadow: var(--shadow);
            width: 280px;
            flex-shrink: 0;
            height: fit-content;
            position: sticky;
            top: 100px;
        }
        
        .sidebar-title {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 20px;
            padding-bottom: 15px;
            border-bottom: 1px solid var(--border);
            color: var(--primary);
        }
        
        .filter--category {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        
        .checkbox {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px 0;
            transition: var(--transition);
            border-radius: 4px;
        }
        
        .checkbox:hover {
            background: rgba(42, 107, 63, 0.05);
            padding-left: 8px;
        }
        
        .checkbox input[type="checkbox"] {
            width: 18px;
            height: 18px;
            accent-color: var(--primary);
        }
        
        .checkbox label {
            cursor: pointer;
            font-weight: 500;
        }
        
        .apply {
            background: var(--primary);
            color: white;
            border: none;
            border-radius: var(--radius);
            padding: 12px 20px;
            font-weight: 600;
            cursor: pointer;
            transition: var(--transition);
            margin-top: 20px;
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }
        
        .apply:hover {
            background: var(--primary-dark);
            transform: translateY(-2px);
        }
        
        /* Products Section */
        .section2 {
            flex: 1;
        }
        
        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 25px;
        }
        
        .section-title {
            font-size: 24px;
            font-weight: 700;
            color: var(--primary);
        }
        
        .product-count {
            color: var(--text-light);
            font-size: 14px;
        }
        
        .product-section {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 25px;
        }
        
        .product {
            background: var(--card-bg);
            border-radius: var(--radius);
            overflow: hidden;
            box-shadow: var(--shadow);
            transition: var(--transition);
            display: flex;
            flex-direction: column;
            position: relative;
        }
        
        .product:hover {
            transform: translateY(-5px);
            box-shadow: var(--shadow-hover);
        }
        
         .product img {
            width: 100%;
            height: 280px;
            object-fit: contain;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            padding: 25px;
            border-radius: 8px;
        }
        
        .product-image {
            padding: 15px;
        }
        
        .product:hover img {
            transform: scale(1.05);
        }
        
        .product-badge {
            position: absolute;
            top: 10px;
            left: 10px;
            background: var(--accent);
            color: white;
            padding: 4px 10px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
        }
        
        .product-details {
            padding: 20px;
            display: flex;
            flex-direction: column;
            flex-grow: 1;
        }
        
        .product-price {
            color: var(--primary);
            font-size: 20px;
            font-weight: 700;
            margin-bottom: 8px;
        }
        
        .product-name {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 8px;
            color: var(--text-dark);
            line-height: 1.3;
        }
        
        .product-category {
            color: var(--text-light);
            font-size: 14px;
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .preview-btn {
            background: var(--primary);
            color: white;
            border: none;
            border-radius: var(--radius);
            padding: 12px;
            font-weight: 600;
            cursor: pointer;
            transition: var(--transition);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            margin-top: auto;
        }
        
        .preview-btn:hover {
            background: var(--primary-dark);
            transform: translateY(-2px);
        }
        
        .no-products {
            grid-column: 1 / -1;
            text-align: center;
            padding: 60px 40px;
            font-size: 18px;
            color: green;
            background: var(--card-bg);
            border-radius: var(--radius);
            box-shadow: var(--shadow);
        }
        
        .no-products i {
            font-size: 48px;
            margin-bottom: 15px;
            color: green;
        }
        
        /* Trust Badges */
        .trust-badges {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin: 60px 0 40px;
        }
        
        .badge {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            padding: 30px 20px;
            background: var(--card-bg);
            border-radius: var(--radius);
            box-shadow: var(--shadow);
            transition: var(--transition);
        }
        
        .badge:hover {
            transform: translateY(-5px);
            box-shadow: var(--shadow-hover);
        }
        
        .badge i {
            font-size: 36px;
            color: var(--primary);
            margin-bottom: 15px;
            background: rgba(42, 107, 63, 0.1);
            width: 70px;
            height: 70px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
        }
        
        .badge h3 {
            font-size: 16px;
            margin-bottom: 8px;
            font-weight: 600;
        }
        
        .badge p {
            font-size: 14px;
            color: var(--text-light);
            line-height: 1.4;
        }
        
        /* Footer */
        .footer {
            background: var(--primary-dark);
            color: white;
            padding: 50px 0 20px;
            margin-top: 60px;
        }
        
        .footer-content {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 40px;
            margin-bottom: 30px;
        }
        
        .footer-section h3 {
            margin-bottom: 20px;
            font-size: 18px;
            position: relative;
            padding-bottom: 10px;
        }
        
        .footer-section h3::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 0;
            width: 40px;
            height: 2px;
            background: var(--accent);
        }
        
        .footer-section p, .footer-section a {
            color: rgba(255, 255, 255, 0.8);
            margin-bottom: 10px;
            display: block;
            text-decoration: none;
            transition: var(--transition);
        }
        
        .footer-section a:hover {
            color: white;
            transform: translateX(5px);
        }
        
        .copyright {
            text-align: center;
            padding-top: 20px;
            margin-top: 20px;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 0.7);
            font-size: 14px;
        }
        
        /* Responsive Design */
        @media (max-width: 1024px) {
            .main {
                flex-direction: column;
            }
            
            .sidebar {
                width: 100%;
                position: static;
            }
            
            .filter--category {
                flex-direction: row;
                flex-wrap: wrap;
            }
            
            .checkbox {
                min-width: 150px;
            }
            
            .trust-badges {
                grid-template-columns: repeat(2, 1fr);
            }
        }
        
        @media (max-width: 768px) {
            .res-nav {
                flex-direction: column;
                align-items: stretch;
                gap: 15px;
            }
            
            .logo {
                justify-content: center;
            }
            
            .search {
                margin: 0;
                max-width: 100%;
            }
            
            .menu-toggle {
                display: block;
                position: absolute;
                top: 20px;
                right: 20px;
            }
            
            .links {
                display: none;
                flex-direction: column;
                width: 100%;
                text-align: center;
                padding: 20px 0;
            }
            
            .links.active {
                display: flex;
            }
            
            .product-section {
                grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
            }
            
            .section-header {
                flex-direction: column;
                align-items: flex-start;
                gap: 10px;
            }
            
            .trust-badges {
                grid-template-columns: 1fr;
            }
        }
        
        @media (max-width: 480px) {
            .product-section {
                grid-template-columns: 1fr;
            }
            
            .filter--category {
                flex-direction: column;
            }
            
            .footer-content {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <?php include 'loader.php';
          include '../user/navbar.php'; ?>
    
    <div class="container">
        
        <div class="upper--img">
            <img src="../user/product-Source/banner.png" alt="Second Self Banner - Premium Products">
        </div>
        
        <div class="main">
            <div class="sidebar">
                <p class="sidebar-title">Filter by Category</p>
                <form action="<?php echo $_SERVER['PHP_SELF']; ?>" method="post">
                    <div class="filter--category">
                        <?php
                        mysqli_data_seek($results_category, 0); // Reset pointer to beginning
                        while($category = mysqli_fetch_assoc($results_category)){
                            $cat_name = htmlspecialchars($category['category']);
                            $checked = isset($_POST['categories']) && in_array($category['category'], $_POST['categories']) ? 'checked' : '';
                            echo "
                            <div class='checkbox'>
                                <input type='checkbox' name='categories[]' value='$cat_name' id='$cat_name' $checked>
                                <label for='$cat_name'>$cat_name</label>
                            </div>";
                        }
                        ?>
                    </div>
                    <button type="submit" class="apply">
                        <i class="fa-solid fa-filter"></i> Apply Filters
                    </button>
                </form>
            </div>
            
            <div class="section2">
                <div class="section-header">
                    <h2 class="section-title">Our Products</h2>
                    <div class="product-count"><?php echo mysqli_num_rows($results); ?> products found</div>
                </div>
                
                <div class="product-section">
                    <?php
                    if(mysqli_num_rows($results) > 0) {
                        while($row = mysqli_fetch_assoc($results)) {
                            echo "<div class='product'>";
                            echo "<div class='product-image'>";
                            echo "<span class='product-badge'>New</span>";
                            echo "<img src='../user/product-Source/" . $row['product_image']. "' alt='" . $row['product_name'] . "' />";
                            echo "</div>";
                            echo "<div class='product-details'>";
                            echo "<p class='product-price'><sup>₹</sup>" . number_format($row['product_price']) . "</p>";
                            echo "<h2 class='product-name'>" . $row['product_name'] . "</h2>";
                            echo "<p class='product-category'>" . $row['category']. "</p>";
                            echo "<button class='preview-btn' onclick=\"window.location.href='productOverview.php?SNO=" . $row['SNO'] . "'\">";
                            echo "<i class='fa-solid fa-eye'></i> View Product";
                            echo "</button>";
                            echo "</div>";
                            echo "</div>";
                        }
                    } else {
                        echo "<div class='no-products'>";
                        echo "<i class='fa-solid fa-box-open'></i>";
                        echo "<p>No products found matching your criteria.</p>";
                        echo "</div>";
                    }
                    mysqli_close($conn);
                    ?>
                </div>
            </div>
        </div>
        
        <!-- Trust Badges Section -->
        <div class="trust-badges">
            <div class="badge">
                <i class="fa-solid fa-truck-fast"></i>
                <h3>Free Shipping</h3>
                <p>On orders over ₹999</p>
            </div>
            <div class="badge">
                <i class="fa-solid fa-shield-alt"></i>
                <h3>Secure Payment</h3>
                <p>100% secure payment processing</p>
            </div>
            <div class="badge">
                <i class="fa-solid fa-rotate-left"></i>
                <h3>Easy Returns</h3>
                <p>30-day return policy</p>
            </div>
            <div class="badge">
                <i class="fa-solid fa-headset"></i>
                <h3>24/7 Support</h3>
                <p>Dedicated customer service</p>
            </div>
        </div>
    </div>
    
    <footer class="footer">
        <div class="container">
            <div class="footer-content">
                <div class="footer-section">
                    <h3>Second Shelf</h3>
                    <p>Premium products for your everyday needs. Quality guaranteed.</p>
                </div>
                <div class="footer-section">
                    <h3>Quick Links</h3>
                    <a href="#">About Us</a>
                    <a href="#">Contact</a>
                    <a href="#">Privacy Policy</a>
                    <a href="#">Terms & Conditions</a>
                </div>
                <div class="footer-section">
                    <h3>Contact Info</h3>
                    <p><i class="fa-solid fa-phone"></i> +91 1234567890</p>
                    <p><i class="fa-solid fa-envelope"></i> info@secondshelf.com</p>
                </div>
            </div>
            <div class="copyright">
                <p>&copy; 2023 Second Shelf. All rights reserved.</p>
            </div>
        </div>
    </footer>
    
    <script>
        // Menu toggle functionality
        document.getElementById('menu-toggle').addEventListener('click', function() {
            document.getElementById('navbar-links').classList.toggle('active');
        });
        
        // Search functionality
        document.querySelector('.search button').addEventListener('click', function() {
            const searchTerm = document.querySelector('.search input').value;
            if(searchTerm.trim() !== '') {
                alert('Searching for: ' + searchTerm);
                // In a real implementation, this would submit the form or make an AJAX request
            }
        });
        
        // Add subtle animations to elements when they come into view
        document.addEventListener('DOMContentLoaded', function() {
            const observerOptions = {
                threshold: 0.1,
                rootMargin: '0px 0px -50px 0px'
            };
            
            const observer = new IntersectionObserver(function(entries) {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }
                });
            }, observerOptions);
            
            // Observe product cards
            document.querySelectorAll('.product').forEach(product => {
                product.style.opacity = '0';
                product.style.transform = 'translateY(20px)';
                product.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                observer.observe(product);
            });
            
            // Observe trust badges
            document.querySelectorAll('.badge').forEach(badge => {
                badge.style.opacity = '0';
                badge.style.transform = 'translateY(20px)';
                badge.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                observer.observe(badge);
            });
        });
    </script>
</body>
</html>