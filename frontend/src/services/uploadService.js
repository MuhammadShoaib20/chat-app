import api from './api';

export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/upload', formData);
  return response.data; // { url, publicId, originalName }
};

export const uploadAvatar = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/upload/avatar', formData);
  return response.data; // { url, publicId, originalName }
};