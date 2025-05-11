const express = require('express');
const router = express.Router();
const tiktokController = require('../controllers/tiktokController');

// POST /api/tiktok/info
router.post('/info', tiktokController.getVideoInfo);

// GET or POST /api/tiktok/download
router.get('/download', tiktokController.downloadVideo);
router.post('/download', tiktokController.downloadVideo);

module.exports = router; 