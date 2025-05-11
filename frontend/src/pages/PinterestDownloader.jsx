import { useState } from 'react';
import ModernCard from '../components/ModernCard';
import StyledTextField from '../components/StyledTextField';
import { Button, Typography, Grid, MenuItem, Select, FormControl, InputLabel, Box, CircularProgress, LinearProgress } from '@mui/material';
import { getPinterestVideoInfo } from '../services/pinterestApi';
import PushPinIcon from '@mui/icons-material/PushPin';

const PinterestDownloader = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [videoInfo, setVideoInfo] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState('');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

  // Helper to filter formats
  const videoFormats = videoInfo?.videoFormats || [];

  const handleFetchInfo = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setVideoInfo(null);
    setSelectedFormat('');
    try {
      const info = await getPinterestVideoInfo(url);
      setVideoInfo(info);
      // Set initial format selection
      if (info.videoFormats?.length > 0) {
        setSelectedFormat(info.videoFormats[0].format_id);
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
      let formatObj = videoFormats.find(f => f.format_id === formatId);
      const totalSize = formatObj && formatObj.filesize && formatObj.filesize !== 'Unknown' ? formatObj.filesize : null;
      const response = await fetch(
        `http://localhost:5000/api/pinterest/download?url=${encodeURIComponent(url)}&format=${encodeURIComponent(formatId)}`
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
      const filename = `${videoInfo.title || 'pinterest-video'}.mp4`;
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
          <PushPinIcon sx={{ color: '#E60023', fontSize: 36 }} />
          <Typography variant="h4" fontWeight={700}>
            Pinterest Video Downloader
          </Typography>
        </Box>
        <form onSubmit={handleFetchInfo}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={9}>
              <StyledTextField
                label="Pinterest Video URL"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://www.pinterest.com/pin/123456789/"
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
                alt="Pinterest thumbnail"
                style={{ width: 220, maxWidth: '100%', borderRadius: 12, marginBottom: 16, objectFit: 'cover', boxShadow: '0 2px 12px rgba(0,0,0,0.10)' }}
                onError={e => { e.target.onerror = null; e.target.src = '/no-thumbnail.png'; }}
              />
            )}
            <PushPinIcon sx={{ color: '#E60023', fontSize: 64, mb: 2 }} />
            <Typography variant="h5" fontWeight={700} gutterBottom>
              {videoInfo.title}
            </Typography>
            {videoInfo.description && (
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {videoInfo.description}
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {videoInfo.uploader && `By: ${videoInfo.uploader}`}
            </Typography>
          </Box>

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
                    {format.resolution && format.resolution !== 'Unknown' ? format.resolution : '—'}
                    {' • '}
                    {format.ext ? format.ext.toUpperCase() : 'N/A'}
                    {format.filesize_approx && format.filesize_approx !== 'Unknown' ? ` • ${format.filesize_approx}` : ''}
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

export default PinterestDownloader;
