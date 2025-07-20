-- MySQL table creation script for 'send_receive'
CREATE TABLE IF NOT EXISTS send_receive (
    sr_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type VARCHAR(10) NOT NULL, -- 'send' or 'receive'
    amount DECIMAL(18,2) NOT NULL,
    to_card VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);
