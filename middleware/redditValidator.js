const validateRedditUrl = (req, res, next) => {
  const { url } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  // Basic Reddit URL validation
  const redditUrlPattern = /^https?:\/\/(?:www\.)?reddit\.com\/r\/[\w-]+\/comments\/[\w-]+/;
  
  if (!redditUrlPattern.test(url)) {
    return res.status(400).json({ 
      error: 'Invalid Reddit URL format',
      message: 'Please provide a valid Reddit post URL (e.g., https://www.reddit.com/r/subreddit/comments/postid)'
    });
  }

  next();
};

module.exports = {
  validateRedditUrl
}; 