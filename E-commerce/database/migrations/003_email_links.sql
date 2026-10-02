-- 003: Email verification and password reset links
-- Run ONCE, after 002.

USE `e-commerce`;

-- Customers must confirm their email before ordering; accounts that already exist count as confirmed
ALTER TABLE user_database ADD COLUMN email_verified_at TIMESTAMP NULL;
UPDATE user_database SET email_verified_at = NOW();

-- One-time links sent by email. Only a SHA-256 hash of the token is stored.
CREATE TABLE email_tokens (
    id         INT AUTO_INCREMENT PRIMARY KEY,
    user_id    INT NOT NULL,
    purpose    ENUM('verify','reset') NOT NULL,
    token_hash CHAR(64) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_email_tokens_user (user_id, purpose),
    CONSTRAINT fk_email_tokens_user FOREIGN KEY (user_id) REFERENCES user_database(id) ON DELETE CASCADE
) ENGINE=InnoDB;
