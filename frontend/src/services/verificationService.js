import api from './api.js';

export async function fetchVerificationProfile() {
  const { data } = await api.get('/verifications/me');
  return data.data;
}

export async function submitVerificationDocument(file) {
  const formData = new FormData();
  formData.append('document', file);
  const { data } = await api.post('/verifications/me/document', formData);
  return data.data;
}

export async function fetchOwnVerificationDocument() {
  const { data } = await api.get('/verifications/me/document', { responseType: 'blob' });
  return data;
}
