exports.sell = async (req, res) => {
    const { user_id, coin, amount, price, transaction_type } = req.body;
    if (!user_id || !coin || !amount || !price || !transaction_type) {
        return res.status(400).json({ message: 'All fields are required.' });
    }
    try {
        // Check for existing pending sell for this user and coin
        const [existing] = await pool.query(
            'SELECT transaction_id FROM transactions WHERE user_id = ? AND coin = ? AND transaction_type = ? AND status = ? LIMIT 1',
            [user_id, coin, transaction_type, 'pending']
        );
        if (existing.length > 0) {
            return res.status(409).json({ message: 'You already have a pending sell request for this coin.' });
        }
        const persian_date = moment().locale('fa').format('YYYY/MM/DD HH:mm:ss');
        await pool.query(
            'INSERT INTO transactions (user_id, amount, coin, transaction_type, status, description, persian_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [user_id, amount, coin, transaction_type, 'pending', `Price: ${price}`, persian_date]
        );
        res.status(201).json({ message: 'Sell transaction submitted successfully.', persian_date });
    } catch (err) {
        res.status(500).json({ message: 'Transaction failed.', error: err.message });
    }
};
const mysql = require('mysql2/promise');
const moment = require('jalali-moment');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_SERVER,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: parseInt(process.env.DB_PORT, 10) || 3306,
});

exports.buy = async (req, res) => {
    const { user_id, coin, amount, price, transaction_type } = req.body;
    if (!user_id || !coin || !amount || !price || !transaction_type) {
        return res.status(400).json({ message: 'All fields are required.' });
    }
    try {
        // Check for existing pending buy for this user and coin
        const [existing] = await pool.query(
            'SELECT transaction_id FROM transactions WHERE user_id = ? AND coin = ? AND transaction_type = ? AND status = ? LIMIT 1',
            [user_id, coin, transaction_type, 'pending']
        );
        if (existing.length > 0) {
            return res.status(409).json({ message: 'You already have a pending buy request for this coin.' });
        }
        const persian_date = moment().locale('fa').format('YYYY/MM/DD HH:mm:ss');
        await pool.query(
            'INSERT INTO transactions (user_id, amount, coin, transaction_type, status, description, persian_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [user_id, amount, coin, transaction_type, 'pending', `Price: ${price}`, persian_date]
        );
        res.status(201).json({ message: 'Buy transaction submitted successfully.', persian_date });
    } catch (err) {
        res.status(500).json({ message: 'Transaction failed.', error: err.message });
    }
};

exports.deposit = async (req, res) => {
    const { user_id, amount } = req.body;
    if (!user_id || !amount || isNaN(amount) || amount <= 0) {
        return res.status(400).json({ message: 'Valid user_id and amount are required.' });
    }
    try {
        // Update user balance
        await pool.query('UPDATE users SET user_balance = user_balance + ? WHERE user_id = ?', [amount, user_id]);
        // Insert transaction record
        const persian_date = moment().locale('fa').format('YYYY/MM/DD HH:mm:ss');
        await pool.query(
            'INSERT INTO transactions (user_id, amount, transaction_type, status, description, persian_date) VALUES (?, ?, ?, ?, ?, ?)',
            [user_id, amount, 'deposit', 'completed', 'User deposit', persian_date]
        );
        res.status(201).json({ message: 'Deposit successful.' });
    } catch (err) {
        res.status(500).json({ message: 'Deposit failed.', error: err.message });
    }
};

exports.withdraw = async (req, res) => {
    const { user_id, amount } = req.body;
    if (!user_id || !amount || isNaN(amount) || amount <= 0) {
        return res.status(400).json({ message: 'Valid user_id and amount are required.' });
    }
    try {
        // Check current balance
        const [rows] = await pool.query('SELECT user_balance FROM users WHERE user_id = ?', [user_id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }
        const currentBalance = parseFloat(rows[0].user_balance);
        if (currentBalance < amount) {
            return res.status(400).json({ message: 'Insufficient balance.' });
        }
        // Update user balance
        await pool.query('UPDATE users SET user_balance = user_balance - ? WHERE user_id = ?', [amount, user_id]);
        // Insert transaction record
        const persian_date = moment().locale('fa').format('YYYY/MM/DD HH:mm:ss');
        await pool.query(
            'INSERT INTO transactions (user_id, amount, transaction_type, status, description, persian_date) VALUES (?, ?, ?, ?, ?, ?)',
            [user_id, amount, 'withdraw', 'completed', 'User withdrawal', persian_date]
        );
        res.status(201).json({ message: 'Withdrawal successful.' });
    } catch (err) {
        res.status(500).json({ message: 'Withdrawal failed.', error: err.message });
    }
};
