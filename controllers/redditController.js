const redditService = require('../services/redditService');

class RedditController {
  async getVideoInfo(req, res) {
    try {
      const { url } = req.body;
      if (!url) {
        return res.status(400).json({ error: 'URL is required' });
      }

      const info = await redditService.getVideoInfo(url);
      res.json(info);
    } catch (error) {
      console.error('Error in getVideoInfo:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async downloadVideo(req, res) {
    try {
      const { url, format } = req.body;
      if (!url || !format) {
        return res.status(400).json({ error: 'URL and format are required' });
      }

      await redditService.downloadVideo(url, format.format_id, res);
    } catch (error) {
      console.error('Error in downloadVideo:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: error.message });
      }
    }
  }
}

module.exports = new RedditController(); 