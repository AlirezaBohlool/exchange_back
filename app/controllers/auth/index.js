const moment = require('jalali-moment');

exports.login = async (req, res) => {
    const { user_email, user_password } = req.body;
    if (!user_email || !user_password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }
    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE user_email = ?', [user_email]);
        if (rows.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }
        const user = rows[0];
        const isMatch = await bcrypt.compare(user_password, user.user_password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }
        // You can add JWT or session logic here if needed
        const jalaliDate = moment().locale('fa').format('YYYY/MM/DD HH:mm:ss');
        res.status(200).json({ message: 'Login successful.', user: { user_id: user.user_id, user_email: user.user_email, user_name: user.user_name, user_role: user.user_role }, jalaliDate });
    } catch (err) {
        res.status(500).json({ message: 'Login failed.', error: err.message });
    }
};
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
require('dotenv').config();

// Create a MySQL connection pool
const pool = mysql.createPool({
    host: process.env.DB_SERVER,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: parseInt(process.env.DB_PORT, 10) || 3306,
});

exports.register = async (req, res) => {
    const { user_email, user_password, user_name } = req.body;
    if (!user_email || !user_password || !user_name) {
        return res.status(400).json({ message: 'All fields are required.' });
    }
    try {
        // Check if user already exists
        const [rows] = await pool.query('SELECT user_id FROM users WHERE user_email = ?', [user_email]);
        if (rows.length > 0) {
            return res.status(409).json({ message: 'User already exists.' });
        }
        // Hash password
        const hashedPassword = await bcrypt.hash(user_password, 10);
        // Insert new user
        await pool.query(
            'INSERT INTO users (user_email, user_password, user_name) VALUES (?, ?, ?)',
            [user_email, hashedPassword, user_name]
        );
        const jalaliDate = moment().locale('fa').format('YYYY/MM/DD HH:mm:ss');
        res.status(201).json({ message: 'User registered successfully.', jalaliDate });
    } catch (err) {
        res.status(500).json({ message: 'Registration failed.', error: err.message });
    }
};
