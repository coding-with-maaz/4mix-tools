const { execYtDlp } = require('../utils/execYtDlp');
const { spawn } = require('child_process');

exports.getVideoInfo = async (url) => {
  // Only allow Facebook URLs
  if (!/facebook\.com|fb\.watch/.test(url)) {
    throw new Error('Not a valid Facebook video URL');
  }
  const command = `yt-dlp -j --no-warnings --skip-download "${url}"`;
  const raw = await execYtDlp(command);
  const data = JSON.parse(raw);

  const videoFormats = (data.formats || [])
    .filter(f => (f.vcodec !== 'none' || f.acodec !== 'none'))
    .map(f => {
      const hasVideo = f.vcodec && f.vcodec !== 'none';
      const hasAudio = f.acodec && f.acodec !== 'none';
      let label = '';
      if (hasVideo && hasAudio) label = 'With Audio';
      else if (hasVideo) label = 'Video Only';
      else if (hasAudio) label = 'Audio Only';
      return {
        format_id: f.format_id,
        resolution: f.format_note || (f.height ? `${f.height}p` : 'Unknown'),
        ext: f.ext,
        filesize: f.filesize,
        filesize_approx: f.filesize ? `${Math.round(f.filesize / (1024 * 1024))} MB` : 'Unknown',
        format_note: f.format_note || '',
        vcodec: f.vcodec,
        acodec: f.acodec,
        has_video: hasVideo,
        has_audio: hasAudio,
        label,
        abr: f.abr,
        tbr: f.tbr,
      };
    });

  const audioFormats = (data.formats || [])
    .filter(f => f.vcodec === 'none' && f.acodec !== 'none')
    .map(f => ({
      format_id: f.format_id,
      abr: f.abr,
      ext: f.ext,
      filesize: f.filesize,
      filesize_approx: f.filesize ? `${Math.round(f.filesize / (1024 * 1024))} MB` : 'Unknown',
      url: f.url,
      acodec: f.acodec,
      label: 'Audio Only',
    }));

  return {
    platform: data.extractor_key, // Should be 'Facebook'
    title: data.title,
    thumbnail: data.thumbnail,
    duration: data.duration,
    uploader: data.uploader,
    webpage_url: data.webpage_url,
    videoFormats,
    audioFormats,
  };
};

exports.downloadVideo = async (url, format, res) => {
  if (!/facebook\.com|fb\.watch/.test(url)) {
    throw new Error('Not a valid Facebook video URL');
  }
  // Use yt-dlp to stream the video
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
      process.stdout.write(`\rFacebook Download Progress: ${percent}%   `);
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