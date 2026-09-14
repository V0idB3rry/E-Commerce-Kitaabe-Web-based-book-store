-- Second Shelf database
-- Reconstructed from the columns used by the existing PHP code (no export was available).
-- Import: phpMyAdmin → Import → choose this file → Go.
-- Sample catalog rows at the bottom are placeholder data (prices/conditions are made up).

CREATE DATABASE IF NOT EXISTS `e-commerce` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `e-commerce`;

CREATE TABLE IF NOT EXISTS category (
    SNO      INT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS product_details (
    SNO              INT AUTO_INCREMENT PRIMARY KEY,
    product_image    VARCHAR(255) NOT NULL,
    product_name     VARCHAR(255) NOT NULL,
    writer_name      VARCHAR(255) NOT NULL,
    description      TEXT,
    product_price    DECIMAL(10,2) NOT NULL,
    category         VARCHAR(100) NOT NULL,
    product_quantity INT NOT NULL DEFAULT 0
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_database (
    id           INT AUTO_INCREMENT PRIMARY KEY,
    Username     VARCHAR(100) NOT NULL,
    Phone_number VARCHAR(20),
    email        VARCHAR(255) NOT NULL UNIQUE,
    password     VARCHAR(255) NOT NULL,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_cart (
    sno           INT AUTO_INCREMENT PRIMARY KEY,
    product_name  VARCHAR(255) NOT NULL,
    product_price DECIMAL(10,2) NOT NULL,
    product_image VARCHAR(255),
    quantity      INT NOT NULL DEFAULT 1
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS orders (
    order_id            INT AUTO_INCREMENT PRIMARY KEY,
    user_name           VARCHAR(100) NOT NULL,
    user_email          VARCHAR(255),
    user_phone          VARCHAR(20),
    delivery_address    TEXT NOT NULL,
    city                VARCHAR(100) NOT NULL,
    pincode             VARCHAR(10) NOT NULL,
    payment_method      ENUM('razorpay','cod') NOT NULL,
    payment_status      ENUM('pending','paid','failed','cod_pending') NOT NULL DEFAULT 'pending',
    order_status        ENUM('processing','shipped','delivered','cancelled') NOT NULL DEFAULT 'processing',
    razorpay_order_id   VARCHAR(100),
    razorpay_payment_id VARCHAR(100),
    order_total         DECIMAL(10,2) NOT NULL,
    delivery_fee        DECIMAL(10,2) NOT NULL DEFAULT 0,
    order_date          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS order_items (
    id            INT AUTO_INCREMENT PRIMARY KEY,
    order_id      INT NOT NULL,
    product_name  VARCHAR(255) NOT NULL,
    product_image VARCHAR(255),
    product_price DECIMAL(10,2) NOT NULL,
    quantity      INT NOT NULL DEFAULT 1,
    line_total    DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ── Sample data ────────────────────────────────────────────────
INSERT IGNORE INTO category (category) VALUES
    ('Self-Help'), ('Finance'), ('Biography'), ('Business'), ('Spirituality'), ('Politics');

INSERT INTO product_details (product_image, product_name, writer_name, description, product_price, category, product_quantity) VALUES
    ('think like a monk.jpg',                 'Think Like a Monk',                   'Jay Shetty',        'Train your mind for peace and purpose every day.',          249, 'Self-Help',    6),
    ('Power of your subsconcious mind.jpg',   'The Power of Your Subconscious Mind', 'Joseph Murphy',     'Unlock your master key to success.',                        149, 'Self-Help',    9),
    ('pom.jpg',                               'The Psychology of Money',             'Morgan Housel',     'Timeless lessons on wealth, greed, and happiness.',          229, 'Finance',      5),
    ('power.jpg',                             'The 48 Laws of Power',                'Robert Greene',     'A distilled guide to the timeless laws of power.',           299, 'Self-Help',    4),
    ('monk who sold his ferrari.jpg',         'The Monk Who Sold His Ferrari',       'Robin Sharma',      'A fable about fulfilling your dreams and reaching your destiny.', 179, 'Self-Help', 7),
    ('how to win friends.jpg',                'How to Win Friends and Influence People', 'Dale Carnegie', 'The classic guide to getting along with people.',            159, 'Self-Help',    8),
    ('zero to one.jpg',                       'Zero to One',                         'Peter Thiel',       'Notes on startups, or how to build the future.',             219, 'Business',     3),
    ('connect the dots.png',                  'Connect the Dots',                    'Rashmi Bansal',     'Stories of 20 entrepreneurs who found their own path.',      129, 'Business',     5),
    ('wings of fire.jpg',                     'Wings of Fire',                       'A. P. J. Abdul Kalam', 'An autobiography of the Missile Man of India.',           169, 'Biography',   10),
    ('Every thing is fcked.jpg',              'Everything Is F*cked',                'Mark Manson',       'A book about hope.',                                         199, 'Self-Help',    4),
    ('attitude is everything.jpg',            'Attitude Is Everything',              'Jeff Keller',       'Change your attitude, change your life.',                    119, 'Self-Help',    6),
    ('geeta.jpg',                             'Bhagavad Gita',                       'Ved Vyasa',         'The timeless dialogue between Krishna and Arjuna.',           99, 'Spirituality', 12),
    ('pakistan under seige.jpg',              'Pakistan Under Siege',                'Madiha Afzal',      'Extremism, society, and the state.',                         259, 'Politics',     2);
