const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_SERVER,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: parseInt(process.env.DB_PORT, 10) || 3306,
});

exports.updateTransactionStatus = async (req, res) => {
    const { transaction_id } = req.params;
    const { status } = req.body; // expecting 'approved' or 'rejected'

    if (!status || !['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Valid status (approved/rejected) is required.' });
    }

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const [transactionRows] = await connection.query('SELECT * FROM transactions WHERE transaction_id = ?', [transaction_id]);
        if (transactionRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Transaction not found.' });
        }
        const transaction = transactionRows[0];
        if (transaction.status !== 'pending') {
            await connection.rollback();
            return res.status(400).json({ message: 'Transaction has already been processed.' });
        }

        await connection.query('UPDATE transactions SET status = ? WHERE transaction_id = ?', [status, transaction_id]);

        if (status === 'approved') {
            const { user_id, amount, transaction_type } = transaction;
            if (transaction_type === 'deposit') {
                await connection.query('UPDATE users SET user_balance = user_balance + ? WHERE user_id = ?', [amount, user_id]);
            } else if (transaction_type === 'withdraw') {
                await connection.query('UPDATE users SET user_balance = user_balance - ? WHERE user_id = ?', [amount, user_id]);
            }
        }

        await connection.commit();
        res.status(200).json({ message: `Transaction ${status}.` });
    } catch (err) {
        await connection.rollback();
        res.status(500).json({ message: 'Failed to update transaction status.', error: err.message });
    } finally {
        connection.release();
    }
};

exports.updateUserBalance = async (req, res) => {
    const { user_id } = req.params;
    const { amount } = req.body;

    if (!amount || isNaN(amount)) {
        return res.status(400).json({ message: 'Valid amount is required.' });
    }

    try {
        await pool.query('UPDATE users SET user_balance = ? WHERE user_id = ?', [amount, user_id]);
        res.status(200).json({ message: 'User balance updated successfully.' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update user balance.', error: err.message });
    }
};

exports.getPendingTransactions = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM transactions WHERE status = 'pending' AND (transaction_type = 'deposit' OR transaction_type = 'withdraw') ORDER BY created_at DESC");
        res.status(200).json({ transactions: rows });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch pending transactions.', error: err.message });
    }
}; 