const express = require('express');
const { db } = require('../database');
const router = express.Router();

// Signup
router.post('/signup', (req, res) => {
    const { name, email, password, userType, school, board, subject, experience, bio } = req.body;

    // Validation
    if (!name || !email || !password || !userType) {
        return res.json({ success: false, error: 'Missing required fields' });
    }

    const query = `INSERT INTO users (name, email, password, userType, school, board, subject, experience, bio) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.run(query, [name, email, password, userType, school || null, board || null, subject || null, experience || null, bio || null], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.json({ success: false, error: 'Email already registered' });
            }
            return res.json({ success: false, error: 'Error creating account' });
        }
        res.json({ success: true, userId: this.lastID });
    });
});

// Login
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.json({ success: false, error: 'Email and password required' });
    }

    const query = `SELECT * FROM users WHERE email = ? AND password = ?`;

    db.get(query, [email, password], (err, user) => {
        if (err) {
            return res.json({ success: false, error: 'Database error' });
        }

        if (!user) {
            return res.json({ success: false, error: 'Invalid email or password' });
        }

        res.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                userType: user.userType,
                subject: user.subject
            }
        });
    });
});

// Update user profile
router.put('/profile/:userId', (req, res) => {
    const { userId } = req.params;
    const { name, email, bio, subject, experience, board, school } = req.body;

    if (!userId) {
        return res.json({ success: false, error: 'User ID required' });
    }

    const updates = [];
    const params = [];

    if (name) {
        updates.push('name = ?');
        params.push(name);
    }
    if (email) {
        updates.push('email = ?');
        params.push(email);
    }
    if (bio) {
        updates.push('bio = ?');
        params.push(bio);
    }
    if (subject) {
        updates.push('subject = ?');
        params.push(subject);
    }
    if (experience !== undefined) {
        updates.push('experience = ?');
        params.push(experience);
    }
    if (board) {
        updates.push('board = ?');
        params.push(board);
    }
    if (school) {
        updates.push('school = ?');
        params.push(school);
    }

    if (updates.length === 0) {
        return res.json({ success: false, error: 'No fields to update' });
    }

    params.push(userId);

    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;

    db.run(query, params, (err) => {
        if (err) {
            return res.json({ success: false, error: 'Error updating profile' });
        }

        // Fetch and return updated user data
        db.get(`SELECT id, name, email, userType, subject, experience, board, school, bio FROM users WHERE id = ?`, [userId], (err, user) => {
            if (err) {
                return res.json({ success: false, error: 'Error fetching updated profile' });
            }
            res.json({ success: true, user });
        });
    });
});

// Get user profile
router.get('/profile/:userId', (req, res) => {
    const { userId } = req.params;

    db.get(`SELECT id, name, email, userType, subject, experience, board, school, bio FROM users WHERE id = ?`, [userId], (err, user) => {
        if (err) {
            return res.json({ success: false, error: 'Error fetching profile' });
        }
        if (!user) {
            return res.json({ success: false, error: 'User not found' });
        }
        res.json({ success: true, user });
    });
});

// Delete user profile
router.delete('/profile/:userId', (req, res) => {
    const { userId } = req.params;

    if (!userId) {
        return res.json({ success: false, error: 'User ID required' });
    }

    db.serialize(() => {
        // Delete solutions provided by the user (if teacher)
        db.run(`DELETE FROM solutions WHERE teacherId = ?`, [userId]);
        // Delete solutions belonging to doubts asked by the user (if student)
        db.run(`DELETE FROM solutions WHERE doubtId IN (SELECT id FROM doubts WHERE studentId = ?)`, [userId]);
        // Delete doubts asked by the user (if student)
        db.run(`DELETE FROM doubts WHERE studentId = ?`, [userId]);
        
        // Finally, delete the user account
        db.run(`DELETE FROM users WHERE id = ?`, [userId], function(err) {
            if (err) {
                return res.json({ success: false, error: 'Error deleting user account' });
            }
            res.json({ success: true, message: 'Account deleted successfully' });
        });
    });
});

// Send message
router.post('/messages', (req, res) => {
    const { senderId, recipientId, subject, message } = req.body;

    if (!senderId || !recipientId || !subject || !message) {
        return res.json({ success: false, error: 'Missing required fields' });
    }

    const query = `INSERT INTO messages (senderId, recipientId, subject, message) VALUES (?, ?, ?, ?)`;

    db.run(query, [senderId, recipientId, subject, message], function(err) {
        if (err) {
            return res.json({ success: false, error: 'Error sending message' });
        }
        res.json({ success: true, messageId: this.lastID });
    });
});

// Get messages for user
router.get('/messages/:userId', (req, res) => {
    const { userId } = req.params;

    const query = `SELECT m.id, m.senderId, m.subject, m.message, m.createdAt, u.name as senderName 
                   FROM messages m 
                   JOIN users u ON m.senderId = u.id 
                   WHERE m.recipientId = ? 
                   ORDER BY m.createdAt DESC`;

    db.all(query, [userId], (err, messages) => {
        if (err) {
            return res.json({ success: false, error: 'Error fetching messages' });
        }
        res.json({ messages: messages || [] });
    });
});

module.exports = router;
