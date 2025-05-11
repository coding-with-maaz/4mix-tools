import { useState } from 'react';
import ModernCard from '../components/ModernCard';
import StyledTextField from '../components/StyledTextField';
import { Button, Typography, Grid, MenuItem, Select, FormControl, InputLabel, Box, CircularProgress } from '@mui/material';
import { getFbVideoInfo, downloadFbVideo } from '../services/fbApi';
import FacebookIcon from '@mui/icons-material/Facebook';

const FacebookDownloader = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [videoInfo, setVideoInfo] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState('');

  const handleFetchInfo = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setVideoInfo(null);
    try {
      const info = await getFbVideoInfo(url);
      setVideoInfo(info);
      setSelectedFormat(info.videoFormats[0]?.format_id || '');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch video info');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (videoInfo && selectedFormat) {
      try {
        const response = await fetch(
          `http://localhost:5000/api/facebook/download?url=${encodeURIComponent(url)}&format=${encodeURIComponent(selectedFormat)}`
        );
        if (!response.ok) throw new Error('Download failed');
        const blob = await response.blob();
        // Get filename from Content-Disposition header
        let filename = videoInfo.title ? `${videoInfo.title}.${selectedFormat}.mp4` : 'download.mp4';
        const contentDisposition = response.headers.get('Content-Disposition');
        if (contentDisposition) {
          const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
          if (matches && matches[1]) {
            filename = matches[1].replace(/['"]/g, '');
          }
        }
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(downloadUrl);
        document.body.removeChild(a);
      } catch (err) {
        alert('Failed to download video');
      }
    }
  };

  // Helper to filter formats
  const videoWithAudioFormats = videoInfo?.videoFormats?.filter(f => f.has_video && f.has_audio) || [];
  const videoOnlyFormats = videoInfo?.videoFormats?.filter(f => f.has_video && !f.has_audio) || [];
  const audioOnlyFormats = videoInfo?.audioFormats || [];

  return (
    <Box sx={{ maxWidth: 700, mx: 'auto', py: 6 }}>
      <ModernCard light sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <FacebookIcon sx={{ color: '#1877F3', fontSize: 36 }} />
          <Typography variant="h4" fontWeight={700}>
            Facebook Video Downloader
          </Typography>
        </Box>
        <form onSubmit={handleFetchInfo}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={9}>
              <StyledTextField
                label="Facebook Video URL"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://www.facebook.com/..."
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
          {videoInfo.thumbnail && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
              <img
                src={videoInfo.thumbnail}
                alt={videoInfo.title}
                style={{ maxWidth: 320, borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.12)' }}
              />
            </Box>
          )}
          <Typography variant="h5" fontWeight={700} gutterBottom>
            {videoInfo.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Duration: {videoInfo.duration ? `${Math.floor(videoInfo.duration/60)}:${(videoInfo.duration%60).toString().padStart(2,'0')}` : 'N/A'}
          </Typography>
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
                    {format.abr ? ` • ${format.abr}kbps` : ''}
                    {format.label ? ` • ${format.label}` : ''}
                  </MenuItem>
                ))
              ) : videoOnlyFormats.length > 0 ? (
                videoOnlyFormats.map(format => (
                  <MenuItem key={format.format_id} value={format.format_id}>
                    {format.resolution && format.resolution !== 'Unknown' ? format.resolution : '—'}
                    {' • '}
                    {format.ext ? format.ext.toUpperCase() : 'N/A'}
                    {format.filesize_approx && format.filesize_approx !== 'Unknown' ? ` • ${format.filesize_approx}` : ''}
                    {format.abr ? ` • ${format.abr}kbps` : ''}
                    {format.label ? ` • ${format.label}` : ''}
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled value="">
                  No video formats available
                </MenuItem>
              )}
            </Select>
          </FormControl>
          {/* Add note for Full HD */}
          <Box sx={{ mt: 1, mb: 2 }}>
            <Typography variant="caption" color="text.secondary">
              For Full HD, select the last (highest quality) option.
            </Typography>
          </Box>
          {/* Audio-only download section */}
          {audioOnlyFormats.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Audio Only Formats
              </Typography>
              <FormControl fullWidth>
                <InputLabel>Select Audio Format</InputLabel>
                <Select
                  value={selectedFormat}
                  onChange={e => setSelectedFormat(e.target.value)}
                  label="Select Audio Format"
                >
                  {audioOnlyFormats.map(format => (
                    <MenuItem key={format.format_id} value={format.format_id}>
                      {format.ext ? format.ext.toUpperCase() : 'N/A'}
                      {format.filesize_approx && format.filesize_approx !== 'Unknown' ? ` • ${format.filesize_approx}` : ''}
                      {format.abr ? ` • ${format.abr}kbps` : ''}
                      {format.label ? ` • ${format.label}` : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                fullWidth
                variant="contained"
                sx={{ mt: 2, fontWeight: 700, height: 48 }}
                onClick={handleDownload}
                disabled={!selectedFormat}
              >
                Download Audio
              </Button>
            </Box>
          )}
          <Button
            fullWidth
            variant="contained"
            sx={{ mt: 3, fontWeight: 700, height: 56 }}
            onClick={handleDownload}
            disabled={!selectedFormat}
          >
            Download Video
          </Button>
        </ModernCard>
      )}
    </Box>
  );
};

export default FacebookDownloader; 