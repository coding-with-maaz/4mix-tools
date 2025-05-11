import axios from 'axios';

export const getThreadsVideoInfo = async (url) => {
  const res = await axios.post('http://localhost:5001/api/threads/info', { url });
  return res.data;
};

export const downloadThreadsVideo = async (url, format) => {
  // Not used directly, handled by fetch in the page for progress
  return axios.get('http://localhost:5001/api/threads/download', {
    params: { url, format },
    responseType: 'blob',
  });
}; 