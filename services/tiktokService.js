const { execYtDlp } = require('../utils/execYtDlp');
const { spawn } = require('child_process');

exports.getVideoInfo = async (url) => {
  // Only allow TikTok URLs
  if (!/tiktok\.com/.test(url)) {
    throw new Error('Not a valid TikTok video URL');
  }
  const command = `yt-dlp -j --no-warnings --skip-download "${url}"`;
  const raw = await execYtDlp(command);
  const data = JSON.parse(raw);

  // Process video formats
  const videoFormats = (data.formats || [])
    .filter(f => f.vcodec !== 'none')
    .map(f => ({
      format_id: f.format_id,
      resolution: f.format_note || (f.height ? `${f.height}p` : 'Unknown'),
      ext: f.ext,
      filesize: f.filesize,
      filesize_approx: f.filesize ? `${Math.round(f.filesize / (1024 * 1024))} MB` : 'Unknown',
      has_video: f.vcodec !== 'none',
      has_audio: f.acodec !== 'none',
      url: f.url,
    }));

  // Process audio formats (rare for TikTok, but included for completeness)
  const audioFormats = (data.formats || [])
    .filter(f => f.vcodec === 'none' && f.acodec !== 'none')
    .map(f => ({
      format_id: f.format_id,
      ext: f.ext,
      filesize: f.filesize,
      filesize_approx: f.filesize ? `${Math.round(f.filesize / (1024 * 1024))} MB` : 'Unknown',
      abr: f.abr ? `${Math.round(f.abr)}kbps` : 'Unknown',
      has_video: false,
      has_audio: true,
      url: f.url,
    }));

  return {
    platform: data.extractor_key, // Should be 'TikTok'
    title: data.title,
    description: data.description,
    thumbnail: data.thumbnail,
    duration: data.duration,
    uploader: data.uploader,
    webpage_url: data.webpage_url,
    videoFormats,
    audioFormats,
  };
};

exports.downloadVideo = async (url, format, res) => {
  if (!/tiktok\.com/.test(url)) {
    throw new Error('Not a valid TikTok video URL');
  }
  const args = [
    url,
    '-f', format,
    '-o', '-',
    '--no-warnings',
    '--no-playlist',
    '--newline',
    '--progress-template', '%(progress._percent_str)s'
  ];
  const ytDlp = spawn('yt-dlp', args);

  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Transfer-Encoding', 'chunked');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  ytDlp.stdout.pipe(res);

  ytDlp.stderr.on('data', (data) => {
    const output = data.toString();
    const progressMatch = output.match(/(\d+\.?\d*)%/);
    if (progressMatch) {
      const percent = progressMatch[1];
      process.stdout.write(`\rTikTok Download Progress: ${percent}%   `);
    }
  });

  ytDlp.on('close', (code) => {
    process.stdout.write('\n');
    if (code !== 0) {
      console.error('yt-dlp process exited with code:', code);
      if (!res.headersSent) res.status(500).end('Download failed');
    } else {
      if (!res.headersSent) res.end();
    }
  });

  ytDlp.on('error', (err) => {
    console.error('yt-dlp error:', err);
    if (!res.headersSent) res.status(500).end('Download failed');
  });
}; 