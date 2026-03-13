import api from './api';

export const getConversations = async () => {
  const response = await api.get('/api/conversations');
  return response.data;
};

export const getConversation = async (id) => {
  const response = await api.get(`/api/conversations/${id}`);
  return response.data;
};

export const createConversation = async (data) => {
  const response = await api.post('/api/conversations', data);
  return response.data;
};

export const addParticipants = async (conversationId, userIds) => {
  const response = await api.post(`/api/conversations/${conversationId}/participants`, { userIds });
  return response.data;
};

export const hideConversation = async (conversationId) => {
  const response = await api.post(`/api/conversations/${conversationId}/hide`);
  return response.data;
};