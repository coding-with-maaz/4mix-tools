import axios from 'axios';

const API_URL = 'http://localhost:5000/api/instagram';

export const getIgVideoInfo = async (url) => {
  const response = await axios.post(`${API_URL}/info`, { url });
  return response.data;
};

export const downloadIgVideo = async (url, format) => {
  window.location.href = `${API_URL}/download?url=${encodeURIComponent(url)}&format=${encodeURIComponent(format)}`;
}; 