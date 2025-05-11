import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material';
import { ContentCopy, Download } from '@mui/icons-material';

const RedditVideoCard = ({ video, onDownload, onCopy }) => {
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    if (onCopy) onCopy(text);
  };

  return (
    <Card sx={{ maxWidth: 800, width: '100%', mb: 3 }}>
      <CardMedia
        component="img"
        image={video.thumbnail || '/reddit-placeholder.png'}
        alt={video.title}
        sx={{ height: 300, objectFit: 'contain', bgcolor: '#f5f5f5' }}
      />
      
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          {video.uploader && (
            <Typography variant="subtitle1" color="primary" sx={{ mr: 2 }}>
              u/{video.uploader}
            </Typography>
          )}
          <Chip 
            label={`${video.downloadCount || 0} downloads`}
            size="small"
            color="secondary"
          />
        </Box>

        <Typography variant="h6" gutterBottom>
          {video.title}
        </Typography>

        {video.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {video.description}
          </Typography>
        )}

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle2" color="text.secondary">
            Duration: {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
          </Typography>
          
          <Box>
            <Tooltip title="Copy URL">
              <IconButton onClick={() => handleCopy(video.webpage_url)} size="small">
                <ContentCopy />
              </IconButton>
            </Tooltip>
            <Tooltip title="Download">
              <IconButton onClick={() => onDownload(video)} size="small">
                <Download />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default RedditVideoCard; 