import { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  LinearProgress,
  Tabs,
  Tab,
  Divider,
} from '@mui/material';
import { getVideoInfo, downloadVideo, downloadSubtitles, getAvailableSubtitles } from '../services/api';
import colors from '../theme/colors';
import StyledTextField from '../components/StyledTextField';
import ModernCard from '../components/ModernCard';
import YouTubeIcon from '@mui/icons-material/YouTube';

const formatQualityLabel = (format) => {
  const parts = [];
  if (format.resolution) parts.push(format.resolution);
  if (format.fps) parts.push(`${format.fps}fps`);
  if (format.format_note) parts.push(format.format_note);
  return parts.join(' • ');
};

const formatSizeLabel = (format) => {
  return format.filesize_approx || 'Unknown size';
};

const formatAudioLabel = (format) => {
  if (format.has_audio && format.has_video) return 'With Audio';
  if (!format.has_audio && format.has_video) return 'No Audio';
  if (format.acodec !== 'none') return 'Audio Only';
  return '';
};

const FormatMenuItem = ({ format, isBestQuality }) => {
  const hasAudio = format.has_audio;
  
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      width: '100%',
      borderLeft: hasAudio ? '3px solid #4caf50' : '3px solid #ff9800',
      pl: 1
    }}>
      <Typography>
        {isBestQuality ? 'Best Quality (Auto)' : formatQualityLabel(format)}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {isBestQuality ? 'Automatically selects the best quality' : `${format.ext.toUpperCase()} • ${formatSizeLabel(format)}`}
      </Typography>
      {!isBestQuality && (
        <Typography 
          variant="caption" 
          color={hasAudio ? "success.main" : "warning.main"}
          sx={{ mt: 0.5 }}
        >
          {formatAudioLabel(format)}
        </Typography>
      )}
    </Box>
  );
};

const AudioFormatMenuItem = ({ format }) => {
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      width: '100%',
      borderLeft: '3px solid #2196f3',
      pl: 1
    }}>
      <Typography>
        {format.format_note || `${format.abr}kbps`}
      </Typography>
      <Typography variant="caption" color="text.secondary">
        {format.ext.toUpperCase()} • {formatSizeLabel(format)}
      </Typography>
    </Box>
  );
};

const Home = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [videoInfo, setVideoInfo] = useState(null);
  const [selectedFormat, setSelectedFormat] = useState('best');
  const [selectedAudioFormat, setSelectedAudioFormat] = useState('');
  const [selectedSubtitle, setSelectedSubtitle] = useState('');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [availableSubtitles, setAvailableSubtitles] = useState([]);
  const [subtitleLoading, setSubtitleLoading] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState('');
  const [startTime, setStartTime] = useState(Date.now());

  // Add this at the top of your component, after the imports
  const globalStyles = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.7; }
      100% { opacity: 1; }
    }
    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes gradient {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    @keyframes shimmer {
      0% { background-position: -1000px 0; }
      100% { background-position: 1000px 0; }
    }
    @keyframes float {
      0% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
      100% { transform: translateY(0px); }
    }
    @keyframes glow {
      0% { box-shadow: 0 0 5px rgba(33, 150, 243, 0.2); }
      50% { box-shadow: 0 0 20px rgba(33, 150, 243, 0.4); }
      100% { box-shadow: 0 0 5px rgba(33, 150, 243, 0.2); }
    }
    @keyframes scale {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }
  `;

  // Add this right after your component's state declarations
  useEffect(() => {
    // Add global styles
    const styleSheet = document.createElement("style");
    styleSheet.innerText = globalStyles;
    document.head.appendChild(styleSheet);

    return () => {
      document.head.removeChild(styleSheet);
    };
  }, []);

  // Helper function to format bytes to human-readable format
  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
  };

  // Helper function to format speed
  const formatSpeed = (bytesPerSecond) => {
    return formatBytes(bytesPerSecond) + '/s';
  };

  // Helper function to format time in seconds to MM:SS format
  const formatTime = (seconds) => {
    if (!isFinite(seconds) || seconds < 0) return 'Unknown';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Update the progress display in the UI
  const renderProgress = () => {
    if (!isDownloading) return null;

    return (
      <Box 
        sx={{ 
          width: '100%', 
          mb: 3,
          p: { xs: 2, sm: 3 },
          borderRadius: 5,
          bgcolor: 'rgba(36, 40, 54, 0.85)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          border: `1.5px solid ${colors.border}`,
          backdropFilter: 'blur(12px)',
          position: 'relative',
          overflow: 'visible',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Box sx={{ width: '100%', position: 'relative', mb: 4, mt: 2 }}>
          {/* Floating Percentage */}
          <Box
            sx={{
              position: 'absolute',
              left: '50%',
              top: { xs: -38, sm: -44 },
              transform: 'translateX(-50%)',
              zIndex: 2,
              px: 2,
              py: 0.5,
              borderRadius: 3,
              bgcolor: 'rgba(24,26,32,0.92)',
              boxShadow: '0 2px 12px rgba(33,150,243,0.18)',
              fontWeight: 700,
              fontSize: { xs: '1.3rem', sm: '1.7rem' },
              color: colors.primary,
              textShadow: '0 2px 8px rgba(33,150,243,0.25)',
              transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
              animation: 'pulse 1.5s infinite',
              border: `1.5px solid ${colors.primaryLight}`,
            }}
          >
            {downloadProgress}%
          </Box>
          {/* Progress Bar */}
          <LinearProgress 
            variant="determinate" 
            value={downloadProgress} 
            sx={{ 
              height: 18,
              borderRadius: 9,
              background: 'rgba(0,0,0,0.10)',
              boxShadow: '0 2px 12px rgba(33,150,243,0.10)',
              overflow: 'hidden',
              '& .MuiLinearProgress-bar': {
                borderRadius: 9,
                backgroundImage: 'linear-gradient(90deg, #2563eb 0%, #60a5fa 50%, #22c55e 100%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 2.5s linear infinite',
                boxShadow: '0 2px 16px 0 #2563eb44',
                transition: 'width 0.4s cubic-bezier(0.4,0,0.2,1)',
              }
            }}
          />
        </Box>
        <Box 
          sx={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 3,
            animation: 'slideUp 0.5s ease-out',
            width: '100%',
          }}
        >
          <CircularProgress 
            size={32} 
            thickness={4}
            sx={{ 
              color: colors.primary,
              animation: 'spin 1s linear infinite',
              filter: 'drop-shadow(0 4px 8px rgba(33, 150, 243, 0.4))'
            }} 
          />
          <Typography 
            variant="h6" 
            color="text.secondary" 
            align="center"
            sx={{
              fontFamily: 'monospace',
              fontSize: '1.1rem',
              letterSpacing: '0.5px',
              fontWeight: 500,
              textShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            {downloadStatus}
          </Typography>
        </Box>
      </Box>
    );
  };

  // Update the download buttons to include progress
  const renderDownloadButton = (type, label, disabled) => (
    <Button
      fullWidth
      variant="contained"
      onClick={() => handleDownload(type)}
      disabled={disabled || isDownloading}
      sx={{
        height: 64,
        borderRadius: 4,
        textTransform: 'none',
        fontSize: '1.2rem',
        fontWeight: 'bold',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        background: isDownloading 
          ? 'linear-gradient(45deg, #2196f3 30%, #21CBF3 90%)'
          : 'linear-gradient(45deg, #1976d2 30%, #2196f3 90%)',
        backgroundSize: '200% 200%',
        animation: isDownloading ? 'gradient 3s ease infinite' : 'none',
        boxShadow: '0 8px 24px rgba(33, 150, 243, 0.3)',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 12px 32px rgba(33, 150, 243, 0.4)',
          backgroundSize: '200% 200%',
          animation: 'gradient 3s ease infinite'
        },
        '&:active': {
          transform: 'translateY(-2px)',
          boxShadow: '0 6px 20px rgba(33, 150, 243, 0.3)'
        },
        '&:disabled': {
          background: 'rgba(0, 0, 0, 0.12)',
          transform: 'none',
          boxShadow: 'none',
          animation: 'none'
        }
      }}
    >
      {isDownloading ? (
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 3,
            animation: 'pulse 1.5s ease-in-out infinite'
          }}
        >
          <CircularProgress 
            size={32} 
            color="inherit"
            sx={{
              animation: 'spin 1s linear infinite',
              filter: 'drop-shadow(0 4px 8px rgba(255,255,255,0.4))'
            }}
          />
          <Typography sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
            Downloading {label}...
          </Typography>
        </Box>
      ) : (
        `Download ${label}`
      )}
    </Button>
  );

  const handleUrlSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setVideoInfo(null);
    setDownloadProgress(0);
    setAvailableSubtitles([]);

    try {
      if (!url.trim()) {
        throw new Error('Please enter a YouTube URL');
      }

      const info = await getVideoInfo(url);
      setVideoInfo(info);
      
      // Fetch available subtitles
      setSubtitleLoading(true);
      try {
        const subtitles = await getAvailableSubtitles(url);
        // Handle different subtitle data structures
        let subtitleArray = [];
        if (Array.isArray(subtitles)) {
          subtitleArray = subtitles;
        } else if (typeof subtitles === 'object') {
          subtitleArray = Object.entries(subtitles).map(([language, data]) => ({
            language,
            autoGenerated: Array.isArray(data) ? data.some(sub => sub.ext === 'vtt') : false,
            formats: Array.isArray(data) ? data : []
          }));
        }
        console.log('Processed subtitles:', subtitleArray); // Debug log
        setAvailableSubtitles(subtitleArray);
      } catch (err) {
        console.warn('Failed to fetch subtitles:', err);
        setAvailableSubtitles([]);
      } finally {
        setSubtitleLoading(false);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch video information');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (type) => {
    try {
      setDownloadStatus('Starting download...');
      setDownloadProgress(0);
      setIsDownloading(true);
      setStartTime(Date.now());

      let apiUrl;
      let expectedSize = 0;

      // Get the expected file size based on selected format
      if (type === 'video') {
        if (selectedFormat === 'best') {
          expectedSize = Math.max(...videoInfo.videoFormats.map(f => f.filesize || 0));
        } else {
          const selectedVideoFormat = videoInfo.videoFormats.find(f => f.format_id === selectedFormat);
          expectedSize = selectedVideoFormat?.filesize || 0;
        }
      } else if (type === 'audio') {
        if (!selectedAudioFormat) {
          setError('Please select an audio format.');
          setIsDownloading(false);
          return;
        }
        const selectedAudio = videoInfo.audioFormats.find(f => f.format_id === selectedAudioFormat);
        if (!selectedAudio) {
          setError('Selected audio format not found.');
          setIsDownloading(false);
          return;
        }
        expectedSize = selectedAudio?.filesize || 0;
        console.log('Selected audio format:', selectedAudio);
      }

      console.log('Expected file size:', formatBytes(expectedSize));

      if (type === 'video' || type === 'audio') {
        apiUrl = 'http://localhost:5001/api/youtube/download';
      } else if (type === 'subtitles') {
        apiUrl = 'http://localhost:5001/api/youtube/subtitles';
      }

      console.log('Starting download request to:', apiUrl);
      console.log('Download type:', type, 'Format:', type === 'video' ? selectedFormat : selectedAudioFormat);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url,
          format: type === 'video' ? selectedFormat : selectedAudioFormat,
          ...(type === 'subtitles' && {
            language: selectedSubtitle,
            autoGenerated: selectedSubtitle.includes('(auto)')
          })
        })
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      let loaded = 0;
      let lastProgressUpdate = 0;
      let lastLoaded = 0;
      const reader = response.body.getReader();
      const chunks = [];
      let backendProgress = 0;
      let isFirstProgressUpdate = true;

      // Get the total size from the response headers
      const contentLength = response.headers.get('Content-Length');
      const totalSize = contentLength ? parseInt(contentLength) : expectedSize;
      console.log('Total size:', totalSize ? formatBytes(totalSize) : 'Unknown');

      // Initialize progress tracking
      let estimatedTotal = totalSize;

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('Download complete, total bytes:', formatBytes(loaded));
          break;
        }
        
        chunks.push(value);
        loaded += value.length;

        // Update progress every 100ms to avoid too many re-renders
        const now = Date.now();
        if (now - lastProgressUpdate > 100) {
          lastProgressUpdate = now;
          
          // Calculate speed and progress
          const elapsedTime = (now - startTime) / 1000; // seconds
          const speed = loaded / elapsedTime; // bytes per second
          
          // Calculate progress based on actual downloaded size and expected size
          let progress;
          
          if (totalSize) {
            // If we have the total size, calculate exact progress
            progress = (loaded / totalSize) * 100;
          } else if (expectedSize) {
            // If we have the expected size from the format, use that
            progress = (loaded / expectedSize) * 100;
          } else {
            // If we don't know the total size, estimate based on time and speed
            estimatedTotal = Math.max(loaded * 2, speed * 10);
            progress = (loaded / estimatedTotal) * 100;
          }
          
          // Ensure progress starts from 0 and increases gradually
          if (isFirstProgressUpdate) {
            progress = Math.min(progress, 5); // Cap initial progress at 5%
            isFirstProgressUpdate = false;
          } else {
            // Cap progress at 99% until we're actually complete
            progress = Math.min(progress, 99);
          }
          
          const roundedProgress = Math.round(progress);
          
          // Try to parse backend progress from response headers
          const progressHeader = response.headers.get('X-Download-Progress');
          if (progressHeader) {
            try {
              const progressData = JSON.parse(progressHeader);
              if (progressData.percentage) {
                // Only use backend progress if it's higher than our calculated progress
                if (progressData.percentage > roundedProgress) {
                  backendProgress = progressData.percentage;
                }
              }
            } catch (e) {
              console.warn('Failed to parse progress header:', e);
            }
          }
          
          // Use backend progress if available and higher, otherwise use calculated progress
          const displayProgress = backendProgress > roundedProgress ? backendProgress : roundedProgress;
          
          console.log('Download progress:', displayProgress + '%', 'Loaded:', formatBytes(loaded), 'Speed:', formatSpeed(speed));
          setDownloadProgress(displayProgress);
          
          // Calculate ETA
          let eta = 'Calculating...';
          if (speed > 0 && (totalSize || expectedSize)) {
            const remaining = (totalSize || expectedSize) - loaded;
            const remainingTime = remaining / speed;
            if (remainingTime > 0 && remainingTime < 3600) { // Less than 1 hour
              eta = formatTime(remainingTime);
            }
          }
          
          const statusMessage = `Downloading: ${displayProgress}% • ${formatSpeed(speed)} • ETA: ${eta}`;
          console.log('Status message:', statusMessage);
          setDownloadStatus(statusMessage);
        }
      }

      // Combine chunks into a single Uint8Array
      const blob = new Blob(chunks);
      console.log('Blob size:', formatBytes(blob.size));
      
      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'download';
      if (contentDisposition) {
        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }
      console.log('Download filename:', filename);

      // Create download link
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
      
      setDownloadStatus('Download completed!');
      setDownloadProgress(100);
      console.log('Download process completed successfully');
    } catch (error) {
      console.error('Download error:', error);
      setDownloadStatus('Download failed: ' + (error.message || 'Unknown error'));
    } finally {
      setIsDownloading(false);
    }
  };

  const handleAudioDownload = async () => {
    setIsDownloading(true);
    setError(null);
    setDownloadProgress(0);

    try {
      if (!videoInfo) {
        throw new Error('Please get video information first');
      }

      // Find the selected audio format
      const selectedAudio = videoInfo.audioFormats.find(f => f.format_id === selectedAudioFormat);
      if (!selectedAudio) {
        throw new Error('Selected audio format not found');
      }

      console.log('Downloading audio format:', selectedAudio); // Debug log

      const blob = await downloadVideo(url, selectedAudioFormat, (progress) => {
        console.log('Audio download progress:', progress); // Debug log
        setDownloadProgress(progress);
      });
      
      // Ensure progress reaches 100% before completing
      setDownloadProgress(100);
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay to show 100%
      
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${videoInfo.title}.${selectedAudio.ext}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Audio download error:', err); // Debug log
      setError(err.message || 'Failed to download audio');
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  const handleSubtitleDownload = async () => {
    setIsDownloading(true);
    setError(null);
    setDownloadProgress(0);

    try {
      if (!videoInfo) {
        throw new Error('Please get video information first');
      }

      const blob = await downloadSubtitles(url, selectedSubtitle, false, (progress) => {
        console.log('Subtitle download progress:', progress); // Debug log
        setDownloadProgress(progress);
      });
      
      // Ensure progress reaches 100% before completing
      setDownloadProgress(100);
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay to show 100%
      
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${videoInfo.title}.${selectedSubtitle}.srt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    } catch (err) {
      setError(err.message || 'Failed to download subtitles');
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  // Helper to get the best audio format
  const getBestAudioFormat = () => {
    if (!videoInfo || !videoInfo.audioFormats || videoInfo.audioFormats.length === 0) return null;
    // Sort by bitrate (abr) descending
    return [...videoInfo.audioFormats].sort((a, b) => (b.abr || 0) - (a.abr || 0))[0];
  };

  const renderDownloadSection = () => {
    if (!videoInfo) return null;

    return (
      <Card>
        <CardContent>
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{ mb: 2 }}
          >
            <Tab label="Video" />
            <Tab label="Audio" />
            <Tab label="Subtitles" />
          </Tabs>

          {activeTab === 0 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Select Video Format</InputLabel>
                  <Select
                    value={selectedFormat}
                    onChange={(e) => setSelectedFormat(e.target.value)}
                    label="Select Video Format"
                  >
                    <MenuItem value="best">
                      <FormatMenuItem format={{}} isBestQuality />
                    </MenuItem>
                    {videoInfo.videoFormats.map((format) => (
                      <MenuItem key={format.format_id} value={format.format_id}>
                        <FormatMenuItem format={format} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              {/* If selected video format has no audio, show best audio download option */}
              {selectedFormat !== 'best' && (() => {
                const selectedVideo = videoInfo.videoFormats.find(f => f.format_id === selectedFormat);
                if (selectedVideo && !selectedVideo.has_audio) {
                  const bestAudio = getBestAudioFormat();
                  return bestAudio ? (
                    <Grid item xs={12}>
                      <Box sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: 'center',
                        gap: 2,
                        mb: 1,
                        p: 2,
                        bgcolor: 'rgba(255,255,255,0.04)',
                        borderRadius: 3,
                        border: `1.5px solid ${colors.warning}`,
                        boxShadow: '0 2px 8px rgba(255,193,7,0.08)'
                      }}>
                        <Typography color="warning.main" sx={{ fontWeight: 600, mr: 2 }}>
                          This video format has no audio.
                        </Typography>
                        <Button
                          variant="outlined"
                          color="success"
                          onClick={() => {
                            setActiveTab(1);
                            setSelectedAudioFormat(bestAudio.format_id);
                            setTimeout(() => handleDownload('audio'), 200);
                          }}
                          sx={{
                            fontWeight: 'bold',
                            borderRadius: 3,
                            borderWidth: 2,
                            px: 3,
                            py: 1.2,
                            background: 'linear-gradient(90deg, #22c55e 0%, #60a5fa 100%)',
                            color: '#fff',
                            boxShadow: '0 2px 8px rgba(34,197,94,0.12)',
                            '&:hover': {
                              background: 'linear-gradient(90deg, #60a5fa 0%, #22c55e 100%)',
                            }
                          }}
                        >
                          Download Best Audio ({bestAudio.abr}kbps, {bestAudio.ext.toUpperCase()})
                        </Button>
                      </Box>
                    </Grid>
                  ) : null;
                }
                return null;
              })()}
              <Grid item xs={12}>
                {renderProgress()}
                {renderDownloadButton('video', 'Video', isDownloading || !selectedFormat || videoInfo.videoFormats.length === 0)}
              </Grid>
            </Grid>
          )}

          {activeTab === 1 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Select Audio Format</InputLabel>
                  <Select
                    value={selectedAudioFormat}
                    onChange={(e) => setSelectedAudioFormat(e.target.value)}
                    label="Select Audio Format"
                  >
                    {videoInfo.audioFormats.map((format) => (
                      <MenuItem key={format.format_id} value={format.format_id}>
                        <AudioFormatMenuItem format={format} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                {videoInfo.audioFormats.length === 0 && (
                  <Typography color="text.secondary" align="center" sx={{ mt: 1 }}>
                    No audio formats available for this video
                  </Typography>
                )}
              </Grid>

              <Grid item xs={12}>
                {renderProgress()}
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => handleDownload('audio')}
                  disabled={isDownloading || !selectedAudioFormat || videoInfo.audioFormats.length === 0}
                  sx={{
                    height: 64,
                    borderRadius: 4,
                    textTransform: 'none',
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    background: isDownloading 
                      ? 'linear-gradient(45deg, #2196f3 30%, #21CBF3 90%)'
                      : 'linear-gradient(45deg, #1976d2 30%, #2196f3 90%)',
                    backgroundSize: '200% 200%',
                    animation: isDownloading ? 'gradient 3s ease infinite' : 'none',
                    boxShadow: '0 8px 24px rgba(33, 150, 243, 0.3)',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 32px rgba(33, 150, 243, 0.4)',
                      backgroundSize: '200% 200%',
                      animation: 'gradient 3s ease infinite'
                    },
                    '&:active': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 20px rgba(33, 150, 243, 0.3)'
                    },
                    '&:disabled': {
                      background: 'rgba(0, 0, 0, 0.12)',
                      transform: 'none',
                      boxShadow: 'none',
                      animation: 'none'
                    }
                  }}
                >
                  {isDownloading ? (
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 3,
                        animation: 'pulse 1.5s ease-in-out infinite'
                      }}
                    >
                      <CircularProgress 
                        size={32} 
                        color="inherit"
                        sx={{
                          animation: 'spin 1s linear infinite',
                          filter: 'drop-shadow(0 4px 8px rgba(255,255,255,0.4))'
                        }}
                      />
                      <Typography sx={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
                        Downloading Audio...
                      </Typography>
                    </Box>
                  ) : (
                    'Download Audio'
                  )}
                </Button>
              </Grid>
            </Grid>
          )}

          {activeTab === 2 && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                {subtitleLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                    <CircularProgress />
                  </Box>
                ) : availableSubtitles.length > 0 ? (
                  <FormControl fullWidth>
                    <InputLabel>Select Subtitle Language</InputLabel>
                    <Select
                      value={selectedSubtitle}
                      onChange={(e) => setSelectedSubtitle(e.target.value)}
                      label="Select Subtitle Language"
                    >
                      {availableSubtitles.map((subtitle) => (
                        <MenuItem key={subtitle.language} value={subtitle.language}>
                          {subtitle.language} {subtitle.autoGenerated ? '(Auto-generated)' : ''}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                ) : (
                  <Typography color="text.secondary" align="center">
                    No subtitles available for this video
                  </Typography>
                )}
              </Grid>

              <Grid item xs={12}>
                {renderProgress()}
                {renderDownloadButton('subtitles', 'Subtitles', isDownloading || !selectedSubtitle || availableSubtitles.length === 0)}
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Box 
      component="form" 
      onSubmit={handleUrlSubmit} 
      sx={{ 
        maxWidth: 900, 
        mx: 'auto',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: { xs: 'flex-start', md: 'center' },
        alignItems: 'center',
        px: { xs: 1, sm: 2, md: 4 },
        py: { xs: 2, sm: 4, md: 6 },
        background: `linear-gradient(135deg, ${colors.background} 60%, ${colors.surfaceAlt} 100%)`
      }}
    >
      <ModernCard light sx={{ mb: 4 }}>
        <Typography 
          variant="h3" 
          gutterBottom 
          sx={{ 
            fontWeight: 'bold',
            mb: 4,
            background: 'linear-gradient(45deg, #1976d2, #2196f3)',
            backgroundClip: 'text',
            textFillColor: 'transparent',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textAlign: 'center',
            animation: 'fadeIn 0.5s ease-out'
          }}
        >
          YouTube Video Downloader
        </Typography>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={8}>
            <StyledTextField
              label="YouTube URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              required
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Button
              fullWidth
              variant="contained"
              type="submit"
              disabled={loading}
              sx={{ 
                height: 64,
                borderRadius: 3,
                textTransform: 'none',
                fontSize: '1.2rem',
                fontWeight: 'bold',
                background: 'linear-gradient(45deg, #1976d2 30%, #2196f3 90%)',
                boxShadow: '0 8px 24px rgba(33, 150, 243, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)',
                  boxShadow: '0 12px 32px rgba(33, 150, 243, 0.4)',
                  transform: 'translateY(-4px)'
                },
                '&:active': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px rgba(33, 150, 243, 0.3)'
                }
              }}
            >
              {loading ? (
                <CircularProgress 
                  size={32} 
                  sx={{ 
                    color: 'white',
                    filter: 'drop-shadow(0 4px 8px rgba(255,255,255,0.4))'
                  }} 
                />
              ) : (
                'Get Video Info'
              )}
            </Button>
          </Grid>
        </Grid>
      </ModernCard>

      {error && (
        <ModernCard light sx={{ mb: 4, borderLeft: '4px solid ' + colors.error }}>
          <Alert 
            severity="error" 
            sx={{
              borderRadius: 2,
              boxShadow: 'none',
              background: 'none',
              border: 'none',
              m: 0,
              p: 0
            }}
          >
            {error}
          </Alert>
        </ModernCard>
      )}

      {videoInfo && (
        <ModernCard sx={{ mb: 5, animation: 'fadeIn 0.7s ease' }}>
          {videoInfo.thumbnail && (
            <Box sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              mb: 3,
            }}>
              <Box
                sx={{
                  borderRadius: 3,
                  overflow: 'hidden',
                  border: `2px solid ${colors.border}`,
                  boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  aspectRatio: '16/9',
                  width: { xs: '100%', sm: 400, md: 480 },
                  maxWidth: '100%',
                  '&:hover': {
                    transform: 'scale(1.025)',
                    boxShadow: '0 8px 32px rgba(33,150,243,0.18)',
                  },
                }}
              >
                <img
                  src={videoInfo.thumbnail}
                  alt={videoInfo.title}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              </Box>
            </Box>
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <YouTubeIcon sx={{ color: '#FF0000', fontSize: 36, mb: '2px' }} />
            <Typography 
              variant="h4" 
              gutterBottom
              sx={{ 
                fontWeight: 'bold',
                color: 'text.primary',
                background: 'linear-gradient(45deg, #1976d2, #2196f3)',
                backgroundClip: 'text',
                textFillColor: 'transparent',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 0
              }}
            >
              {videoInfo.title}
            </Typography>
          </Box>
          <Divider sx={{ my: 2, borderColor: colors.border, opacity: 0.2 }} />
          <Typography 
            variant="h6" 
            color="text.secondary" 
            gutterBottom
            sx={{ 
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              fontWeight: 500,
              fontSize: { xs: '1rem', sm: '1.15rem' },
              letterSpacing: 0.5
            }}
          >
            <span style={{ opacity: 0.7 }}>Duration:</span>
            <span style={{ 
              fontWeight: 700,
              color: colors.primary,
              textShadow: '0 2px 4px rgba(33, 150, 243, 0.12)',
              fontSize: '1.1em',
              letterSpacing: 1
            }}>
              {Math.floor(videoInfo.duration / 60)}:{(videoInfo.duration % 60).toString().padStart(2, '0')}
            </span>
          </Typography>
        </ModernCard>
      )}

      <ModernCard sx={{ mb: 4 }}>{renderDownloadSection()}</ModernCard>
    </Box>
  );
};

export default Home; 