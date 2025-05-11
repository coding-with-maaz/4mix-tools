import { useState } from 'react';
import ModernCard from '../components/ModernCard';
import StyledTextField from '../components/StyledTextField';
import { Button, Typography, Grid, MenuItem, Select, FormControl, InputLabel, Box, CircularProgress, Tabs, LinearProgress } from '@mui/material';
import { getTiktokVideoInfo } from '../services/tiktokApi';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import { Tab } from '@mui/material';
import PlayCircleFilledWhiteIcon from '@mui/icons-material/PlayCircleFilledWhite';

const TiktokDownloader = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [videoInfo, setVideoInfo] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

  // Helper to filter formats
  const videoWithAudioFormats = videoInfo?.videoFormats?.filter(f => f.has_video && f.has_audio) || [];
  const videoOnlyFormats = videoInfo?.videoFormats?.filter(f => f.has_video && !f.has_audio) || [];

  const handleFetchInfo = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setVideoInfo(null);
    setSelectedFormat('');
    try {
      const info = await getTiktokVideoInfo(url);
      setVideoInfo(info);
      // Set initial format selection
      if (info.videoFormats?.length > 0) {
        const bestVideo = info.videoFormats.find(f => f.has_video && f.has_audio) || info.videoFormats[0];
        setSelectedFormat(bestVideo.format_id);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch video info');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!videoInfo) return;
    try {
      setIsDownloading(true);
      setDownloadProgress(0);
      setError(null);
      const formatId = selectedFormat;
      if (!formatId) {
        setError('Please select a format first');
        return;
      }
      // Find the selected format object to get filesize
      let formatObj = [...videoWithAudioFormats, ...videoOnlyFormats].find(f => f.format_id === formatId);
      const totalSize = formatObj && formatObj.filesize && formatObj.filesize !== 'Unknown' ? formatObj.filesize : null;
      const response = await fetch(
        `http://localhost:5000/api/tiktok/download?url=${encodeURIComponent(url)}&format=${encodeURIComponent(formatId)}`
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
      const filename = `${videoInfo.title}.mp4`;
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    } catch (err) {
      setError('Failed to download video');
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  return (
    <Box sx={{ maxWidth: 700, mx: 'auto', py: 6 }}>
      <ModernCard light sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <PlayCircleFilledWhiteIcon sx={{ color: '#010101', fontSize: 36 }} />
          <Typography variant="h4" fontWeight={700}>
            TikTok Video Downloader
          </Typography>
        </Box>
        <form onSubmit={handleFetchInfo}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={9}>
              <StyledTextField
                label="TikTok Video URL"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://www.tiktok.com/@user/video/1234567890"
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
            {videoInfo.thumbnail && (
              <img
                src={videoInfo.thumbnail}
                alt="TikTok thumbnail"
                style={{ width: 220, maxWidth: '100%', borderRadius: 12, marginBottom: 16, objectFit: 'cover', boxShadow: '0 2px 12px rgba(0,0,0,0.10)' }}
                onError={e => { e.target.onerror = null; e.target.src = '/no-thumbnail.png'; }}
              />
            )}
            <PlayCircleFilledWhiteIcon sx={{ color: '#010101', fontSize: 64, mb: 2 }} />
            <Typography variant="h5" fontWeight={700} gutterBottom>
              {videoInfo.title}
            </Typography>
            {videoInfo.description && (
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {videoInfo.description}
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Duration: {videoInfo.duration ? `${Math.floor(videoInfo.duration/60)}:${(videoInfo.duration%60).toString().padStart(2,'0')}` : 'N/A'}
            </Typography>
          </Box>

          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Select Video Format</InputLabel>
            <Select
              value={selectedFormat}
              onChange={e => setSelectedFormat(e.target.value)}
              label="Select Video Format"
            >
              {videoWithAudioFormats.length > 0 ? (
                videoWithAudioFormats.map(format => (
                  <MenuItem key={format.format_id} value={format.format_id}>
                    {format.resolution && format.resolution !== 'Unknown' ? format.resolution : '—'}
                    {' • '}
                    {format.ext ? format.ext.toUpperCase() : 'N/A'}
                    {format.filesize_approx && format.filesize_approx !== 'Unknown' ? ` • ${format.filesize_approx}` : ''}
                    {' • With Audio'}
                  </MenuItem>
                ))
              ) : videoOnlyFormats.length > 0 ? (
                videoOnlyFormats.map(format => (
                  <MenuItem key={format.format_id} value={format.format_id}>
                    {format.resolution && format.resolution !== 'Unknown' ? format.resolution : '—'}
                    {' • '}
                    {format.ext ? format.ext.toUpperCase() : 'N/A'}
                    {format.filesize_approx && format.filesize_approx !== 'Unknown' ? ` • ${format.filesize_approx}` : ''}
                    {' • Video Only'}
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
            onClick={handleDownload}
            disabled={!selectedFormat || isDownloading}
          >
            {isDownloading ? 'Downloading...' : 'Download Video'}
          </Button>
        </ModernCard>
      )}
    </Box>
  );
};

export default TiktokDownloader; 