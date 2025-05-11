const mongoose = require('mongoose');

const igVideoSchema = new mongoose.Schema({
  url: { type: String, required: true },
  platform: { type: String, default: 'Instagram' },
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
      filesize_approx: String,
      url: String,
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('IgVideo', igVideoSchema); 