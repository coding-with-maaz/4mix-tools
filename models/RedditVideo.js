const mongoose = require('mongoose');

const redditVideoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  uploader: String,
  uploader_url: String,
  thumbnail: String,
  duration: Number,
  webpage_url: {
    type: String,
    required: true,
    unique: true
  },
  videoFormats: [{
    format_id: String,
    resolution: String,
    ext: String,
    filesize: Number,
    filesize_approx: String,
    has_video: Boolean,
    has_audio: Boolean,
    url: String
  }],
  audioFormats: [{
    format_id: String,
    ext: String,
    filesize: Number,
    filesize_approx: String,
    abr: String,
    has_video: Boolean,
    has_audio: Boolean,
    url: String
  }],
  downloadCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastDownloaded: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
redditVideoSchema.index({ webpage_url: 1 });
redditVideoSchema.index({ createdAt: -1 });

module.exports = mongoose.model('RedditVideo', redditVideoSchema); 