const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs'); 
const { db, initializeDatabase } = require('./database');
const authRoutes = require('./routes/auth');
const teacherRoutes = require('./routes/teachers');
const studentRoutes = require('./routes/students');
const doubtRoutes = require('./routes/doubts');
const solutionRoutes = require('./routes/solutions');
const messageRoutes = require('./routes/messages');

const app = express();
const PORT = process.env.PORT || 5500; 

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Use cloud drive uploads folder or fallback to local data/uploads folder
const uploadFolder = process.env.STORAGE_PATH 
    ? path.join(process.env.STORAGE_PATH, 'uploads') 
    : path.join(__dirname, 'data', 'uploads');

// Safely create the uploads directory on startup if it doesn't exist yet
if (!fs.existsSync(uploadFolder)) {
    fs.mkdirSync(uploadFolder, { recursive: true });
}

// Serve static files from the dynamic uploads folder path
app.use('/api/uploads', express.static(uploadFolder));

initializeDatabase();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api', teacherRoutes);
app.use('/api', studentRoutes);
app.use('/api', doubtRoutes);
app.use('/api', solutionRoutes);
app.use('/api', messageRoutes);

// Basic health check route
app.get('/api/health', (req, res) => {
    res.json({ message: 'Server is running' });
});

// Point Express to frontend folder
const frontendPath = path.join(__dirname, '../frontend');
app.use(express.static(frontendPath));

// Send users to the homepage if they visit the main URL
app.get('*', (req, res) => {
    // Make sure not to accidentally break API routes!
    if (req.originalUrl.startsWith('/api')) {
        return res.status(404).json({ error: 'API route not found' });
    }
    // For everything else, serve the frontend HTML
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});