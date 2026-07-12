const express = require('express');
const { db } = require('../database');
const router = express.Router();

// Get students with filters
router.get('/students', (req, res) => {
    const { subject, board } = req.query;

    let query = `SELECT id, name, school, subject, board, email FROM users WHERE userType = 'student'`;
    const params = [];

    if (subject) {
        query += ` AND subject LIKE ?`;
        params.push(`%${subject}%`);
    }

    if (board) {
        query += ` AND board LIKE ?`;
        params.push(`%${board}%`);
    }

    db.all(query, params, (err, students) => {
        if (err) {
            return res.json({ success: false, error: 'Error fetching students' });
        }
        res.json({ students: students || [] });
    });
});

module.exports = router;