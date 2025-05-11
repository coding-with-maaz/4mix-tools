import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Snackbar,
  Container,
} from '@mui/material';
import { Download } from '@mui/icons-material';
import RedditVideoCard from '../components/RedditVideoCard';
import RedditFormatDialog from '../components/RedditFormatDialog';
import { ModernCard } from '../components/ModernCard';
import { DownloadProgress } from '../components/DownloadProgress';
import useRedditDownloader from '../hooks/useRedditDownloader';

const RedditDownloader = () => {
  const [url, setUrl] = useState('');
  const [formatDialogOpen, setFormatDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  const {
    loading,
    error,
    videoInfo,
    downloading,
    downloadProgress,
    fetchVideoInfo,
    downloadVideo,
  } = useRedditDownloader();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await fetchVideoInfo(url);
    } catch (err) {
      // Error is handled by the hook
    }
  };

  const handleDownload = async (format) => {
    try {
      await downloadVideo(url, format);
      setSnackbar({ open: true, message: 'Download completed successfully!' });
    } catch (err) {
      setSnackbar({ open: true, message: 'Download failed. Please try again.' });
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setSnackbar({ open: true, message: 'URL copied to clipboard!' });
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ mb: 4 }}>
        Reddit Video Downloader
      </Typography>

      <ModernCard sx={{ mb: 4 }}>
        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              fullWidth
              label="Reddit Video URL"
              variant="outlined"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.reddit.com/r/..."
              error={!!error}
              helperText={error}
            />
            <Button
              type="submit"
              variant="contained"
              disabled={loading || !url}
              sx={{ minWidth: 120 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Fetch Info'}
            </Button>
          </Box>
        </form>
      </ModernCard>

      {videoInfo && (
        <RedditVideoCard
          video={videoInfo}
          onDownload={() => setFormatDialogOpen(true)}
          onCopy={handleCopy}
        />
      )}

      <RedditFormatDialog
        open={formatDialogOpen}
        onClose={() => setFormatDialogOpen(false)}
        video={videoInfo}
        onFormatSelect={handleDownload}
      />

      {downloading && (
        <DownloadProgress progress={downloadProgress} />
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Container>
  );
};

export default RedditDownloader; 