const express = require('express');
const router = express.Router();
const ytController = require('../controllers/ytController');

// Test endpoint to verify yt-dlp installation
router.get('/test', async (req, res) => {
    try {
        const { execYtDlp } = require('../utils/execYtDlp');
        const version = await execYtDlp('--version');
        res.json({ version });
    } catch (error) {
        res.status(500).json({ error: 'yt-dlp not found or not working properly' });
    }
});

// Get video information
router.post('/info', ytController.getVideoInfo);

// Download video
router.post('/download', ytController.downloadVideo);

// Get available subtitles
router.post('/subtitles/list', ytController.getAvailableSubtitles);

// Download subtitles
router.post('/subtitles', ytController.downloadSubtitles);

module.exports = router; 