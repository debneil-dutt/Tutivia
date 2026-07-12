const express = require('express');
const { db } = require('../database');
const router = express.Router();

// Get teachers with filters
router.get('/teachers', (req, res) => {
    const { subject, board, minExperience } = req.query;

    let query = `
        SELECT 
            u.id, u.name, u.subject, u.experience, u.board, u.email, u.bio, 
            ROUND(AVG(s.rating), 1) as overallRating
        FROM users u
        LEFT JOIN solutions s ON u.id = s.teacherId
        WHERE u.userType = 'teacher'
    `;
    const params = [];

    if (subject) {
        query += ` AND u.subject LIKE ?`;
        params.push(`%${subject}%`);
    }

    if (board) {
        query += ` AND u.board LIKE ?`;
        params.push(`%${board}%`);
    }

    if (minExperience) {
        query += ` AND u.experience >= ?`;
        params.push(parseInt(minExperience));
    }

    query += ` GROUP BY u.id`;

    db.all(query, params, (err, teachers) => {
        if (err) {
            return res.json({ success: false, error: 'Error fetching teachers' });
        }
        res.json({ teachers: teachers || [] });
    });
});

module.exports = router;