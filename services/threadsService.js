const { execYtDlp } = require('../utils/execYtDlp');
const { spawn } = require('child_process');
const axios = require('axios');
const cheerio = require('cheerio');
const puppeteer = require('puppeteer');

const convertToInstagramUrl = (threadsUrl) => {
  // Extract the post ID from the Threads URL
  const postIdMatch = threadsUrl.match(/\/post\/([^\/\?]+)/);
  if (!postIdMatch) {
    throw new Error('Invalid Threads URL format');
  }
  const postId = postIdMatch[1];
  
  // Extract the username from the Threads URL
  const usernameMatch = threadsUrl.match(/@([^\/]+)/);
  if (!usernameMatch) {
    throw new Error('Invalid Threads URL format');
  }
  const username = usernameMatch[1];
  
  // Construct Instagram URL
  return `https://www.instagram.com/p/${postId}/`;
};

async function scrapeThreadsPost(url) {
  // Try static HTML first
  try {
    const { data: html } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const $ = cheerio.load(html);
    let videoUrl = $('video').attr('src') || null;
    let coverUrl = $('meta[property="og:image"]').attr('content') || null;
    let username = $('meta[property="og:title"]').attr('content') || null;
    let displayName = null;
    let profileImage = null;
    // Try to find profile image (common alt text or meta)
    profileImage = $('img[alt*="profile" i], img[alt*="Profile" i]').first().attr('src') || null;
    if (!profileImage) {
      profileImage = $('meta[property="og:image"]').attr('content') || null;
    }
    if (username && username.includes('(@')) {
      const match = username.match(/(.+)\s\(@(.+)\)/);
      if (match) {
        displayName = match[1].trim();
        username = '@' + match[2].trim();
      }
    }
    if (!username) {
      username = $('[href^="/@"]').first().text().trim();
    }
    if (!displayName) {
      displayName = $('[data-testid="user-name"]').first().text().trim();
    }
    if (videoUrl) {
      return { videoUrl, coverUrl, username, displayName, profileImage };
    }
  } catch (err) {
    // Ignore and try puppeteer
  }
  // Fallback to Puppeteer for dynamic content
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle2' });
  try {
    await page.waitForSelector('video', { timeout: 5000 });
  } catch (e) {
    // If video doesn't appear, continue anyway (may be image or other content)
  }
  const info = await page.evaluate(() => {
    const video = document.querySelector('video');
    const videoUrl = video ? video.src : null;
    const coverUrl = document.querySelector('meta[property="og:image"]')?.content || null;
    let username = document.querySelector('meta[property="og:title"]')?.content || null;
    let displayName = null;
    let profileImage = document.querySelector('img[alt*="profile" i], img[alt*="Profile" i]')?.src
      || document.querySelector('meta[property="og:image"]')?.content
      || null;
    if (username && username.includes('(@')) {
      const match = username.match(/(.+)\s\(@(.+)\)/);
      if (match) {
        displayName = match[1].trim();
        username = '@' + match[2].trim();
      }
    }
    return { videoUrl, coverUrl, username, displayName, profileImage };
  });
  await browser.close();
  return info;
}

exports.getVideoInfo = async (url) => {
  // Allow both threads.net and threads.com URLs
  if (!/threads\.(net|com)/.test(url)) {
    throw new Error('Not a valid Threads video URL. Please use a URL from threads.net or threads.com');
  }

  // Use yt-dlp for threads.net, scraping for threads.com or fallback
  if (/threads\.net/.test(url)) {
    try {
      // Convert Threads URL to Instagram URL format
      const instagramUrl = convertToInstagramUrl(url);
      console.log('Converted to Instagram URL:', instagramUrl);

      const command = `yt-dlp -j --no-warnings --skip-download --cookies instagram_cookies.txt "${instagramUrl}"`;
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
          filesize_approx: f.filesize ? `${Math.round(f.filesize / (1024 * 1024))} MB` : 'Unknown',
          has_video: f.vcodec !== 'none',
          has_audio: f.acodec !== 'none',
          url: f.url,
        }));

      // Process audio formats (rare for Threads, but included for completeness)
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

      if (videoFormats.length === 0 && audioFormats.length === 0) {
        // Fallback to scraping
        const scraped = await scrapeThreadsPost(url);
        if (!scraped.videoUrl) throw new Error('No downloadable formats found for this Threads post');
        return {
          platform: 'Threads',
          title: scraped.displayName || 'Threads Video',
          uploader: scraped.displayName,
          uploader_url: scraped.username,
          thumbnail: scraped.coverUrl,
          profileImage: scraped.profileImage,
          webpage_url: url,
          videoFormats: [{
            format_id: 'scraped',
            resolution: 'HD',
            ext: 'mp4',
            filesize: null,
            filesize_approx: 'Unknown',
            has_video: true,
            has_audio: true,
            url: scraped.videoUrl,
          }],
          audioFormats: [],
        };
      }
      return {
        platform: 'Threads',
        title: data.title || data.description || 'Threads Video',
        description: data.description,
        uploader: data.uploader,
        uploader_url: data.uploader_url,
        thumbnail: data.thumbnail,
        profileImage: data.profileImage,
        webpage_url: url, // Keep original Threads URL
        videoFormats,
        audioFormats,
      };
    } catch (error) {
      // Fallback to scraping
      const scraped = await scrapeThreadsPost(url);
      if (!scraped.videoUrl) throw new Error('No downloadable formats found for this Threads post');
      return {
        platform: 'Threads',
        title: scraped.displayName || 'Threads Video',
        uploader: scraped.displayName,
        uploader_url: scraped.username,
        thumbnail: scraped.coverUrl,
        profileImage: scraped.profileImage,
        webpage_url: url,
        videoFormats: [{
          format_id: 'scraped',
          resolution: 'HD',
          ext: 'mp4',
          filesize: null,
          filesize_approx: 'Unknown',
          has_video: true,
          has_audio: true,
          url: scraped.videoUrl,
        }],
        audioFormats: [],
      };
    }
  } else {
    // threads.com: always use scraping
    const scraped = await scrapeThreadsPost(url);
    if (!scraped.videoUrl) throw new Error('No downloadable formats found for this Threads post');
    return {
      platform: 'Threads',
      title: scraped.displayName || 'Threads Video',
      uploader: scraped.displayName,
      uploader_url: scraped.username,
      thumbnail: scraped.coverUrl,
      profileImage: scraped.profileImage,
      webpage_url: url,
      videoFormats: [{
        format_id: 'scraped',
        resolution: 'HD',
        ext: 'mp4',
        filesize: null,
        filesize_approx: 'Unknown',
        has_video: true,
        has_audio: true,
        url: scraped.videoUrl,
      }],
      audioFormats: [],
    };
  }
};

exports.downloadVideo = async (url, format, res) => {
  // Allow both threads.net and threads.com URLs
  if (!/threads\.(net|com)/.test(url)) {
    throw new Error('Not a valid Threads video URL. Please use a URL from threads.net or threads.com');
  }

  // If format is 'scraped', stream the video directly
  if (format === 'scraped') {
    try {
      // Use scraping to get the video URL
      const scraped = await scrapeThreadsPost(url);
      if (!scraped.videoUrl) throw new Error('No downloadable video found for this Threads post');
      const axios = require('axios');
      const videoResponse = await axios.get(scraped.videoUrl, { responseType: 'stream' });
      res.setHeader('Content-Type', 'video/mp4');
      res.setHeader('Content-Disposition', 'attachment; filename="threads-video.mp4"');
      videoResponse.data.pipe(res);
      videoResponse.data.on('end', () => res.end());
      videoResponse.data.on('error', (err) => {
        console.error('Error streaming scraped video:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to stream video', details: err.message });
        }
      });
      return;
    } catch (error) {
      console.error('Error in downloadVideo (scraped):', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Download failed', details: error.message });
      }
      return;
    }
  }

  try {
    console.log('Starting download for URL:', url);
    console.log('Selected format:', format);
    
    // Convert Threads URL to Instagram URL format
    const instagramUrl = convertToInstagramUrl(url);
    console.log('Converted to Instagram URL:', instagramUrl);
    
    const args = [
      instagramUrl,
      '-f', format,
      '-o', '-',
      '--no-warnings',
      '--no-playlist',
      '--newline',
      '--cookies', 'instagram_cookies.txt',
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
      console.log('yt-dlp stderr:', output); // Log all stderr output for debugging
      const progressMatch = output.match(/(\d+\.?\d*)%/);
      if (progressMatch) {
        const percent = progressMatch[1];
        process.stdout.write(`\rThreads Download Progress: ${percent}%   `);
      }
    });

    ytDlp.on('close', (code) => {
      process.stdout.write('\n');
      console.log('yt-dlp process exited with code:', code);
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