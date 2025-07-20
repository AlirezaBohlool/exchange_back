-- MySQL table creation script for 'transactions'
CREATE TABLE IF NOT EXISTS transactions (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    amount DECIMAL(18,8) NOT NULL,
    coin VARCHAR(50) NOT NULL,
    transaction_type VARCHAR(10) NOT NULL, -- 'buy' or 'sell'
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    description VARCHAR(255),
    persian_date VARCHAR(50),
    to_card VARCHAR(50) DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);
