-- 004: Also rate limit sign-ups and "Sell your books" requests (per IP), using the login_attempts table
-- Run ONCE, after 003.

USE `e-commerce`;

ALTER TABLE login_attempts
    MODIFY scope ENUM('customer','admin','register','sell') NOT NULL;
