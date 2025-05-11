import { useState } from 'react';
import ModernCard from '../components/ModernCard';
import StyledTextField from '../components/StyledTextField';
import { Button, Typography, Grid, MenuItem, Select, FormControl, InputLabel, Box, CircularProgress, Tabs, LinearProgress } from '@mui/material';
import { getIgVideoInfo, downloadIgVideo } from '../services/igApi';
import InstagramIcon from '@mui/icons-material/Instagram';
import { Tab } from '@mui/material';

const InstagramDownloader = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [videoInfo, setVideoInfo] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState('');
  const [selectedAudioFormat, setSelectedAudioFormat] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [thumbnailError, setThumbnailError] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

  // Helper to filter formats
  const videoWithAudioFormats = videoInfo?.videoFormats?.filter(f => f.has_video && f.has_audio) || [];
  const videoOnlyFormats = videoInfo?.videoFormats?.filter(f => f.has_video && !f.has_audio) || [];
  const audioOnlyFormats = videoInfo?.audioFormats || [];

  const handleFetchInfo = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setVideoInfo(null);
    setSelectedFormat('');
    setSelectedAudioFormat('');
    try {
      const info = await getIgVideoInfo(url);
      setVideoInfo(info);
      // Set initial format selections
      if (info.videoFormats?.length > 0) {
        const bestVideo = info.videoFormats.find(f => f.has_video && f.has_audio) || info.videoFormats[0];
        setSelectedFormat(bestVideo.format_id);
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
      let formatObj = null;
      if (type === 'video') {
        formatObj = [...videoWithAudioFormats, ...videoOnlyFormats].find(f => f.format_id === formatId);
      } else {
        formatObj = audioOnlyFormats.find(f => f.format_id === formatId);
      }
      const totalSize = formatObj && formatObj.filesize && formatObj.filesize !== 'Unknown' ? formatObj.filesize : null;

      const response = await fetch(
        `http://localhost:5000/api/instagram/download?url=${encodeURIComponent(url)}&format=${encodeURIComponent(formatId)}`
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
      const filename = `${videoInfo.title}.${type === 'video' ? 'mp4' : 'mp3'}`;
      
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
          <InstagramIcon sx={{ color: '#E1306C', fontSize: 36 }} />
          <Typography variant="h4" fontWeight={700}>
            Instagram Video Downloader
          </Typography>
        </Box>
        <form onSubmit={handleFetchInfo}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={9}>
              <StyledTextField
                label="Instagram Video URL"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://www.instagram.com/reel/..."
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
            <InstagramIcon sx={{ color: '#E1306C', fontSize: 64, mb: 2 }} />
            <Typography variant="h5" fontWeight={700} gutterBottom>
              {videoInfo.title}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Duration: {videoInfo.duration ? `${Math.floor(videoInfo.duration/60)}:${(videoInfo.duration%60).toString().padStart(2,'0')}` : 'N/A'}
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
                  {audioOnlyFormats.length > 0 ? (
                    audioOnlyFormats.map(format => (
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
    </Box>
  );
};

export default InstagramDownloader; 