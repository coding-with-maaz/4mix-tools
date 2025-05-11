const { execYtDlp } = require('./execYtDlp');
const RedditVideo = require('../models/RedditVideo');

const formatFileSize = (bytes) => {
  if (!bytes) return 'Unknown';
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${Math.round(bytes / Math.pow(1024, i))} ${sizes[i]}`;
};

const updateDownloadStats = async (webpage_url) => {
  try {
    await RedditVideo.findOneAndUpdate(
      { webpage_url },
      { 
        $inc: { downloadCount: 1 },
        lastDownloaded: new Date()
      },
      { new: true }
    );
  } catch (error) {
    console.error('Error updating download stats:', error);
  }
};

const saveVideoInfo = async (videoInfo) => {
  try {
    const existingVideo = await RedditVideo.findOne({ webpage_url: videoInfo.webpage_url });
    
    if (existingVideo) {
      return existingVideo;
    }

    const newVideo = new RedditVideo(videoInfo);
    await newVideo.save();
    return newVideo;
  } catch (error) {
    console.error('Error saving video info:', error);
    throw error;
  }
};

module.exports = {
  formatFileSize,
  updateDownloadStats,
  saveVideoInfo
}; 