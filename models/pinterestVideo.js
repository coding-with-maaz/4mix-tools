const mongoose = require('mongoose');

const pinterestVideoSchema = new mongoose.Schema({
  url: { type: String, required: true },
  platform: { type: String, default: 'Pinterest' },
  title: String,
  description: String,
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
      filesize_approx: String,
      url: String,
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PinterestVideo', pinterestVideoSchema); 