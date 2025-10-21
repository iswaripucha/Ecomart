-- Schema for EcoMart project
-- Run: mysql -u root -p < schema.sql

CREATE DATABASE IF NOT EXISTS ecomart;
USE ecomart;

-- Users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('buyer','seller','admin') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Example admin (optional)
-- Password should be bcrypt hashed in production, this is just demo
-- Replace 'hashed_password_here' with bcrypt hash
-- INSERT INTO users (user_code, email, password_hash, role)
-- VALUES ('A1', 'admin@ecomart.com', 'hashed_password_here', 'admin');
