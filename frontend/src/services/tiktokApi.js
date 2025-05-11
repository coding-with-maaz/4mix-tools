import axios from 'axios';

export const getTiktokVideoInfo = async (url) => {
  const res = await axios.post('http://localhost:5000/api/tiktok/info', { url });
  return res.data;
};

export const downloadTiktokVideo = async (url, format) => {
  // Not used directly, handled by fetch in the page for progress
  return axios.get('http://localhost:5000/api/tiktok/download', {
    params: { url, format },
    responseType: 'blob',
  });
}; 