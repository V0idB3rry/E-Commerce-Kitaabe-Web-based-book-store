<?php
// PHP code can be added here if needed
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Modern Navbar</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css">
    <style>
        :root {
            --primary: #2A6B3F;
            --primary-light: #3A8A55;
            --primary-dark: #1E5630;
            --accent: #FFA726;
            --accent-dark: #F57C00;
            --text-light: #FFFFFF;
            --text-dark: #333333;
            --bg-light: #F9F9F9;
            --shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            --transition: all 0.3s ease;
            --radius: 8px;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        body {
            background-color: var(--bg-light);
            color: var(--text-dark);
        }

        nav {
            background-color: var(--primary);
            padding: 0;
            position: sticky;
            top: 0;
            width: 100%;
            z-index: 1000;
            box-shadow: var(--shadow);
        }

        .res-nav {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 15px 30px;
            max-width: 1400px;
            margin: 0 auto;
        }

        .logo {
            color: var(--accent);
            font-weight: 700;
            font-size: 28px;
            display: flex;
            align-items: center;
            text-decoration: none;
            transition: var(--transition);
        }

        .logo:hover {
            transform: scale(1.05);
        }

        .logo sup {
            font-size: 10px;
            margin-left: 2px;
        }

        .search {
            flex: 1;
            max-width: 600px;
            margin: 0 30px;
        }

        .search form {
            display: flex;
            position: relative;
            width: 100%;
        }

        .search input {
            padding: 12px 20px;
            width: 100%;
            border-radius: 50px;
            border: none;
            font-size: 16px;
            background: rgba(255, 255, 255, 0.95);
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            transition: var(--transition);
        }

        .search input:focus {
            outline: none;
            background: white;
            box-shadow: 0 0 0 2px var(--accent);
        }

        .search input::placeholder {
            color: #666;
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
            color: var(--accent);
            font-size: 24px;
            cursor: pointer;
            transition: var(--transition);
        }

        .menu-toggle:hover {
            transform: scale(1.1);
        }

        .links {
            display: flex;
            list-style: none;
            gap: 40px;
            align-items: center;
        }

        .links a {
            color: white;
            text-decoration: none;
            font-size: 16px;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 16px;
            border-radius: var(--radius);
            transition: var(--transition);
            position: relative;
        }

        .links a:hover {
            background: rgba(255, 255, 255, 0.1);
            transform: translateY(-2px);
        }

        .links a::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 50%;
            width: 0;
            height: 2px;
            background: var(--accent);
            transition: var(--transition);
            transform: translateX(-50%);
        }

        .links a:hover::after {
            width: 80%;
        }

        .cart-count {
            background: var(--accent);
            color: white;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            margin-left: 5px;
        }

        /* Mobile Styles */
        @media (max-width: 1024px) {
            .search {
                max-width: 400px;
                margin: 0 20px;
            }
        }

        @media (max-width: 768px) {
            .res-nav {
                padding: 15px 20px;
                flex-wrap: wrap;
            }

            .logo {
                font-size: 24px;
            }

            .search {
                order: 3;
                max-width: 100%;
                margin: 15px 0 0;
                display: none;
            }

            .search.active {
                display: block;
            }

            .menu-toggle {
                display: block;
            }

            .links {
                display: none;
                flex-direction: column;
                width: 100%;
                background: var(--primary-dark);
                position: absolute;
                top: 100%;
                left: 0;
                padding: 20px;
                gap: 15px;
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
            }

            .links.active {
                display: flex;
            }

            .links a {
                width: 100%;
                justify-content: center;
                padding: 12px;
            }
        }

        @media (max-width: 480px) {
            .res-nav {
                padding: 12px 15px;
            }

            .logo {
                font-size: 22px;
            }
        }

        /* Animation for search bar on mobile */
        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .search.active {
            animation: slideDown 0.3s ease;
        }
    </style>
</head>
<body>
    <nav class="navbar">
        <div class="res-nav">
            <a href="#" class="logo">Kitaabe<sup><i class="fa-solid fa-trademark"></i></sup></a>
            
            <div class="search" id="search-bar">
                <form class="d-flex" role="search">
                    <input class="form-control" type="search" placeholder="Search for books, authors, categories..." aria-label="Search" name="search">
                    <button class="btn btn-outline-success" type="button" id="search-icon">
                        <i class="fa-solid fa-magnifying-glass"></i>
                    </button>
                </form>
            </div>
            
            <div class="menu-toggle" id="menu-toggle">
                <i class="fa-solid fa-bars"></i>
            </div>
            
            <ul class="links" id="navbar-links">
                <li class="nav-item">
                    <a class="nav-link active" aria-current="page" href="index.php">
                        <i class="fa-solid fa-bag-shopping"></i>Shop
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link active" aria-current="page" href="add_to_cart.php">
                        <i class="fa-solid fa-cart-shopping"></i>Cart
                        <span class="cart-count">3</span>
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link active" aria-current="page" href="#">
                        <i class="fa-solid fa-user"></i>Account
                    </a>
                </li>
            </ul>
        </div>
    </nav>

    <script>
        // Toggle mobile menu
        document.getElementById('menu-toggle').addEventListener('click', function() {
            document.getElementById('navbar-links').classList.toggle('active');
            document.getElementById('search-bar').classList.toggle('active');
        });

        // Search functionality
        document.getElementById('search-icon').addEventListener('click', function() {
            const searchTerm = document.querySelector('.search input').value;
            if(searchTerm.trim() !== '') {
                alert('Searching for: ' + searchTerm);
                // In a real implementation, this would submit the form or make an AJAX request
            }
        });

        // Close menu when clicking outside on mobile
        document.addEventListener('click', function(event) {
            const navbar = document.querySelector('.navbar');
            const menuToggle = document.getElementById('menu-toggle');
            const navbarLinks = document.getElementById('navbar-links');
            const searchBar = document.getElementById('search-bar');
            
            if (window.innerWidth <= 768) {
                if (!navbar.contains(event.target) && navbarLinks.classList.contains('active')) {
                    navbarLinks.classList.remove('active');
                    searchBar.classList.remove('active');
                }
            }
        });

        // Handle window resize
        window.addEventListener('resize', function() {
            const navbarLinks = document.getElementById('navbar-links');
            const searchBar = document.getElementById('search-bar');
            
            if (window.innerWidth > 768) {
                navbarLinks.classList.remove('active');
                searchBar.classList.remove('active');
                searchBar.style.display = 'block';
            } else {
                searchBar.style.display = 'none';
            }
        });
    </script>
</body>
</html>