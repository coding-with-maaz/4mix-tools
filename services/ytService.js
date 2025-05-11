const path = require('path');
const { execYtDlp } = require('../utils/execYtDlp');
const { ensureDownloadsDir, getDownloadPath } = require('../utils/fileUtils');
const fs = require('fs');
const { spawn } = require('child_process');

const validateUrl = (url) => {
    try {
        new URL(url);
        if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
            throw new Error('URL must be from YouTube');
        }
        return true;
    } catch (error) {
        throw new Error('Invalid URL format');
    }
};

exports.getVideoInfo = async (url) => {
    try {
        console.log('Validating URL:', url);
        validateUrl(url);
        
        console.log('Executing yt-dlp command for video info');
        const command = `yt-dlp -j --no-warnings --skip-download --no-playlist "${url}"`;
        console.log('Command:', command);
        
        const raw = await execYtDlp(command);
        
        if (!raw) {
            console.error('No raw data received from yt-dlp');
            throw new Error('No data received from yt-dlp');
        }

        console.log('Parsing yt-dlp output');
        let data;
        try {
            data = JSON.parse(raw);
        } catch (parseError) {
            console.error('Failed to parse yt-dlp output:', parseError);
            console.error('Raw output:', raw);
            throw new Error('Failed to parse video information');
        }

        if (!data || !data.formats) {
            console.error('Invalid video data structure:', data);
            throw new Error('Invalid video data received');
        }

        console.log('Processing video formats');
        // First, get all formats with both video and audio
        const formatsWithAudio = data.formats
            .filter(f => f.vcodec !== 'none' && f.acodec !== 'none')
            .map(f => {
                // Calculate filesize if not provided
                let filesize = f.filesize;
                if (!filesize && f.tbr) {
                    const duration = data.duration || 0;
                    filesize = Math.round((f.tbr * 1000 * duration) / 8);
                }

                return {
                    format_id: f.format_id,
                    resolution: f.format_note || `${f.height}p`,
                    ext: f.ext,
                    filesize: filesize,
                    fps: f.fps,
                    vcodec: f.vcodec,
                    acodec: f.acodec,
                    url: f.url,
                    quality: f.quality || 'unknown',
                    height: f.height,
                    width: f.width,
                    format_note: f.format_note,
                    tbr: f.tbr,
                    vbr: f.vbr,
                    abr: f.abr,
                    format: f.format,
                    filesize_approx: filesize ? Math.round(filesize / (1024 * 1024)) + ' MB' : 'Unknown',
                    has_audio: true,
                    has_video: true
                };
            })
            .sort((a, b) => {
                // Sort by resolution (height) first
                const heightDiff = (b.height || 0) - (a.height || 0);
                if (heightDiff !== 0) return heightDiff;
                
                // Then by format (prefer mp4)
                if (a.ext === 'mp4' && b.ext !== 'mp4') return -1;
                if (b.ext === 'mp4' && a.ext !== 'mp4') return 1;
                
                // Then by filesize (larger is better)
                return (b.filesize || 0) - (a.filesize || 0);
            });

        // Then get formats without audio
        const formatsWithoutAudio = data.formats
            .filter(f => f.vcodec !== 'none' && f.acodec === 'none')
            .map(f => {
                let filesize = f.filesize;
                if (!filesize && f.tbr) {
                    const duration = data.duration || 0;
                    filesize = Math.round((f.tbr * 1000 * duration) / 8);
                }

                return {
                    format_id: f.format_id,
                    resolution: f.format_note || `${f.height}p`,
                    ext: f.ext,
                    filesize: filesize,
                    fps: f.fps,
                    vcodec: f.vcodec,
                    acodec: f.acodec,
                    url: f.url,
                    quality: f.quality || 'unknown',
                    height: f.height,
                    width: f.width,
                    format_note: f.format_note,
                    tbr: f.tbr,
                    vbr: f.vbr,
                    abr: f.abr,
                    format: f.format,
                    filesize_approx: filesize ? Math.round(filesize / (1024 * 1024)) + ' MB' : 'Unknown',
                    has_audio: false,
                    has_video: true
                };
            })
            .sort((a, b) => (b.height || 0) - (a.height || 0));

        // Combine formats, putting formats with audio first
        const videoFormats = [...formatsWithAudio, ...formatsWithoutAudio];
        console.log(`Found ${formatsWithAudio.length} formats with audio and ${formatsWithoutAudio.length} formats without audio`);

        const audioFormats = data.formats
            .filter(f => f.vcodec === 'none' && f.acodec !== 'none')
            .map(f => {
                let filesize = f.filesize;
                if (!filesize && f.tbr) {
                    const duration = data.duration || 0;
                    filesize = Math.round((f.tbr * 1000 * duration) / 8);
                }

                return {
                    format_id: f.format_id,
                    abr: f.abr,
                    ext: f.ext,
                    filesize: filesize,
                    acodec: f.acodec,
                    url: f.url,
                    format_note: f.format_note,
                    filesize_approx: filesize ? Math.round(filesize / (1024 * 1024)) + ' MB' : 'Unknown',
                    format: f.format
                };
            })
            .sort((a, b) => (b.abr || 0) - (a.abr || 0));

        console.log(`Found ${audioFormats.length} audio formats`);

        const subtitles = data.subtitles || {};
        const autoCaptions = data.automatic_captions || {};

        console.log('Successfully processed video information');
        return {
            title: data.title,
            thumbnail: data.thumbnail,
            duration: data.duration,
            uploader: data.uploader,
            webpage_url: data.webpage_url,
            description: data.description,
            upload_date: data.upload_date,
            view_count: data.view_count,
            like_count: data.like_count,
            videoFormats,
            audioFormats,
            subtitles,
            autoCaptions,
        };
    } catch (error) {
        console.error('Error in getVideoInfo:', error);
        console.error('Error stack:', error.stack);
        throw new Error(error.message || 'Failed to fetch video information');
    }
};

exports.downloadVideo = async (url, format, res) => {
    try {
        console.log('Validating URL for download:', url);
        if (!url) {
            throw new Error('URL is required');
        }

        // Ensure downloads directory exists
        const downloadsDir = path.join(process.cwd(), 'downloads');
        if (!fs.existsSync(downloadsDir)) {
            fs.mkdirSync(downloadsDir, { recursive: true });
        }
        console.log('Downloads directory:', downloadsDir);

        // Set up yt-dlp command
        const args = [
            url,
            '-f', format,
            '-o', '-',  // Output to stdout
            '--no-playlist',
            '--no-warnings',
            '--no-progress',
            '--newline',
            '--progress-template', '%(progress._percent_str)s'
        ];

        // Create yt-dlp process
        const ytDlp = spawn('yt-dlp', args);

        // Set response headers for streaming
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Transfer-Encoding', 'chunked');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Handle yt-dlp output
        ytDlp.stdout.on('data', (data) => {
            // Write data directly to response
            res.write(data);
        });

        // Handle progress updates from stderr
        ytDlp.stderr.on('data', (data) => {
            const output = data.toString();
            console.log('yt-dlp stderr:', output);

            // Try to parse progress percentage
            const progressMatch = output.match(/(\d+\.?\d*)%/);
            if (progressMatch) {
                const percentage = parseFloat(progressMatch[1]);
                // Send progress through custom header
                res.setHeader('X-Download-Progress', JSON.stringify({ percentage }));
            }
        });

        // Handle process completion
        ytDlp.on('close', (code) => {
            if (code === 0) {
                console.log('Download completed successfully');
                res.end();
            } else {
                console.error('yt-dlp process exited with code:', code);
                res.status(500).end('Download failed');
            }
        });

        // Handle errors
        ytDlp.on('error', (error) => {
            console.error('yt-dlp error:', error);
            res.status(500).end('Download failed');
        });

    } catch (error) {
        console.error('Download error:', error);
        throw error;
    }
};

exports.downloadSubtitles = async (url, lang = 'en', autoGenerated = false) => {
    try {
        console.log('Validating URL for subtitle download:', url);
        validateUrl(url);
        
        console.log('Ensuring downloads directory exists');
        const downloadsDir = ensureDownloadsDir();
        console.log('Downloads directory:', downloadsDir);
        
        // Use a sanitized filename format
        const outputPath = path.join(downloadsDir, '%(title)s.%(ext)s');
        const autoSubFlag = autoGenerated ? '--write-auto-sub' : '--write-sub';
        const command = `yt-dlp --skip-download ${autoSubFlag} --sub-lang ${lang} --convert-subs srt -o "${outputPath}" "${url}"`;
        console.log('Subtitle download command:', command);
        
        console.log('Starting subtitle download...');
        await execYtDlp(command);
        
        // Get the actual filename from the downloads directory
        console.log('Checking for downloaded subtitle file...');
        const files = fs.readdirSync(downloadsDir);
        console.log('Files in downloads directory:', files);
        
        const downloadedFile = files.find(f => f.endsWith('.srt'));
        if (!downloadedFile) {
            console.error('Downloaded subtitle file not found in directory');
            throw new Error('Downloaded subtitle file not found');
        }
        
        console.log('Subtitle download completed successfully');
        return path.join(downloadsDir, downloadedFile);
    } catch (error) {
        console.error('Error in downloadSubtitles:', error);
        console.error('Error stack:', error.stack);
        throw new Error(error.message || 'Failed to download subtitles');
    }
};

exports.getAvailableSubtitles = async (url) => {
    try {
        console.log('Validating URL for subtitle list:', url);
        validateUrl(url);
        
        const command = `yt-dlp --list-subs --write-auto-sub "${url}"`;
        console.log('Subtitle list command:', command);
        
        console.log('Fetching available subtitles...');
        const output = await execYtDlp(command);
        console.log('Successfully fetched subtitle list');
        
        return output;
    } catch (error) {
        console.error('Error in getAvailableSubtitles:', error);
        console.error('Error stack:', error.stack);
        throw new Error(error.message || 'Failed to fetch available subtitles');
    }
}; 