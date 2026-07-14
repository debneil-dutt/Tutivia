```js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Use cloud path if available, fallback to a local 'data' folder
const storageFolder = process.env.STORAGE_PATH || path.join(__dirname, 'data');

// Automatically create the folder if it doesn't exist yet
if (!fs.existsSync(storageFolder)) {
    fs.mkdirSync(storageFolder, { recursive: true });
}

// Define the final database file path inside that folder
const dbPath = path.join(storageFolder, 'tutivia.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Database connection error:', err);
    } else {
        console.log(`Connected to SQLite database at: ${dbPath}`);
    }
});

function initializeDatabase() {
    db.serialize(() => {
        // Users table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            userType TEXT NOT NULL,
            school TEXT,
            board TEXT,
            subject TEXT,
            classLevel TEXT,
            competitiveExams TEXT,
            experience INTEGER,
            bio TEXT,
            rating REAL DEFAULT 0,
            hourlyRate REAL,
            currency TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Doubts table
        db.run(`CREATE TABLE IF NOT EXISTS doubts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            studentId INTEGER NOT NULL,
            title TEXT NOT NULL,
            subject TEXT,
            description TEXT,
            image TEXT,
            solved BOOLEAN DEFAULT 0,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(studentId) REFERENCES users(id)
        )`);

        // Solutions table
        db.run(`CREATE TABLE IF NOT EXISTS solutions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            doubtId INTEGER NOT NULL,
            teacherId INTEGER NOT NULL,
            solutionText TEXT,
            solutionImage TEXT,
            rating REAL,
            feedback TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(doubtId) REFERENCES doubts(id),
            FOREIGN KEY(teacherId) REFERENCES users(id)
        )`, () => {
            // Attempt to add feedback column if table already exists (ignore error if it already has the column)
            db.run(`ALTER TABLE solutions ADD COLUMN feedback TEXT`, (err) => { /* ignore */ });
        });

        // Add new columns to existing users table
        db.run(`ALTER TABLE users ADD COLUMN hourlyRate REAL`, (err) => { /* ignore if exists */ });
        db.run(`ALTER TABLE users ADD COLUMN currency TEXT`, (err) => { /* ignore if exists */ });
        db.run(`ALTER TABLE users ADD COLUMN classLevel TEXT`, (err) => { /* ignore if exists */ });
        db.run(`ALTER TABLE users ADD COLUMN competitiveExams TEXT`, (err) => { /* ignore if exists */ });
    });
}

module.exports = { db, initializeDatabase };
```
