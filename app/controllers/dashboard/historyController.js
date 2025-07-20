const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_SERVER,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: parseInt(process.env.DB_PORT, 10) || 3306,
});

exports.getUserTransactions = async (req, res) => {
    const { user_id } = req.params;
    if (!user_id) {
        return res.status(400).json({ message: 'User ID is required.' });
    }
    try {
        const [rows] = await pool.query('SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC', [user_id]);
        res.status(200).json({ transactions: rows });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch transactions.', error: err.message });
    }
};
