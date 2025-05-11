import axios from 'axios';

export const getTwitterVideoInfo = async (url) => {
  const res = await axios.post('http://localhost:5000/api/twitter/info', { url });
  return res.data;
};

export const downloadTwitterVideo = async (url, format) => {
  // Not used directly, handled by fetch in the page for progress
  return axios.get('http://localhost:5000/api/twitter/download', {
    params: { url, format },
    responseType: 'blob',
  });
}; 