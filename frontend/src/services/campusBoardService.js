import api from './api.js';

export async function fetchCampusPosts() {
  const { data } = await api.get('/campus-board');
  return data.data;
}

export async function createCampusPost(post) {
  const { data } = await api.post('/campus-board', post);
  return data.data;
}

export async function resolveCampusPost(id) {
  const { data } = await api.patch(`/campus-board/${id}/resolve`);
  return data.data;
}

export async function deleteCampusPost(id) {
  await api.delete(`/campus-board/${id}`);
}
