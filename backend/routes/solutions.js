const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { db } = require('../database');
const router = express.Router();

// Use cloud drive if available, fallback to local data/uploads
const uploadsDir = process.env.STORAGE_PATH 
    ? path.join(process.env.STORAGE_PATH, 'uploads') 
    : path.join(__dirname, '../data/uploads');

// Create the folder safely if it doesn't exist
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage });

// Get solutions for a doubt
router.get('/solutions/:doubtId', (req, res) => {
    const { doubtId } = req.params;

    const query = `SELECT s.id, s.solutionText, s.solutionImage, s.rating, COALESCE(u.name, 'Unknown Teacher') as teacherName 
                   FROM solutions s 
                   LEFT JOIN users u ON s.teacherId = u.id 
                   WHERE s.doubtId = ?
                   ORDER BY s.createdAt DESC`;

    db.all(query, [doubtId], (err, solutions) => {
        if (err) {
            return res.json({ success: false, error: 'Error fetching solutions' });
        }

        // Mark doubt as solved if there are solutions
        db.run(`UPDATE doubts SET solved = 1 WHERE id = ?`, [doubtId]);

        res.json({ solutions: solutions || [] });
    });
});

// Upload a solution
router.post('/solutions', upload.single('solutionImage'), (req, res) => {
    const { doubtId, teacherId, solutionText, rating } = req.body;
    const solutionImage = req.file ? req.file.filename : null;

    if (!doubtId || !teacherId || !solutionText) {
        return res.json({ success: false, error: 'Missing required fields' });
    }

    db.get(`SELECT id FROM users WHERE id = ?`, [teacherId], (err, user) => {
        if (err || !user) {
            return res.json({ success: false, error: 'Teacher account not found. Please log in again.' });
        }

        const query = `INSERT INTO solutions (doubtId, teacherId, solutionText, solutionImage, rating) 
                       VALUES (?, ?, ?, ?, ?)`;

        db.run(query, [doubtId, teacherId, solutionText, solutionImage, rating || null], function(err) {
        if (err) {
            return res.json({ success: false, error: 'Error uploading solution' });
        }

        // Update doubt as solved
        db.run(`UPDATE doubts SET solved = 1 WHERE id = ?`, [doubtId]);

        res.json({ success: true, solutionId: this.lastID });
    });
    });
});

// Rate a solution
router.put('/solutions/:solutionId/rating', (req, res) => {
    const { solutionId } = req.params;
    const { rating } = req.body;

    if (!solutionId || rating === undefined || rating === null) {
        return res.json({ success: false, error: 'Solution ID and rating required' });
    }

    if (rating < 1 || rating > 5) {
        return res.json({ success: false, error: 'Rating must be between 1 and 5' });
    }

    const query = `UPDATE solutions SET rating = ? WHERE id = ?`;

    db.run(query, [rating, solutionId], (err) => {
        if (err) {
            return res.json({ success: false, error: 'Error updating rating' });
        }
        res.json({ success: true, message: 'Rating updated successfully' });
    });
});

module.exports = router;
