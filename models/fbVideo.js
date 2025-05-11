const mongoose = require('mongoose');

const fbVideoSchema = new mongoose.Schema({
  url: { type: String, required: true },
  platform: { type: String, default: 'Facebook' },
  title: String,
  thumbnail: String,
  duration: Number,
  uploader: String,
  webpage_url: String,
  videoFormats: [
    {
      format_id: String,
      resolution: String,
      ext: String,
      filesize: Number,
      url: String,
    }
  ],
  audioFormats: [
    {
      format_id: String,
      abr: Number,
      ext: String,
      filesize: Number,
      url: String,
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('FbVideo', fbVideoSchema); 