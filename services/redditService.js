const { execYtDlp } = require('../utils/execYtDlp');
const { spawn } = require('child_process');
const { formatFileSize, updateDownloadStats, saveVideoInfo } = require('../utils/redditUtils');

exports.getVideoInfo = async (url) => {
  // Validate Reddit URL
  if (!/reddit\.com/.test(url)) {
    throw new Error('Not a valid Reddit URL. Please use a URL from reddit.com');
  }

  try {
    const command = `yt-dlp -j --no-warnings --skip-download "${url}"`;
    console.log('Executing command:', command);
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
        filesize_approx: formatFileSize(f.filesize),
        has_video: f.vcodec !== 'none',
        has_audio: f.acodec !== 'none',
        url: f.url,
      }));

    // Process audio formats
    const audioFormats = (data.formats || [])
      .filter(f => f.vcodec === 'none' && f.acodec !== 'none')
      .map(f => ({
        format_id: f.format_id,
        ext: f.ext,
        filesize: f.filesize,
        filesize_approx: formatFileSize(f.filesize),
        abr: f.abr ? `${Math.round(f.abr)}kbps` : 'Unknown',
        has_video: false,
        has_audio: true,
        url: f.url,
      }));

    const videoInfo = {
      platform: 'Reddit',
      title: data.title || 'Reddit Video',
      description: data.description,
      uploader: data.uploader,
      uploader_url: data.uploader_url,
      thumbnail: data.thumbnail,
      duration: data.duration,
      webpage_url: url,
      videoFormats,
      audioFormats,
    };

    // Save video info to database
    await saveVideoInfo(videoInfo);

    return videoInfo;
  } catch (error) {
    console.error('Error in getVideoInfo:', error);
    throw new Error('Failed to fetch video info: ' + error.message);
  }
};

exports.downloadVideo = async (url, format, res) => {
  if (!/reddit\.com/.test(url)) {
    throw new Error('Not a valid Reddit URL. Please use a URL from reddit.com');
  }

  try {
    console.log('Starting download for URL:', url);
    console.log('Selected format:', format);
    
    const args = [
      url,
      '-f', format,
      '-o', '-',
      '--no-warnings',
      '--no-playlist',
      '--newline',
      '--progress-template', '%(progress._percent_str)s'
    ];
    
    console.log('yt-dlp arguments:', args);
    const ytDlp = spawn('yt-dlp', args);

    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    ytDlp.stdout.pipe(res);

    ytDlp.stderr.on('data', (data) => {
      const output = data.toString();
      console.log('yt-dlp stderr:', output);
      const progressMatch = output.match(/(\d+\.?\d*)%/);
      if (progressMatch) {
        const percent = progressMatch[1];
        process.stdout.write(`\rReddit Download Progress: ${percent}%   `);
      }
    });

    ytDlp.on('close', async (code) => {
      process.stdout.write('\n');
      console.log('yt-dlp process exited with code:', code);
      
      if (code === 0) {
        // Update download stats on successful download
        await updateDownloadStats(url);
      }
      
      if (code !== 0) {
        console.error('yt-dlp process failed with exit code:', code);
        if (!res.headersSent) {
          res.status(500).json({ 
            error: 'Download failed',
            details: `yt-dlp process exited with code ${code}`
          });
        }
      } else {
        console.log('yt-dlp process completed successfully');
        if (!res.headersSent) res.end();
      }
    });

    ytDlp.on('error', (err) => {
      console.error('yt-dlp spawn error:', err);
      if (!res.headersSent) {
        res.status(500).json({ 
          error: 'Download failed',
          details: `yt-dlp error: ${err.message}`
        });
      }
    });
  } catch (error) {
    console.error('Error in downloadVideo:', error);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Download failed',
        details: error.message
      });
    }
  }
}; 