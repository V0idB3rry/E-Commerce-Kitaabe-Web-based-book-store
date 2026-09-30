-- 001: Storefront v2 (React + PHP API)
-- Run ONCE, after schema.sql. phpMyAdmin → select `e-commerce` → Import → this file.
-- Additive only: existing PHP pages keep working (new columns are nullable or defaulted).

USE `e-commerce`;

-- ── Books: condition grade, new cover price, listing date ─────
ALTER TABLE product_details
    ADD COLUMN mrp            DECIMAL(10,2) NULL COMMENT 'Price of a new copy, shown struck through' AFTER product_price,
    ADD COLUMN book_condition ENUM('Like New','Good','Fair') NOT NULL DEFAULT 'Good' AFTER category,
    ADD COLUMN created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD KEY idx_product_category (category);

-- Sample catalog values (match the design mockups)
UPDATE product_details SET book_condition = 'Like New', mrp = 399 WHERE product_image = 'pom.jpg';
UPDATE product_details SET book_condition = 'Good',     mrp = 499 WHERE product_image = 'think like a monk.jpg';
UPDATE product_details SET book_condition = 'Good',     mrp = 699 WHERE product_image = 'power.jpg';
UPDATE product_details SET book_condition = 'Like New', mrp = 499 WHERE product_image = 'zero to one.jpg';
UPDATE product_details SET book_condition = 'Good',     mrp = 350 WHERE product_image = 'wings of fire.jpg';
UPDATE product_details SET book_condition = 'Fair',     mrp = 299 WHERE product_image = 'monk who sold his ferrari.jpg';
UPDATE product_details SET book_condition = 'Good',     mrp = 299 WHERE product_image = 'how to win friends.jpg';
UPDATE product_details SET book_condition = 'Like New', mrp = 250 WHERE product_image = 'Power of your subsconcious mind.jpg';
UPDATE product_details SET book_condition = 'Fair',     mrp = 250 WHERE product_image = 'connect the dots.png';
UPDATE product_details SET book_condition = 'Good',     mrp = 499 WHERE product_image = 'Every thing is fcked.jpg';
UPDATE product_details SET book_condition = 'Fair',     mrp = 299 WHERE product_image = 'attitude is everything.jpg';
UPDATE product_details SET book_condition = 'Good',     mrp = 250 WHERE product_image = 'geeta.jpg';
UPDATE product_details SET book_condition = 'Like New', mrp = 599 WHERE product_image = 'pakistan under seige.jpg';

-- ── Customers: passwords are stored with password_hash() from now on ──
ALTER TABLE user_database
    MODIFY password VARCHAR(255) NOT NULL COMMENT 'bcrypt hash from password_hash(); never plain text';

-- ── Admins (replaces the hard-coded login in Admin-panel/login.php) ──
-- Create the first admin with: php database/create_admin.php
CREATE TABLE admins (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(100) NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP NULL
) ENGINE=InnoDB;

-- ── Cart: one cart per customer instead of one shared cart ────
-- Legacy rows (user_id NULL) are ignored by the new API.
ALTER TABLE user_cart
    ADD COLUMN user_id    INT NULL AFTER sno,
    ADD COLUMN product_id INT NULL AFTER user_id,
    ADD UNIQUE KEY uq_cart_user_product (user_id, product_id),
    ADD CONSTRAINT fk_cart_user    FOREIGN KEY (user_id)    REFERENCES user_database(id)   ON DELETE CASCADE,
    ADD CONSTRAINT fk_cart_product FOREIGN KEY (product_id) REFERENCES product_details(SNO) ON DELETE CASCADE;

-- ── Orders: link to the customer and to the books bought ──────
ALTER TABLE orders
    ADD COLUMN user_id INT NULL AFTER order_id,
    ADD CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES user_database(id) ON DELETE SET NULL;

ALTER TABLE order_items
    ADD COLUMN product_id INT NULL AFTER order_id,
    ADD CONSTRAINT fk_items_product FOREIGN KEY (product_id) REFERENCES product_details(SNO) ON DELETE SET NULL;

-- ── Sell your books: requests from people who want to sell ────
CREATE TABLE sell_requests (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT NULL,
    name       VARCHAR(100) NOT NULL,
    email      VARCHAR(255) NOT NULL,
    phone      VARCHAR(20)  NOT NULL,
    city       VARCHAR(100) NOT NULL,
    book_count INT NOT NULL DEFAULT 1,
    books      TEXT NOT NULL COMMENT 'Titles/authors as the seller typed them',
    notes      TEXT NULL,
    status     ENUM('new','contacted','accepted','rejected') NOT NULL DEFAULT 'new',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_sell_status (status),
    CONSTRAINT fk_sell_user FOREIGN KEY (user_id) REFERENCES user_database(id) ON DELETE SET NULL
) ENGINE=InnoDB;
