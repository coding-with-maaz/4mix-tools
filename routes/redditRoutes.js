const express = require('express');
const router = express.Router();
const redditController = require('../controllers/redditController');
const { apiLimiter, downloadLimiter } = require('../middleware/rateLimiter');
const { validateRedditUrl } = require('../middleware/redditValidator');

// Apply rate limiting
router.use(apiLimiter);
router.post('/download', downloadLimiter);

// Get video info
router.post('/info', validateRedditUrl, redditController.getVideoInfo);

// Download video
router.post('/download', validateRedditUrl, redditController.downloadVideo);

module.exports = router; 