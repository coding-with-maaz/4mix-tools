import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import theme from './theme/theme';
import Home from './pages/Home';
import Layout from './components/Layout';
import FacebookDownloader from './pages/FacebookDownloader';
import InstagramDownloader from './pages/InstagramDownloader';
import TiktokDownloader from './pages/TiktokDownloader';
import PinterestDownloader from './pages/PinterestDownloader';
import TwitterDownloader from './pages/TwitterDownloader';
import ThreadsDownloader from './pages/ThreadsDownloader';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/facebook" element={<FacebookDownloader />} />
            <Route path="/instagram" element={<InstagramDownloader />} />
            <Route path="/tiktok" element={<TiktokDownloader />} />
            <Route path="/pinterest" element={<PinterestDownloader />} />
            <Route path="/twitter" element={<TwitterDownloader />} />
            <Route path="/threads" element={<ThreadsDownloader />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default App;
