import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  Typography,
  Divider,
  Box,
} from '@mui/material';

const RedditFormatDialog = ({ open, onClose, video, onFormatSelect }) => {
  const [selectedFormat, setSelectedFormat] = React.useState(null);

  const handleFormatSelect = (format) => {
    setSelectedFormat(format);
  };

  const handleDownload = () => {
    if (selectedFormat) {
      onFormatSelect(selectedFormat);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Select Download Format</DialogTitle>
      <DialogContent>
        {video?.videoFormats?.length > 0 && (
          <>
            <Typography variant="h6" gutterBottom>
              Video Formats
            </Typography>
            <List>
              {video.videoFormats.map((format) => (
                <ListItem key={format.format_id} disablePadding>
                  <ListItemButton
                    selected={selectedFormat?.format_id === format.format_id}
                    onClick={() => handleFormatSelect(format)}
                  >
                    <ListItemText
                      primary={`${format.resolution} (${format.ext.toUpperCase()})`}
                      secondary={`Size: ${format.filesize_approx}`}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </>
        )}

        {video?.audioFormats?.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              Audio Formats
            </Typography>
            <List>
              {video.audioFormats.map((format) => (
                <ListItem key={format.format_id} disablePadding>
                  <ListItemButton
                    selected={selectedFormat?.format_id === format.format_id}
                    onClick={() => handleFormatSelect(format)}
                  >
                    <ListItemText
                      primary={`${format.abr} (${format.ext.toUpperCase()})`}
                      secondary={`Size: ${format.filesize_approx}`}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleDownload}
          variant="contained"
          disabled={!selectedFormat}
        >
          Download
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RedditFormatDialog; 