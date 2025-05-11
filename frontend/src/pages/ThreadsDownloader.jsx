import { useState } from 'react';
import ModernCard from '../components/ModernCard';
import StyledTextField from '../components/StyledTextField';
import { Button, Typography, Grid, MenuItem, Select, FormControl, InputLabel, Box, CircularProgress, Tabs, LinearProgress } from '@mui/material';
import { getThreadsVideoInfo } from '../services/threadsApi';
import ForumIcon from '@mui/icons-material/Forum';
import { Tab } from '@mui/material';

const ThreadsDownloader = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [videoInfo, setVideoInfo] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState('');
  const [selectedAudioFormat, setSelectedAudioFormat] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

  // Helper to filter formats
  const videoFormats = videoInfo?.videoFormats || [];
  const audioFormats = videoInfo?.audioFormats || [];

  const handleFetchInfo = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setVideoInfo(null);
    setSelectedFormat('');
    setSelectedAudioFormat('');
    try {
      const info = await getThreadsVideoInfo(url);
      setVideoInfo(info);
      // Set initial format selection
      if (info.videoFormats?.length > 0) {
        setSelectedFormat(info.videoFormats[0].format_id);
      }
      if (info.audioFormats?.length > 0) {
        setSelectedAudioFormat(info.audioFormats[0].format_id);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch video info');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (type) => {
    if (!videoInfo) return;
    try {
      setIsDownloading(true);
      setDownloadProgress(0);
      setError(null);
      const formatId = type === 'video' ? selectedFormat : selectedAudioFormat;
      if (!formatId) {
        setError('Please select a format first');
        return;
      }
      // Find the selected format object to get filesize
      let formatObj = type === 'video'
        ? videoFormats.find(f => f.format_id === formatId)
        : audioFormats.find(f => f.format_id === formatId);
      const totalSize = formatObj && formatObj.filesize && formatObj.filesize !== 'Unknown' ? formatObj.filesize : null;
      const response = await fetch(
        `http://localhost:5001/api/threads/download?url=${encodeURIComponent(url)}&format=${encodeURIComponent(formatId)}`
      );
      if (!response.ok) throw new Error('Download failed');
      const reader = response.body.getReader();
      let receivedLength = 0;
      const chunks = [];
      while(true) {
        const {done, value} = await reader.read();
        if (done) break;
        chunks.push(value);
        receivedLength += value.length;
        // Update progress using actual filesize if available
        let progress = 0;
        if (totalSize) {
          progress = (receivedLength / totalSize) * 100;
        } else {
          // fallback: try Content-Length header if available
          const contentLength = +response.headers.get('Content-Length');
          if (contentLength) {
            progress = (receivedLength / contentLength) * 100;
          } else {
            progress = 0;
          }
        }
        setDownloadProgress(Math.min(100, Math.round(progress)));
      }
      const blob = new Blob(chunks);
      const filename = `${videoInfo.title || 'threads-video'}.${type === 'video' ? 'mp4' : 'mp3'}`;
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to download ' + type);
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  return (
    <Box sx={{ maxWidth: 700, mx: 'auto', py: 6 }}>
      <ModernCard light sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <ForumIcon sx={{ color: '#8a3ab9', fontSize: 36 }} />
          <Typography variant="h4" fontWeight={700}>
            Threads Video Downloader
          </Typography>
        </Box>
        <form onSubmit={handleFetchInfo}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={9}>
              <StyledTextField
                label="Threads Video URL"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://www.threads.net/@username/post/123456789"
                required
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Button
                fullWidth
                type="submit"
                variant="contained"
                disabled={loading}
                sx={{ height: 56, fontWeight: 700 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Get Video Info'}
              </Button>
            </Grid>
          </Grid>
        </form>
        {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
      </ModernCard>

      {videoInfo && (
        <ModernCard sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
            {/* User profile image and username */}
            {(videoInfo.profileImage || videoInfo.uploader || videoInfo.uploader_url) && (
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                {videoInfo.profileImage && (
                  <img
                    src={videoInfo.profileImage}
                    alt="Profile"
                    style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', marginRight: 16, border: '2px solid #eee' }}
                    onError={e => { e.target.onerror = null; e.target.src = '/no-profile.png'; }}
                  />
                )}
                <Box>
                  <Typography variant="subtitle1" fontWeight={700}>
                    {videoInfo.uploader || 'Unknown User'}
                  </Typography>
                  {videoInfo.uploader_url && (
                    <Typography variant="body2" color="text.secondary">
                      {videoInfo.uploader_url}
                    </Typography>
                  )}
                </Box>
              </Box>
            )}
            <ForumIcon sx={{ color: '#8a3ab9', fontSize: 64, mb: 2 }} />
            <Typography variant="h5" fontWeight={700} gutterBottom>
              {videoInfo.title}
            </Typography>
            {videoInfo.description && (
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {videoInfo.description}
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {videoInfo.webpage_url && (
                <>
                  <span style={{ color: '#009688', fontWeight: 500, fontSize: 14 }}>
                    Platform: {videoInfo.webpage_url.includes('threads.com') ? 'threads.com' : 'threads.net'}
                  </span>
                </>
              )}
            </Typography>
          </Box>

          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{ mb: 2 }}
          >
            <Tab label="Video" />
            <Tab label="Audio" />
          </Tabs>

          {activeTab === 0 && (
            <>
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Select Video Format</InputLabel>
                <Select
                  value={selectedFormat}
                  onChange={e => setSelectedFormat(e.target.value)}
                  label="Select Video Format"
                >
                  {videoFormats.length > 0 ? (
                    videoFormats.map(format => (
                      <MenuItem key={format.format_id} value={format.format_id}>
                        {format.format_id === 'scraped'
                          ? 'Download Video [HD]'
                          : `${format.resolution && format.resolution !== 'Unknown' ? format.resolution : '—'} • ${format.ext ? format.ext.toUpperCase() : 'N/A'}${format.filesize_approx && format.filesize_approx !== 'Unknown' ? ` • ${format.filesize_approx}` : ''}`
                        }
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled value="">
                      No video formats available
                    </MenuItem>
                  )}
                </Select>
              </FormControl>
              {isDownloading && (
                <Box sx={{ width: '100%', mt: 2 }}>
                  {downloadProgress > 0 ? (
                    <>
                      <LinearProgress variant="determinate" value={downloadProgress} />
                      <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                        Downloading: {downloadProgress}%
                      </Typography>
                    </>
                  ) : (
                    <>
                      <LinearProgress />
                      <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                        Downloading...
                      </Typography>
                    </>
                  )}
                </Box>
              )}
              <Button
                fullWidth
                variant="contained"
                sx={{ mt: 3, fontWeight: 700, height: 56 }}
                onClick={() => handleDownload('video')}
                disabled={!selectedFormat || isDownloading}
              >
                {isDownloading ? 'Downloading...' : 'Download Video'}
              </Button>
            </>
          )}

          {activeTab === 1 && (
            <>
              <FormControl fullWidth sx={{ mt: 2 }}>
                <InputLabel>Select Audio Format</InputLabel>
                <Select
                  value={selectedAudioFormat}
                  onChange={e => setSelectedAudioFormat(e.target.value)}
                  label="Select Audio Format"
                >
                  {audioFormats.length > 0 ? (
                    audioFormats.map(format => (
                      <MenuItem key={format.format_id} value={format.format_id}>
                        {format.ext ? format.ext.toUpperCase() : 'N/A'}
                        {format.filesize_approx && format.filesize_approx !== 'Unknown' ? ` • ${format.filesize_approx}` : ''}
                        {format.abr ? ` • ${format.abr}kbps` : ''}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled value="">
                      No audio formats available
                    </MenuItem>
                  )}
                </Select>
              </FormControl>
              {isDownloading && (
                <Box sx={{ width: '100%', mt: 2 }}>
                  {downloadProgress > 0 ? (
                    <>
                      <LinearProgress variant="determinate" value={downloadProgress} />
                      <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                        Downloading: {downloadProgress}%
                      </Typography>
                    </>
                  ) : (
                    <>
                      <LinearProgress />
                      <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                        Downloading...
                      </Typography>
                    </>
                  )}
                </Box>
              )}
              <Button
                fullWidth
                variant="contained"
                sx={{ mt: 3, fontWeight: 700, height: 56 }}
                onClick={() => handleDownload('audio')}
                disabled={!selectedAudioFormat || isDownloading}
              >
                {isDownloading ? 'Downloading...' : 'Download Audio'}
              </Button>
            </>
          )}
        </ModernCard>
      )}

      {/* Instructions & FAQ Section */}
      <ModernCard sx={{ mb: 4 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Instructions
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Paste a thread/post URL above to load its videos and show download options here.
          </Typography>
        </Box>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Frequently Asked Questions - FAQ
          </Typography>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ color: 'primary.main' }} gutterBottom>
              What does this page do?
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              This tool allows you to download any video, image/photo, or GIF from Threads directly to your device with just a single click. Threads Downloader is a free Threads video downloader with ultra fast download speed. It works with any video from the all new social media app by Instagram known as Threads. All videos are downloaded as an MP4 in HD, ensuring high quality playback.
            </Typography>
          </Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ color: 'primary.main' }} gutterBottom>
              How do I use this tool?
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              To use this tool, simply enter the link/URL of the Thread you wish to download into the input field and click the "Load Videos" button. Then, select whichever quality you want and click the "download" button. The video will then be downloaded to your device in MP4 format. This is essentially a Threads to MP4 tool, since it allows you to convert any thread to MP4. This tool is an all-in-one Threads video saver.
            </Typography>
          </Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ color: 'primary.main' }} gutterBottom>
              How long does it take to download a video?
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              The download speed will depend on your internet connection and the size of the video. However, our optimal and efficient Threads video downloader should keep the download process relatively quick.
            </Typography>
          </Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ color: 'primary.main' }} gutterBottom>
              Can I download a Threads GIF with this tool?
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Yes! Threads Downloader is compatible with GIFs! This means you can download any GIF from Threads. Simply enter your post link then click on the "Load Videos" button. After that, select the quality you wish to down the GIF in and click "Download." Always remember, you can save any photo, video or GIF as an MP4/JPEG using this tool.
            </Typography>
          </Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ color: 'primary.main' }} gutterBottom>
              How to download videos from Threads on iOS or Android?
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Threads Downloader allows you to download videos on almost any device or platform. This means you can download any video from Threads on iPhone, iPad, Android, iOS, Windows, Mac, or even Linux using ThreadsDownloader.com. If you have the Threads iOS app, or even the Android app, just copy and paste any post link into this tool to download videos or images!
            </Typography>
          </Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ color: 'primary.main' }} gutterBottom>
              Is it safe to download videos from Threads?
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Yes, if you use ThreadsDownloader.com to download your videos or GIFs, we guarantee all the files are safe and secure. Threads Downloader prioritizes user privacy and does not store any personal information. Furthermore, all download links are directly from Threads.
            </Typography>
          </Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ color: 'primary.main' }} gutterBottom>
              Can I download videos from private accounts?
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Threads does not allow downloading videos from private accounts. This is to respect the privacy of users who have chosen to keep their profiles on Threads and content private. However, you can still use Threads Downloader to download videos from public accounts.
            </Typography>
          </Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ color: 'primary.main' }} gutterBottom>
              Is it legal to download videos from Threads?
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Downloading videos from Threads for personal use is generally considered legal. But it is important to respect all copyrighted videos and not distribute, reproduce, or monetize the downloaded content without permission from the owner. Always give proper credit to the original creator if you share or use the content in any way.
            </Typography>
          </Box>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} sx={{ color: 'primary.main' }} gutterBottom>
              How to download high quality Threads videos?
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Threads Downloader allows you to download high-resolution videos up to the original quality posted on the Threads app. When you enter the post link and click "Load Videos," you will be presented with different quality options to choose from. Select the highest quality available to download the video in the best possible resolution.
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={600} sx={{ color: 'primary.main' }} gutterBottom>
              How to download videos from Threads?
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Here's how to save videos from Threads:
            </Typography>
            <Box component="ol" sx={{ pl: 3, mt: 1, mb: 2 }}>
              <Typography component="li" variant="body2" color="text.secondary">
                Copy the link of the thread with the video you want to save.
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary">
                Navigate to the Threads video downloader: ThreadsDownloader.com
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary">
                Paste the post link in the "Thread Link" field.
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary">
                Tap "Load Videos"
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary">
                Pick the quality you want and tap the "Download" button.
              </Typography>
              <Typography component="li" variant="body2" color="text.secondary">
                If you are on iOS, a share menu should pop up, click "Save Video" to save it to your camera roll. On Android, it will save to your device files automatically.
              </Typography>
            </Box>
          </Box>
        </Box>
      </ModernCard>
    </Box>
  );
};

export default ThreadsDownloader; 