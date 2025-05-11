const express = require('express');
const cors = require('cors');
const { sequelize, testConnection } = require('./config/database');
const Video = require('./models/Video');

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the YouTube Video Downloader API' });
});

// Example Video routes
app.post('/videos', async (req, res) => {
    try {
        const video = await Video.create(req.body);
        res.status(201).json(video);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/videos', async (req, res) => {
    try {
        const videos = await Video.findAll();
        res.json(videos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Database sync and server start
const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        // Test database connection
        await testConnection();
        
        // Sync database (in development, you might want to use { force: true })
        await sequelize.sync();
        
        // Start server
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
    }
};

startServer(); 