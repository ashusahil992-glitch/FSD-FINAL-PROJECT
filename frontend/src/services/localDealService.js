import api from './api.js';

export async function fetchLocalDeals() {
  const { data } = await api.get('/local-deals');
  return data.data;
}

export async function submitLocalDeal(deal) {
  const { data } = await api.post('/local-deals', deal);
  return data.data;
}
