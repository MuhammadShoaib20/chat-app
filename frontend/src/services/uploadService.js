import api from './api';

export const uploadFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/api/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data; // { url, publicId, originalName }
};

export const uploadAvatar = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/api/upload/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data; // { url, publicId, originalName }
};