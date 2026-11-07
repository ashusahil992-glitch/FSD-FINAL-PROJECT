import api from './api.js';

export async function registerAccount(account) {
  const { data } = await api.post('/auth/register', account);
  return data.data;
}

export async function loginAccount(credentials) {
  const { data } = await api.post('/auth/login', credentials);
  return data.data;
}

export async function fetchCurrentUser() {
  const { data } = await api.get('/auth/me');
  return data.data;
}

export async function submitVerificationDocument(file, accessToken) {
  const formData = new FormData();
  formData.append('document', file);
  const { data } = await api.post('/verifications/me/document', formData, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return data.data;
}
