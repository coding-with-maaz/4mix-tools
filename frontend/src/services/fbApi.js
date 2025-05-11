import axios from 'axios';

const API_URL = 'http://localhost:5000/api/facebook';

export const getFbVideoInfo = async (url) => {
  const response = await axios.post(`${API_URL}/info`, { url });
  return response.data;
};

export const downloadFbVideo = async (url, format) => {
  // This will trigger a redirect, so use window.location for now
  window.location.href = `${API_URL}/download?url=${encodeURIComponent(url)}&format=${encodeURIComponent(format)}`;
}; 