const mongoose = require('mongoose');

const threadsVideoSchema = new mongoose.Schema({
  url: { type: String, required: true },
  platform: { type: String, default: 'Threads' },
  title: String,
  description: String,
  thumbnail: String,
  uploader: String,
  uploader_url: String,
  webpage_url: String,
  videoFormats: [
    {
      format_id: String,
      resolution: String,
      ext: String,
      filesize: Number,
      filesize_approx: String,
      url: String,
    }
  ],
  audioFormats: [
    {
      format_id: String,
      abr: String,
      ext: String,
      filesize: Number,
      filesize_approx: String,
      url: String,
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ThreadsVideo', threadsVideoSchema); 