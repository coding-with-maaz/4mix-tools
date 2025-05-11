const express = require('express');
const router = express.Router();
const threadsController = require('../controllers/threadsController');

// POST /api/threads/info
router.post('/info', threadsController.getVideoInfo);

// GET or POST /api/threads/download
router.get('/download', threadsController.downloadVideo);
router.post('/download', threadsController.downloadVideo);

module.exports = router; 