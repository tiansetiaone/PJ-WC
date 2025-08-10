-- USERS
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100),
  username VARCHAR(50) UNIQUE,
  email VARCHAR(100) UNIQUE,
  password VARCHAR(255),
  whatsapp_number VARCHAR(20),
  usdt_address VARCHAR(100),
  role ENUM('user', 'admin') DEFAULT 'user',
  referral_code VARCHAR(20),
  referred_by VARCHAR(20),
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CAMPAIGNS
CREATE TABLE campaigns (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  campaign_name VARCHAR(255),
  profile_image VARCHAR(255),
  message TEXT,
  campaign_image VARCHAR(255),
  status ENUM('on_process', 'success', 'failed') DEFAULT 'on_process',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- CAMPAIGN NUMBERS
CREATE TABLE campaign_numbers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  campaign_id INT,
  phone_number VARCHAR(20),
  status ENUM('success', 'failed') DEFAULT 'success',
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
);

-- DEPOSITS
CREATE TABLE deposits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  method VARCHAR(50),
  destination_address VARCHAR(255),
  amount DECIMAL(10, 2),
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- REFERRALS
CREATE TABLE referrals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  referrer_id INT,
  referred_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (referrer_id) REFERENCES users(id),
  FOREIGN KEY (referred_id) REFERENCES users(id)
);

-- COMMISSIONS
CREATE TABLE commissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  amount DECIMAL(10, 2),
  converted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- NOTIFICATIONS
CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(100),
  content TEXT,
  user_scope ENUM('all', 'user', 'admin') DEFAULT 'all',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SUPPORT TICKETS
CREATE TABLE support_tickets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  subject VARCHAR(255),
  message TEXT,
  status ENUM('open', 'closed') DEFAULT 'open',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
