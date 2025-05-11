require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { apiLimiter, downloadLimiter } = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');
const { findAvailablePort } = require('./utils/portCheck');
const { cleanupOldFiles } = require('./utils/cleanup');
const ytRoutes = require('./routes/ytRoutes');
const fbRoutes = require('./routes/fb');
const igRoutes = require('./routes/ig');
const tiktokRoutes = require('./routes/tiktok');
const pinterestRoutes = require('./routes/pinterest');
const twitterRoutes = require('./routes/twitter');
const threadsRoutes = require('./routes/threads');
const redditRoutes = require('./routes/redditRoutes');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
    origin: 'http://localhost:5173', // Your frontend URL
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    exposedHeaders: ['Content-Disposition']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('combined'));

// Rate limiting
app.use('/api/youtube', apiLimiter);
app.use('/api/youtube/download', downloadLimiter);

// Routes
app.use('/api/youtube', ytRoutes);
app.use('/api/facebook', fbRoutes);
app.use('/api/instagram', igRoutes);
app.use('/api/tiktok', tiktokRoutes);
app.use('/api/pinterest', pinterestRoutes);
app.use('/api/twitter', twitterRoutes);
app.use('/api/threads', threadsRoutes);
app.use('/api/reddit', redditRoutes);

// Basic route for testing
app.get('/', (req, res) => {
    res.json({ message: 'YouTube Video Downloader API is running' });
});

// Error handling
app.use(errorHandler);

// Handle 404
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        details: 'The requested endpoint does not exist'
    });
});

const startServer = async () => {
    try {
        // Initialize cleanup
        await cleanupOldFiles();
        
        const desiredPort = process.env.PORT || 5000;
        const port = await findAvailablePort(desiredPort);
        
        const server = app.listen(port, () => {
            console.log(`Server running on port ${port}`);
            if (port !== desiredPort) {
                console.log(`Note: Original port ${desiredPort} was in use, using ${port} instead`);
            }
        });

        // Graceful shutdown
        process.on('SIGTERM', () => {
            console.log('SIGTERM signal received: closing HTTP server');
            server.close(() => {
                console.log('HTTP server closed');
                process.exit(0);
            });
        });

        process.on('SIGINT', () => {
            console.log('SIGINT signal received: closing HTTP server');
            server.close(() => {
                console.log('HTTP server closed');
                process.exit(0);
            });
        });

    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer(); 