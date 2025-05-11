-- Active: 1746570833356@@127.0.0.1@3306@desafios_nexus
USE desafios_nexus

CREATE TABLE  IF NOT EXISTS favorites (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  crypto_id VARCHAR(100) NOT NULL,
  symbol VARCHAR(100) NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE TABLE conversion_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  crypto_name VARCHAR(100) NOT NULL,
  crypto_price REAL NOT NULL,
  converted_to VARCHAR(100) DEFAULT 'USD',
  date TEXT NOT NULL,
  FOREIGN KEY(user_id) REFERENCES users(id)
);
ALTER TABLE conversion_history
MODIFY COLUMN date DATETIME DEFAULT CURRENT_TIMESTAMP;