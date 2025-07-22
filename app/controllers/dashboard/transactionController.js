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
        const persian_date = moment().locale('fa').format('YYYY/MM/DD HH:mm:ss');
        
        await pool.query(
            `INSERT INTO transactions 
             (user_id, amount, transaction_type, status, description, persian_date, coin) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [user_id, amount, 'deposit', 'pending', 'User deposit request', persian_date, 'IRT'] // فرض بر اینکه coin همیشه IRT هست
        );

        res.status(201).json({ message: 'Deposit request submitted successfully.' });

    } catch (err) {
        res.status(500).json({ message: 'Deposit request failed.', error: err.message });
    }
};

exports.withdraw = async (req, res) => {
    const { user_id, amount, to_card } = req.body;
    if (!user_id || !amount || isNaN(amount) || amount <= 0 || !to_card) {
        return res.status(400).json({ message: 'Valid user_id, amount, and to_card are required.' });
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
        // Insert transaction record with to_card and 'pending' status
        const persian_date = moment().locale('fa').format('YYYY/MM/DD HH:mm:ss');
        await pool.query(
            'INSERT INTO transactions (user_id, amount, transaction_type, status, description, persian_date, to_card) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [user_id, amount, 'withdraw', 'pending', 'User withdrawal request', persian_date, to_card]
        );
        res.status(201).json({ message: 'Withdrawal request submitted successfully.' });
    } catch (err) {
        res.status(500).json({ message: 'Withdrawal request failed.', error: err.message });
    }
};

exports.registerBankCard = async (req, res) => {
    const { user_id, bank_name, bank_number, card_holder } = req.body;
    if (!user_id || !bank_name || !bank_number || !card_holder) {
        return res.status(400).json({ message: 'All fields are required.' });
    }
    try {
        await pool.query(
            'INSERT INTO banks (user_id, bank_name, bank_number, card_holder) VALUES (?, ?, ?, ?)',
            [user_id, bank_name, bank_number, card_holder]
        );
        res.status(201).json({ message: 'Bank card registered successfully.' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to register bank card.', error: err.message });
    }
};

exports.getUserInfo = async (req, res) => {
    const { user_id } = req.params;
    if (!user_id) {
        return res.status(400).json({ message: 'User ID is required.' });
    }
    try {
        const [rows] = await pool.query('SELECT user_id, user_email, user_name, user_balance, user_role, created_at FROM users WHERE user_id = ?', [user_id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.status(200).json({ user: rows[0] });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch user info.', error: err.message });
    }
};

exports.getUserWithdrawals = async (req, res) => {
    const { user_id } = req.params;
    if (!user_id) {
        return res.status(400).json({ message: 'User ID is required.' });
    }
    try {
        const [rows] = await pool.query(
            'SELECT * FROM transactions WHERE user_id = ? AND transaction_type = ? ORDER BY created_at DESC',
            [user_id, 'withdraw']
        );
        res.status(200).json({ withdrawals: rows });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch withdrawals.', error: err.message });
    }
};

exports.getUserCards = async (req, res) => {
    const { user_id } = req.params;
    if (!user_id) {
        return res.status(400).json({ message: 'User ID is required.' });
    }
    try {
        const [rows] = await pool.query('SELECT bank_id, bank_name, bank_number, card_holder, is_active, created_at FROM banks WHERE user_id = ?', [user_id]);
        res.status(200).json({ cards: rows });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch user cards.', error: err.message });
    }
};

exports.createTicket = async (req, res) => {
    const { user_id, subject, message } = req.body;
    if (!user_id || !subject || !message) {
        return res.status(400).json({ message: 'user_id, subject, and message are required.' });
    }
    try {
        await pool.query(
            'INSERT INTO ticket (user_id, subject, message) VALUES (?, ?, ?)',
            [user_id, subject, message]
        );
        res.status(201).json({ message: 'Ticket created successfully.' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to create ticket.', error: err.message });
    }
};

exports.getUserTickets = async (req, res) => {
    const { user_id } = req.params;
    if (!user_id) {
        return res.status(400).json({ message: 'User ID is required.' });
    }
    try {
        const [rows] = await pool.query('SELECT * FROM ticket WHERE user_id = ? ORDER BY created_at DESC', [user_id]);
        res.status(200).json({ tickets: rows });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch tickets.', error: err.message });
    }
};
