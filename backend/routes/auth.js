const express = require('express');
const crypto = require('crypto');
const { db } = require('../database');
const router = express.Router();

// Helper to hash password
function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
}

// Helper to verify password
function verifyPassword(password, storedHashString) {
    try {
        const [salt, storedHash] = storedHashString.split(':');
        if (!salt || !storedHash) return false;
        
        const hashBuffer = Buffer.from(storedHash, 'hex');
        const inputHash = crypto.scryptSync(password, salt, 64);
        
        // Ensure buffers are the same length before timingSafeEqual
        if (hashBuffer.length !== inputHash.length) return false;
        
        return crypto.timingSafeEqual(hashBuffer, inputHash);
    } catch (e) {
        return false;
    }
}

// Signup
router.post('/signup', (req, res) => {
    const {
        name,
        email,
        password,
        userType,
        school,
        board,
        subject,
        classLevel,
        competitiveExams,
        experience,
        bio,
        hourlyRate,
        currency
    } = req.body;

    // Validation
    if (!name || !email || !password || !userType) {
        return res.json({ success: false, error: 'Missing required fields' });
    }

    const query = `INSERT INTO users (
        name,
        email,
        password,
        userType,
        school,
        board,
        subject,
        classLevel,
        competitiveExams,
        experience,
        bio,
        hourlyRate,
        currency
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const hashedPassword = hashPassword(password);

    db.run(
        query,
        [
            name,
            email,
            hashedPassword,
            userType,
            school || null,
            board || null,
            subject || null,
            classLevel || null,
            competitiveExams || null,
            experience || null,
            bio || null,
            hourlyRate || null,
            currency || null
        ],
        function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.json({ success: false, error: 'Email already registered' });
                }
                return res.json({ success: false, error: 'Error creating account' });
            }

            res.json({
                success: true,
                userId: this.lastID
            });
        }
    );
});

// Login
router.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.json({ success: false, error: 'Email and password required' });
    }

    const query = `SELECT * FROM users WHERE email = ?`;

    db.get(query, [email], (err, user) => {
        if (err) {
            return res.json({ success: false, error: 'Database error' });
        }

        if (!user) {
            return res.json({ success: false, error: 'Invalid email or password' });
        }

        const sendSuccessResponse = () => {
            res.json({
                success: true,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    userType: user.userType,
                    subject: user.subject,
                    board: user.board,
                    classLevel: user.classLevel,
                    competitiveExams: user.competitiveExams,
                    school: user.school,
                    experience: user.experience,
                    bio: user.bio,
                    hourlyRate: user.hourlyRate,
                    currency: user.currency
                }
            });
        };

        // Try to verify using the secure hash
        if (verifyPassword(password, user.password)) {
            return sendSuccessResponse();
        }

        // Fallback: Graceful migration for existing plaintext passwords
        if (user.password === password) {
            const newHashedPassword = hashPassword(password);

            db.run(
                `UPDATE users SET password = ? WHERE id = ?`,
                [newHashedPassword, user.id],
                (updateErr) => {
                    if (updateErr) {
                        console.error("Failed to migrate password for user", user.id);
                    }

                    return sendSuccessResponse();
                }
            );
        } else {
            return res.json({
                success: false,
                error: 'Invalid email or password'
            });
        }
    });
});

// Update user profile
router.put('/profile/:userId', (req, res) => {
    const { userId } = req.params;

    const {
        name,
        email,
        bio,
        subject,
        classLevel,
        competitiveExams,
        experience,
        board,
        school,
        hourlyRate,
        currency
    } = req.body;

    if (!userId) {
        return res.json({
            success: false,
            error: 'User ID required'
        });
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

    if (classLevel) {
        updates.push('classLevel = ?');
        params.push(classLevel);
    }

    if (competitiveExams) {
        updates.push('competitiveExams = ?');
        params.push(competitiveExams);
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

    if (hourlyRate !== undefined) {
        updates.push('hourlyRate = ?');
        params.push(hourlyRate);
    }

    if (currency) {
        updates.push('currency = ?');
        params.push(currency);
    }

    if (updates.length === 0) {
        return res.json({
            success: false,
            error: 'No fields to update'
        });
    }

    params.push(userId);

    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;

    db.run(query, params, (err) => {
        if (err) {
            return res.json({
                success: false,
                error: 'Error updating profile'
            });
        }

        db.get(
            `SELECT id, name, email, userType, subject, board, classLevel, competitiveExams, experience, school, bio, hourlyRate, currency FROM users WHERE id = ?`,
            [userId],
            (err, user) => {
                if (err) {
                    return res.json({
                        success: false,
                        error: 'Error fetching updated profile'
                    });
                }

                res.json({
                    success: true,
                    user
                });
            }
        );
    });
});

// Get user profile
router.get('/profile/:userId', (req, res) => {
    const { userId } = req.params;

    db.get(
        `SELECT id, name, email, userType, subject, board, classLevel, competitiveExams, experience, school, bio, hourlyRate, currency FROM users WHERE id = ?`,
        [userId],
        (err, user) => {
            if (err) {
                return res.json({
                    success: false,
                    error: 'Error fetching profile'
                });
            }

            if (!user) {
                return res.json({
                    success: false,
                    error: 'User not found'
                });
            }

            res.json({
                success: true,
                user
            });
        }
    );
});

// Delete user profile
router.delete('/profile/:userId', (req, res) => {
    const { userId } = req.params;

    if (!userId) {
        return res.json({
            success: false,
            error: 'User ID required'
        });
    }

    db.serialize(() => {
        // Delete solutions provided by the user (if teacher)
        db.run(`DELETE FROM solutions WHERE teacherId = ?`, [userId]);

        // Delete solutions belonging to doubts asked by the user (if student)
        db.run(
            `DELETE FROM solutions WHERE doubtId IN (SELECT id FROM doubts WHERE studentId = ?)`,
            [userId]
        );

        // Delete doubts asked by the user (if student)
        db.run(`DELETE FROM doubts WHERE studentId = ?`, [userId]);

        // Finally, delete the user account
        db.run(`DELETE FROM users WHERE id = ?`, [userId], function(err) {
            if (err) {
                return res.json({
                    success: false,
                    error: 'Error deleting user account'
                });
            }

            res.json({
                success: true,
                message: 'Account deleted successfully'
            });
        });
    });
});

// Send message
router.post('/messages', (req, res) => {
    const { senderId, recipientId, subject, message } = req.body;

    if (!senderId || !recipientId || !subject || !message) {
        return res.json({
            success: false,
            error: 'Missing required fields'
        });
    }

    const query = `INSERT INTO messages (senderId, recipientId, subject, message) VALUES (?, ?, ?, ?)`;

    db.run(query, [senderId, recipientId, subject, message], function(err) {
        if (err) {
            return res.json({
                success: false,
                error: 'Error sending message'
            });
        }

        res.json({
            success: true,
            messageId: this.lastID
        });
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
            return res.json({
                success: false,
                error: 'Error fetching messages'
            });
        }

        res.json({
            messages: messages || []
        });
    });
});

module.exports = router;
