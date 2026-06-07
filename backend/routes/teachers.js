const express = require('express');
const { db } = require('../database');
const router = express.Router();

// Get teachers with filters
router.get('/teachers', (req, res) => {
    const { subject, board, minExperience } = req.query;

    let query = `SELECT id, name, subject, experience, board, email, bio FROM users WHERE userType = 'teacher'`;
    const params = [];

    if (subject) {
        query += ` AND subject LIKE ?`;
        params.push(`%${subject}%`);
    }

    if (board) {
        query += ` AND board = ?`;
        params.push(board);
    }

    if (minExperience) {
        query += ` AND experience >= ?`;
        params.push(parseInt(minExperience));
    }

    db.all(query, params, (err, teachers) => {
        if (err) {
            return res.json({ success: false, error: 'Error fetching teachers' });
        }
        res.json({ teachers: teachers || [] });
    });
});

module.exports = router;
