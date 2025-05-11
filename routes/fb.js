const express = require('express');
const router = express.Router();
const fbController = require('../controllers/fbController');

// POST /api/facebook/info
router.post('/info', fbController.getVideoInfo);

// POST /api/facebook/download
router.post('/download', fbController.downloadVideo);

// GET /api/facebook/download
router.get('/download', fbController.downloadVideo);

module.exports = router; 