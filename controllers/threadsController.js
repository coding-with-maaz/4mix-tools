const threadsService = require('../services/threadsService');

exports.getVideoInfo = async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ 
        error: 'URL is required',
        details: 'Please provide a valid Threads video URL'
      });
    }

    console.log('Processing Threads URL:', url);
    console.log('Request body:', req.body);
    
    const info = await threadsService.getVideoInfo(url);
    console.log('Successfully retrieved video info');
    res.json(info);
  } catch (err) {
    console.error('Error in getVideoInfo controller:', err);
    console.error('Error stack:', err.stack);
    
    // Handle specific error cases
    if (err.message.includes('Not a valid Threads video URL')) {
      return res.status(400).json({ 
        error: err.message,
        details: 'Please provide a valid URL from threads.net or threads.com'
      });
    }
    if (err.message.includes('No downloadable formats found')) {
      return res.status(404).json({ 
        error: err.message,
        details: 'The post might be private or not contain any downloadable media'
      });
    }
    if (err.message.includes('yt-dlp command failed')) {
      return res.status(500).json({ 
        error: 'Failed to process Threads video',
        details: 'The video might be private, deleted, or not accessible. Please check the URL and try again.'
      });
    }
    res.status(500).json({ 
      error: 'Failed to process Threads video',
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

exports.downloadVideo = async (req, res) => {
  try {
    const url = req.body.url || req.query.url;
    const format = req.body.format || req.query.format;
    
    console.log('Download request:', { url, format });
    
    if (!url || !format) {
      return res.status(400).json({ 
        error: 'Missing parameters',
        details: 'URL and format are required'
      });
    }
    
    await threadsService.downloadVideo(url, format, res);
  } catch (err) {
    console.error('Error in downloadVideo controller:', err);
    console.error('Error stack:', err.stack);
    
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Download failed',
        details: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
    }
  }
}; 