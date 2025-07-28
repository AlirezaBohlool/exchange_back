const mysql = require('mysql2/promise');
require('dotenv').config();
const moment = require('jalali-moment');

const pool = mysql.createPool({
    host: process.env.DB_SERVER,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: parseInt(process.env.DB_PORT, 10) || 3306,
});
// Get all tickets (admin use)
exports.getAllTickets = async (req, res) => {
  try {
    const [tickets] = await pool.query(`
      SELECT t.*, u.user_name
      FROM ticket t
      LEFT JOIN users u ON t.user_id = u.user_id
      ORDER BY t.created_at DESC
    `);

    res.status(200).json(tickets);
  } catch (err) {
    console.error('Error fetching all tickets:', err);
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
};

// Create a new ticket
exports.createTicket = async (req, res) => {
    const { user_id, subject, message } = req.body;

    try {
        const [result] = await pool.query(
            'INSERT INTO ticket (user_id, subject, message, status) VALUES (?, ?, ?, ?)',
            [user_id, subject, message, 'open']
        );
        res.status(201).json({ 
            message: 'Ticket created successfully', 
            ticket_id: result.insertId 
        });
    } catch (err) {
        console.error('Error creating ticket:', err);
        res.status(500).json({ error: 'Failed to create ticket' });
    }
};

// Get all tickets for a user with optional unread count
exports.getUserTickets = async (req, res) => {
    const { user_id } = req.params;
    const { include_unread } = req.query;

    try {
        let query;
        const queryParams = [user_id];

        if (include_unread === 'true') {
            // Enhanced query with unread count and last reply info
            query = `
                SELECT 
                    t.*,
                    COALESCE(unread_messages.unread_count, 0) as unread_count,
                    latest_reply.created_at as last_reply_at
                FROM ticket t
                LEFT JOIN (
                    SELECT 
                        ticket_id, 
                        COUNT(*) as unread_count
                    FROM ticket_reply 
                    WHERE is_read = false AND sender_type = 'admin'
                    GROUP BY ticket_id
                ) unread_messages ON t.ticket_id = unread_messages.ticket_id
                LEFT JOIN (
                    SELECT 
                        ticket_id,
                        MAX(created_at) as created_at
                    FROM ticket_reply 
                    WHERE sender_type = 'admin'
                    GROUP BY ticket_id
                ) latest_reply ON t.ticket_id = latest_reply.ticket_id
                WHERE t.user_id = ?
                ORDER BY unread_count DESC, t.created_at DESC
            `;
        } else {
            // Original simple query
            query = 'SELECT * FROM ticket WHERE user_id = ? ORDER BY created_at DESC';
        }

        const [tickets] = await pool.query(query, queryParams);

        // Process tickets to ensure consistent data format
        const processedTickets = tickets.map(ticket => ({
            ...ticket,
            unread_count: parseInt(ticket.unread_count) || 0
        }));

        res.json(processedTickets);
    } catch (err) {
        console.error('Error fetching user tickets:', err);
        res.status(500).json({ error: 'Failed to get tickets' });
    }
};

// Add a reply to a ticket
exports.addTicketReply = async (req, res) => {
    const { ticket_id, message, sender_type } = req.body;

    try {
        // Validate input
        if (!ticket_id || !message || !sender_type) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // When admin sends message: is_read = false (user hasn't seen it)
        // When user sends message: is_read = true (they've seen their own message)
        const is_read = sender_type === 'user' ? true : false;
        
        // Insert the reply
        const [result] = await pool.query(
            'INSERT INTO ticket_reply (ticket_id, message, sender_type, is_read) VALUES (?, ?, ?, ?)',
            [ticket_id, message, sender_type, is_read]
        );

        // Update ticket status based on who replied
        const newStatus = sender_type === 'admin' ? 'pending' : 'open';
        await pool.query(
            'UPDATE ticket SET status = ?, updated_at = NOW() WHERE ticket_id = ?',
            [newStatus, ticket_id]
        );

        res.status(201).json({ 
            message: 'Reply added successfully', 
            reply_id: result.insertId 
        });
    } catch (err) {
        console.error('Error adding ticket reply:', err);
        res.status(500).json({ error: 'Failed to add reply' });
    }
};

// Get all replies for a specific ticket
exports.getTicketReplies = async (req, res) => {
    const { ticket_id } = req.params;

    try {
        const [replies] = await pool.query(
            'SELECT * FROM ticket_reply WHERE ticket_id = ? ORDER BY created_at ASC',
            [ticket_id]
        );

        res.json(replies);
    } catch (err) {
        console.error('Error fetching ticket replies:', err);
        res.status(500).json({ error: 'Failed to get replies' });
    }
};

// Mark all admin messages in a ticket as read
exports.markTicketAsRead = async (req, res) => {
    const { ticket_id } = req.params;

    try {
        // Mark all unread admin messages as read
        const [result] = await pool.query(
            'UPDATE ticket_reply SET is_read = true WHERE ticket_id = ? AND sender_type = "admin" AND is_read = false',
            [ticket_id]
        );

        res.json({ 
            success: true, 
            message: 'Messages marked as read',
            marked_count: result.affectedRows
        });
    } catch (err) {
        console.error('Error marking ticket as read:', err);
        res.status(500).json({ error: 'Failed to mark messages as read' });
    }
};

// Get total unread message count for a user
exports.getUserUnreadCount = async (req, res) => {
    const { user_id } = req.params;

    try {
        const [result] = await pool.query(`
            SELECT 
                COUNT(*) as total_unread
            FROM ticket_reply tr
            JOIN ticket t ON tr.ticket_id = t.ticket_id
            WHERE t.user_id = ? 
            AND tr.sender_type = 'admin' 
            AND tr.is_read = false
        `, [user_id]);

        res.json({ 
            total_unread: parseInt(result[0].total_unread) || 0 
        });
    } catch (err) {
        console.error('Error getting user unread count:', err);
        res.status(500).json({ error: 'Failed to get unread count' });
    }
};

// Get a single ticket with unread information
exports.getTicketById = async (req, res) => {
    const { ticket_id } = req.params;

    try {
        const [tickets] = await pool.query(`
            SELECT 
                t.*,
                COALESCE(unread_messages.unread_count, 0) as unread_count
            FROM ticket t
            LEFT JOIN (
                SELECT 
                    ticket_id, 
                    COUNT(*) as unread_count
                FROM ticket_reply 
                WHERE is_read = false AND sender_type = 'admin'
                GROUP BY ticket_id
            ) unread_messages ON t.ticket_id = unread_messages.ticket_id
            WHERE t.ticket_id = ?
        `, [ticket_id]);

        if (tickets.length === 0) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        const ticket = {
            ...tickets[0],
            unread_count: parseInt(tickets[0].unread_count) || 0
        };

        res.json(ticket);
    } catch (err) {
        console.error('Error getting ticket by ID:', err);
        res.status(500).json({ error: 'Failed to get ticket' });
    }
};
// POST /dashboard/ticket/:ticket_id/close
exports.closeTicket = async (req, res) => {
    const { ticket_id } = req.params;

    try {
        const [result] = await pool.query(
            'UPDATE ticket SET status = "closed" WHERE ticket_id = ?',
            [ticket_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Ticket not found' });
        }

        res.json({ success: true, message: 'Ticket closed successfully' });
    } catch (err) {
        console.error('Error closing ticket:', err);
        res.status(500).json({ error: 'Failed to close ticket' });
    }
};