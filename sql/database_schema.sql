-- ============================================
-- AVOCADO Database Schema
-- ============================================
-- Author: Ishrakuzzaman Emon
-- Created: 2024-06-15

-- This file creates all the tables needed for the marketplace application
-- ================================================================================================================

CREATE DATABASE IF NOT EXISTS avocado_db;
USE avocado_db;

-- ============ USERS TABLE ============
-- Stores information about all registered users
CREATE TABLE IF NOT EXISTS users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,  -- Unique ID for each user
  name VARCHAR(100) NOT NULL,              -- User's full name
  personal_email VARCHAR(100) UNIQUE NOT NULL,  -- Personal email (must be unique)
  uni_email VARCHAR(100) UNIQUE NOT NULL,      -- University email (must have .edu)
  password_hash VARCHAR(255) NOT NULL,    -- Encrypted password (never store plain text)
  role_id INT DEFAULT 1,                  -- User's role (student, moderator, admin)
  is_verified BOOLEAN DEFAULT FALSE,      -- Has user verified their email?
  verification_token VARCHAR(255),        -- Token sent in verification email
  verification_date TIMESTAMP NULL,       -- When user verified their email
  avatar_color VARCHAR(7),                -- Color for user's avatar
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- When account was created
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,  -- When last updated
  INDEX idx_uni_email (uni_email),
  INDEX idx_personal_email (personal_email)
);

-- ============ ROLES TABLE ============
-- Defines different user types and their permissions
CREATE TABLE IF NOT EXISTS roles (
  role_id INT AUTO_INCREMENT PRIMARY KEY,  -- Unique ID for each role
  role_name VARCHAR(50) UNIQUE NOT NULL,   -- Name of role (student, moderator, admin)
  description VARCHAR(255),                -- What this role can do
  permissions JSON                         -- List of permissions as JSON
);

-- Add the three default user roles
INSERT INTO roles (role_name, description) VALUES
('student', 'General student access'),
('moderator', 'Can post alerts and moderate content'),
('admin', 'Full administrative access');

-- ============ MARKETPLACE ITEMS TABLE ============
-- Stores all products/items listed for sale, rental, or free
CREATE TABLE IF NOT EXISTS marketplace_items (
  item_id INT AUTO_INCREMENT PRIMARY KEY,     -- Unique ID for each item
  owner_id INT NOT NULL,                      -- Which user is selling/renting this
  title VARCHAR(200) NOT NULL,                -- Item name
  description TEXT,                          -- Detailed description
  category ENUM('electronics', 'furniture', 'textbooks', 'sports', 'clothing', 'other') NOT NULL,  -- Type of item
  item_type ENUM('buy', 'sell', 'rent', 'free') NOT NULL,  -- What user wants to do
  price DECIMAL(10, 2),                       -- Price (if selling/renting)
  original_price DECIMAL(10, 2),              -- Original retail price
  condition ENUM('Like New', 'Good', 'Fair', 'Used') NOT NULL,  -- Condition of item
  dorm_location VARCHAR(100),                 -- Which dorm is it in
  image_url VARCHAR(255),                     -- Link to product photo
  is_active BOOLEAN DEFAULT TRUE,             -- Is this listing still active?
  view_count INT DEFAULT 0,                   -- How many times viewed
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- When listed
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,  -- When updated
  FOREIGN KEY (owner_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_owner (owner_id),
  INDEX idx_type (item_type),
  INDEX idx_category (category),
  FULLTEXT INDEX ft_title_description (title, description)
);

-- ============ RENTALS TABLE ============
CREATE TABLE IF NOT EXISTS rentals (
  rental_id INT AUTO_INCREMENT PRIMARY KEY,
  item_id INT NOT NULL,
  borrower_id INT NOT NULL,
  lender_id INT NOT NULL,
  rental_start_date DATE NOT NULL,
  rental_due_date DATE NOT NULL,
  rental_return_date DATE NULL,
  deposit_amount DECIMAL(10, 2),
  deposit_refunded BOOLEAN DEFAULT FALSE,
  reminder_sent BOOLEAN DEFAULT FALSE,
  status ENUM('active', 'completed', 'overdue', 'cancelled') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES marketplace_items(item_id) ON DELETE CASCADE,
  FOREIGN KEY (borrower_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (lender_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_borrower (borrower_id),
  INDEX idx_due_date (rental_due_date)
);

-- ============ QA POSTS TABLE ============
CREATE TABLE IF NOT EXISTS qa_posts (
  post_id INT AUTO_INCREMENT PRIMARY KEY,
  author_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT,
  is_anonymous BOOLEAN DEFAULT TRUE,
  tags JSON,
  view_count INT DEFAULT 0,
  answer_count INT DEFAULT 0,
  upvote_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_author (author_id),
  INDEX idx_created (created_at),
  FULLTEXT INDEX ft_title_content (title, content)
);

-- ============ QA ANSWERS TABLE ============
CREATE TABLE IF NOT EXISTS qa_answers (
  answer_id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT NOT NULL,
  author_id INT NOT NULL,
  content TEXT NOT NULL,
  is_accepted BOOLEAN DEFAULT FALSE,
  upvote_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES qa_posts(post_id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_post (post_id),
  INDEX idx_author (author_id)
);

-- ============ DORM ALERTS TABLE ============
CREATE TABLE IF NOT EXISTS dorm_alerts (
  alert_id INT AUTO_INCREMENT PRIMARY KEY,
  creator_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT,
  alert_type ENUM('maintenance', 'event', 'alert', 'announcement') DEFAULT 'announcement',
  dorm_building VARCHAR(100),
  priority ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (creator_id) REFERENCES users(user_id) ON DELETE CASCADE,
  INDEX idx_dorm (dorm_building),
  INDEX idx_creator (creator_id),
  INDEX idx_created (created_at)
);

-- ============ DIRECT MESSAGES TABLE ============
CREATE TABLE IF NOT EXISTS direct_messages (
  message_id INT AUTO_INCREMENT PRIMARY KEY,
  sender_id INT NOT NULL,
  receiver_id INT NOT NULL,
  item_id INT,
  message_content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES marketplace_items(item_id) ON DELETE SET NULL,
  INDEX idx_sender (sender_id),
  INDEX idx_receiver (receiver_id),
  INDEX idx_receiver_read (receiver_id, is_read)
);

-- ============ USER PREFERENCES TABLE ============
CREATE TABLE IF NOT EXISTS user_preferences (
  preference_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNIQUE NOT NULL,
  subscribed_dorms JSON,
  notification_settings JSON,
  privacy_settings JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ============ RENTAL REMINDERS TABLE (for automated emails) ============
CREATE TABLE IF NOT EXISTS rental_reminders (
  reminder_id INT AUTO_INCREMENT PRIMARY KEY,
  rental_id INT NOT NULL UNIQUE,
  reminder_sent_at TIMESTAMP NULL,
  reminder_type ENUM('1day_before', '1day_after_overdue', '2days_after_overdue') DEFAULT '1day_before',
  FOREIGN KEY (rental_id) REFERENCES rentals(rental_id) ON DELETE CASCADE,
  INDEX idx_rental (rental_id)
);

-- ============ TRANSACTION LOGS TABLE ============
CREATE TABLE IF NOT EXISTS transaction_logs (
  log_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  action VARCHAR(100),
  entity_type VARCHAR(50),
  entity_id INT,
  details JSON,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
  INDEX idx_user (user_id),
  INDEX idx_created (created_at)
);

-- ============ CREATE VIEWS ============

-- View: Active Rentals for a user
CREATE OR REPLACE VIEW active_rentals_view AS
SELECT 
  r.rental_id,
  r.item_id,
  m.title,
  r.borrower_id,
  r.lender_id,
  r.rental_due_date,
  DATEDIFF(r.rental_due_date, CURDATE()) as days_remaining,
  r.status
FROM rentals r
JOIN marketplace_items m ON r.item_id = m.item_id
WHERE r.status = 'active' AND r.rental_due_date >= CURDATE();

-- View: Upcoming rental reminders
CREATE OR REPLACE VIEW upcoming_reminders_view AS
SELECT 
  r.rental_id,
  r.item_id,
  r.borrower_id,
  r.lender_id,
  u.uni_email,
  r.rental_due_date,
  m.title
FROM rentals r
JOIN users u ON r.borrower_id = u.user_id
JOIN marketplace_items m ON r.item_id = m.item_id
WHERE r.status = 'active' 
  AND r.reminder_sent = FALSE
  AND DATE(r.rental_due_date) = DATE_ADD(CURDATE(), INTERVAL 1 DAY);

-- ============ CREATE INDEXES FOR PERFORMANCE ============
CREATE INDEX idx_marketplace_created ON marketplace_items(created_at DESC);
CREATE INDEX idx_qa_posts_created ON qa_posts(created_at DESC);
CREATE INDEX idx_alerts_created ON dorm_alerts(created_at DESC);
CREATE INDEX idx_messages_created ON direct_messages(created_at DESC);

-- ============ STORED PROCEDURES ============

-- Get user notifications count
DELIMITER //
CREATE PROCEDURE GetUserNotificationCount(IN p_user_id INT)
BEGIN
  SELECT COUNT(*) as unread_count
  FROM direct_messages
  WHERE receiver_id = p_user_id AND is_read = FALSE;
END //
DELIMITER ;

-- Mark messages as read
DELIMITER //
CREATE PROCEDURE MarkMessagesAsRead(IN p_receiver_id INT, IN p_sender_id INT)
BEGIN
  UPDATE direct_messages
  SET is_read = TRUE, read_at = NOW()
  WHERE receiver_id = p_receiver_id 
    AND sender_id = p_sender_id 
    AND is_read = FALSE;
END //
DELIMITER ;

-- Get user's top items by views
DELIMITER //
CREATE PROCEDURE GetTopUserItems(IN p_user_id INT, IN p_limit INT)
BEGIN
  SELECT item_id, title, item_type, price, view_count, created_at
  FROM marketplace_items
  WHERE owner_id = p_user_id AND is_active = TRUE
  ORDER BY view_count DESC, created_at DESC
  LIMIT p_limit;
END //
DELIMITER ;

-- ============ SAMPLE DATA INSERTION ============
-- Note: In production, use proper password hashing (bcrypt)

INSERT INTO users (name, personal_email, uni_email, password_hash, role_id, is_verified, avatar_color)
VALUES 
('John Doe', 'john.doe@gmail.com', 'john.doe@university.edu', 'hashed_password_1', 1, TRUE, '#FF6B6B'),
('Sarah Smith', 'sarah.smith@gmail.com', 'sarah.smith@university.edu', 'hashed_password_2', 1, TRUE, '#4ECDC4'),
('Admin User', 'admin@avocado.com', 'admin@university.edu', 'hashed_password_admin', 3, TRUE, '#45B7D1')
ON DUPLICATE KEY UPDATE updated_at = NOW();

