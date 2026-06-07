const express = require('express');
const { db } = require('../database');
const router = express.Router();

// Get students with filters
router.get('/students', (req, res) => {
    const { school, board } = req.query;

    let query = `SELECT id, name, school, board, email FROM users WHERE userType = 'student'`;
    const params = [];

    if (school) {
        query += ` AND school LIKE ?`;
        params.push(`%${school}%`);
    }

    if (board) {
        query += ` AND board = ?`;
        params.push(board);
    }

    db.all(query, params, (err, students) => {
        if (err) {
            return res.json({ success: false, error: 'Error fetching students' });
        }
        res.json({ students: students || [] });
    });
});

module.exports = router;
