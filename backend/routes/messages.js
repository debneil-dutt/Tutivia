const express = require('express');
const router = express.Router();
const { db } = require('../database');

// Send a message
router.post('/messages', (req, res) => {
    const { senderId, recipientId, subject, message } = req.body;
    
    if (!senderId || !recipientId || !subject || !message) {
        return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    const query = `INSERT INTO messages (senderId, recipientId, subject, message) VALUES (?, ?, ?, ?)`;
    db.run(query, [senderId, recipientId, subject, message], function(err) {
        if (err) {
            console.error('Error sending message:', err);
            return res.status(500).json({ success: false, error: 'Database error' });
        }
        res.json({ success: true, messageId: this.lastID });
    });
});

// Get messages for a user
router.get('/messages/:userId', (req, res) => {
    const userId = req.params.userId;
    
    const query = `
        SELECT m.*, u.name as senderName 
        FROM messages m 
        JOIN users u ON m.senderId = u.id 
        WHERE m.recipientId = ? 
        ORDER BY m.createdAt DESC
    `;
    
    db.all(query, [userId], (err, rows) => {
        if (err) {
            console.error('Error fetching messages:', err);
            return res.status(500).json({ success: false, error: 'Database error' });
        }
        res.json({ success: true, messages: rows });
    });
});

module.exports = router;
