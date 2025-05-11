const express = require('express');
const router = express.Router();
const pinterestController = require('../controllers/pinterestController');

// POST /api/pinterest/info
router.post('/info', pinterestController.getVideoInfo);

// GET or POST /api/pinterest/download
router.get('/download', pinterestController.downloadVideo);
router.post('/download', pinterestController.downloadVideo);

module.exports = router; 