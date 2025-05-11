const express = require('express');
const router = express.Router();
const igController = require('../controllers/igController');
const axios = require('axios');

// POST /api/instagram/info
router.post('/info', igController.getVideoInfo);

// POST /api/instagram/download
router.post('/download', igController.downloadVideo);
// GET /api/instagram/download
router.get('/download', igController.downloadVideo);

// Proxy image route
router.get('/proxy-image', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).send('No url provided');
  try {
    const response = await axios.get(url, { responseType: 'stream' });
    res.set('Content-Type', response.headers['content-type']);
    response.data.pipe(res);
  } catch (err) {
    res.status(500).send('Failed to fetch image');
  }
});

module.exports = router; 