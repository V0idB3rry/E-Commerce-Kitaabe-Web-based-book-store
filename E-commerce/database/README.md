# Database

MariaDB/MySQL database `e-commerce` (XAMPP: user `root`, no password).

## Fresh setup

Run these in order (phpMyAdmin → Import, or the command line):

```bash
C:\xampp\mysql\bin\mysql.exe -u root < database\schema.sql
C:\xampp\mysql\bin\mysql.exe -u root < database\migrations\001_storefront_v2.sql
C:\xampp\mysql\bin\mysql.exe -u root < database\migrations\002_login_attempts.sql
C:\xampp\php\php.exe database\create_admin.php
```

Each migration runs **once**. `schema.sql` includes 13 sample books with placeholder prices and stock.
Already set up? Just run the migrations you haven't run yet (e.g. `002_login_attempts.sql`).

## App database user (recommended)

Without `secrets.php` the API logs in as `root` with no password. To give it a user that can only
read and write this database, run this once as root (pick your own password):

```sql
CREATE USER 'shelf_app'@'localhost' IDENTIFIED BY 'choose-a-strong-password';
GRANT SELECT, INSERT, UPDATE, DELETE ON `e-commerce`.* TO 'shelf_app'@'localhost';
```

Then put `db_user` / `db_pass` in `api/secrets.php` (see `secrets.example.php`).
Keep running migrations as `root`: `shelf_app` can't create or alter tables.

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
| `login_attempts` | Failed sign-ins (last 24 h), used to block password guessing |

Cart rows without a `user_id` came from the old storefront (now removed); the API ignores them.
