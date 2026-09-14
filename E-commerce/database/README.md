# Database

MariaDB/MySQL database `e-commerce` (XAMPP: user `root`, no password).

## Fresh setup

Run these in order (phpMyAdmin → Import, or the command line):

```bash
C:\xampp\mysql\bin\mysql.exe -u root < database\schema.sql
C:\xampp\mysql\bin\mysql.exe -u root < database\migrations\001_storefront_v2.sql
C:\xampp\php\php.exe database\create_admin.php
```

Each migration runs **once**. `schema.sql` includes 13 sample books with placeholder prices and stock.

## Tables

| Table | Purpose |
| --- | --- |
| `product_details` | Books: title, author, price, `mrp` (new-copy price), `book_condition`, stock, image |
| `category` | Category names (books reference them by name) |
| `user_database` | Customers; `password` holds a `password_hash()` bcrypt hash |
| `admins` | Admin accounts, created with `create_admin.php` |
| `user_cart` | One row per customer + book (`user_id`, `product_id`, `quantity`) |
| `orders`, `order_items` | Placed orders with Razorpay / COD payment status |
| `sell_requests` | "Sell your books" submissions |

The old PHP pages still write cart rows without a `user_id`; the new API ignores those.
