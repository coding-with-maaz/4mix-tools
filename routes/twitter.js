const express = require('express');
const router = express.Router();
const twitterController = require('../controllers/twitterController');

// POST /api/twitter/info
router.post('/info', twitterController.getVideoInfo);

// GET or POST /api/twitter/download
router.get('/download', twitterController.downloadVideo);
router.post('/download', twitterController.downloadVideo);

module.exports = router; 