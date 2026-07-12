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

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage });

// Get doubts with filters
router.get('/doubts', (req, res) => {
    const { studentId, subject, solved } = req.query;

    let query = `SELECT * FROM doubts`;
    const params = [];
    const conditions = [];

    if (studentId) {
        conditions.push(`studentId = ?`);
        params.push(studentId);
    }

    if (subject) {
        conditions.push(`subject LIKE ?`);
        params.push(`%${subject}%`);
    }

    if (solved !== undefined && solved !== '') {
        conditions.push(`solved = ?`);
        params.push(solved === 'true' ? 1 : 0);
    }

    if (conditions.length > 0) {
        query += ` WHERE ` + conditions.join(' AND ');
    }

    query += ` ORDER BY createdAt DESC`;

    db.all(query, params, (err, doubts) => {
        if (err) {
            return res.json({ success: false, error: 'Error fetching doubts' });
        }
        res.json({ doubts: doubts || [] });
    });
});

// Upload a doubt
router.post('/doubts', upload.single('image'), (req, res) => {
    const { studentId, title, subject, description } = req.body;
    const image = req.file ? req.file.filename : null;

    if (!studentId || !title) {
        return res.json({ success: false, error: 'Missing required fields' });
    }

    const query = `INSERT INTO doubts (studentId, title, subject, description, image) VALUES (?, ?, ?, ?, ?)`;

    db.run(query, [studentId, title, subject || null, description || null, image], function(err) {
        if (err) {
            return res.json({ success: false, error: 'Error uploading doubt' });
        }
        res.json({ success: true, doubtId: this.lastID });
    });
});

// Delete a doubt
router.delete('/doubts/:doubtId', (req, res) => {
    const { doubtId } = req.params;

    if (!doubtId) {
        return res.json({ success: false, error: 'Doubt ID required' });
    }

    // First, delete solutions associated with this doubt
    db.run(`DELETE FROM solutions WHERE doubtId = ?`, [doubtId], (err) => {
        if (err) {
            return res.json({ success: false, error: 'Error deleting solutions' });
        }

        // Then delete the doubt
        db.run(`DELETE FROM doubts WHERE id = ?`, [doubtId], (err) => {
            if (err) {
                return res.json({ success: false, error: 'Error deleting doubt' });
            }
            res.json({ success: true, message: 'Doubt deleted successfully' });
        });
    });
});

module.exports = router;