import { useState } from 'react';
import axios from 'axios';

const useRedditDownloader = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [videoInfo, setVideoInfo] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const fetchVideoInfo = async (url) => {
    setLoading(true);
    setError(null);
    setVideoInfo(null);

    try {
      const response = await axios.post('/api/reddit/info', { url });
      setVideoInfo(response.data);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to fetch video info';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const downloadVideo = async (url, format) => {
    setDownloading(true);
    setDownloadProgress(0);
    setError(null);

    try {
      const response = await axios.post(
        '/api/reddit/download',
        { url, format },
        {
          responseType: 'blob',
          onDownloadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setDownloadProgress(percentCompleted);
          },
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${videoInfo.title || 'reddit-video'}.${format.ext}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      return true;
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Download failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setDownloading(false);
      setDownloadProgress(0);
    }
  };

  return {
    loading,
    error,
    videoInfo,
    downloading,
    downloadProgress,
    fetchVideoInfo,
    downloadVideo,
  };
};

export default useRedditDownloader; 