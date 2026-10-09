import api from './api.js';

export async function fetchUniversities() {
  const { data } = await api.get('/universities');
  return data.data;
}

export async function fetchHealth() {
  const { data } = await api.get('/health');
  return data.data;
}
