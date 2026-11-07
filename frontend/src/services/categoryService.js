import api from './api.js';

export async function fetchCategories() {
  const { data } = await api.get('/categories');
  return data.data;
}
