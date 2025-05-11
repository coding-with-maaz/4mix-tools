import { Box, AppBar, Toolbar, Typography, Container, Button, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import YouTubeIcon from '@mui/icons-material/YouTube';
import FacebookIcon from '@mui/icons-material/Facebook';
import InstagramIcon from '@mui/icons-material/Instagram';
import TikTokIcon from '@mui/icons-material/MusicVideo';
import PushPinIcon from '@mui/icons-material/PushPin';
import TwitterIcon from '@mui/icons-material/Twitter';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ForumIcon from '@mui/icons-material/Forum';
import { Link, useLocation } from 'react-router-dom';
import colors from '../theme/colors';
import { useState } from 'react';

const navLinks = [
  { label: 'YouTube', path: '/' },
  { label: 'Facebook', path: '/facebook' },
  { label: 'Instagram', path: '/instagram' },
  { label: 'TikTok', path: '/tiktok' },
  { label: 'Pinterest', path: '/pinterest' },
  // Twitter will be in More Tools dropdown
];

const moreTools = [
  { label: 'Twitter Video Downloader', path: '/twitter', icon: <TwitterIcon sx={{ color: '#1DA1F2' }} /> },
  { label: 'Threads Video Downloader', path: '/threads', icon: <ForumIcon sx={{ color: '#8a3ab9' }} /> },
];

const Layout = ({ children }) => {
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <Box minHeight="100vh" display="flex" flexDirection="column">
      <AppBar position="static" sx={{ bgcolor: colors.surface, boxShadow: '0 2px 12px rgba(0,0,0,0.10)' }}>
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: { xs: 1, sm: 2, md: 4 } }}>
          <Box display="flex" alignItems="center" gap={1}>
            <YouTubeIcon sx={{ color: '#FF0000', fontSize: 32, mr: 1 }} />
            <Typography variant="h6" fontWeight={700} color={colors.text} sx={{ letterSpacing: 1 }}>
              Multi-Platform Video Downloader
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            {navLinks.map(link => (
              <Button
                key={link.path}
                component={Link}
                to={link.path}
                startIcon={
                  link.label === 'YouTube' ? <YouTubeIcon sx={{ color: '#FF0000' }} /> :
                  link.label === 'Facebook' ? <FacebookIcon sx={{ color: '#1877F3' }} /> :
                  link.label === 'Instagram' ? <InstagramIcon sx={{ color: '#E1306C' }} /> :
                  link.label === 'TikTok' ? <TikTokIcon sx={{ color: '#010101' }} /> :
                  <PushPinIcon sx={{ color: '#E60023' }} />
                }
                sx={{
                  color: location.pathname === link.path ? colors.primary : colors.textSecondary,
                  fontWeight: location.pathname === link.path ? 700 : 500,
                  bgcolor: location.pathname === link.path ? 'rgba(33,99,235,0.08)' : 'transparent',
                  borderRadius: 3,
                  px: 2,
                  py: 1,
                  mx: 0.5,
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: 'rgba(33,99,235,0.12)',
                    color: colors.primary,
                  },
                }}
              >
                {link.label}
              </Button>
            ))}
            <Button
              color="inherit"
              endIcon={<ExpandMoreIcon />}
              onClick={handleMenuOpen}
              sx={{
                color: open ? colors.primary : colors.textSecondary,
                fontWeight: open ? 700 : 500,
                bgcolor: open ? 'rgba(33,99,235,0.08)' : 'transparent',
                borderRadius: 3,
                px: 2,
                py: 1,
                mx: 0.5,
                transition: 'all 0.2s',
                '&:hover': {
                  bgcolor: 'rgba(33,99,235,0.12)',
                  color: colors.primary,
                },
              }}
            >
              More Tools
            </Button>
            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={handleMenuClose}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              PaperProps={{
                sx: {
                  mt: 1,
                  minWidth: 220,
                  borderRadius: 2,
                  boxShadow: '0 4px 24px rgba(33,99,235,0.10)',
                  p: 1,
                },
              }}
            >
              {moreTools.map(tool => (
                <MenuItem
                  key={tool.path}
                  component={Link}
                  to={tool.path}
                  onClick={handleMenuClose}
                  selected={location.pathname === tool.path}
                  sx={{ borderRadius: 2, mb: 0.5, fontWeight: 500 }}
                >
                  <ListItemIcon>{tool.icon}</ListItemIcon>
                  <ListItemText>{tool.label}</ListItemText>
                </MenuItem>
              ))}
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>
      <Container maxWidth={false} disableGutters sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {children}
      </Container>
      <Box component="footer" sx={{ textAlign: 'center', py: 3, color: colors.textSecondary, fontSize: 15 }}>
        © {new Date().getFullYear()} Multi-Platform Video Downloader
      </Box>
    </Box>
  );
};

export default Layout; 