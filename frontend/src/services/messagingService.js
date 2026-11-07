import api from './api.js';

export async function fetchConversations() {
  const { data } = await api.get('/conversations');
  return data.data;
}

export async function startConversation(listingId) {
  const { data } = await api.post('/conversations', { listingId });
  return data.data;
}

export async function fetchMessages(conversationId) {
  const { data } = await api.get(`/conversations/${conversationId}/messages`);
  return data.data;
}

export async function sendMessage(conversationId, content) {
  const { data } = await api.post(`/conversations/${conversationId}/messages`, { content });
  return data.data;
}

export async function submitListingReport(listingId, reason) {
  const { data } = await api.post('/reports', { listingId, reason });
  return data;
}
