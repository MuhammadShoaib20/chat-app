import api from './api';

export const searchUsers = async (query) => {
  const response = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
  return response.data;
};

export const getBlockStatus = async (userId) => {
  const response = await api.get(`/users/block-status/${userId}`);
  return response.data; // { hasBlocked, isBlockedBy }
};

export const blockUser = async (userId) => {
  const response = await api.post(`/users/block/${userId}`);
  return response.data;
};

export const unblockUser = async (userId) => {
  const response = await api.post(`/users/unblock/${userId}`);
  return response.data;
};