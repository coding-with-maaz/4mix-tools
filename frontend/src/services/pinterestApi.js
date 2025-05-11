import axios from 'axios';

export const getPinterestVideoInfo = async (url) => {
  const res = await axios.post('http://localhost:5000/api/pinterest/info', { url });
  return res.data;
};

export const downloadPinterestVideo = async (url, format) => {
  // Not used directly, handled by fetch in the page for progress
  return axios.get('http://localhost:5000/api/pinterest/download', {
    params: { url, format },
    responseType: 'blob',
  });
};
