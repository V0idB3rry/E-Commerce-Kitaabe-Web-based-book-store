-- 002: Failed sign-in log, used to limit password guessing (customer and admin logins)
-- Run ONCE, after 001. Rows older than a day are cleaned up by the API.

USE `e-commerce`;

CREATE TABLE login_attempts (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    scope      ENUM('customer','admin') NOT NULL,
    email      VARCHAR(255) NOT NULL,
    ip         VARCHAR(45)  NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_login_scope_time (scope, created_at)
) ENGINE=InnoDB;
