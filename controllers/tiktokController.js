const tiktokService = require('../services/tiktokService');

exports.getVideoInfo = async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL is required' });
    const info = await tiktokService.getVideoInfo(url);
    res.json(info);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.downloadVideo = async (req, res) => {
  // Support both POST (body) and GET (query) for download
  try {
    const url = req.body.url || req.query.url;
    const format = req.body.format || req.query.format;
    if (!url || !format) return res.status(400).json({ error: 'URL and format are required' });
    await tiktokService.downloadVideo(url, format, res);
  } catch (err) {
    if (!res.headersSent) res.status(500).json({ error: err.message });
  }
}; 