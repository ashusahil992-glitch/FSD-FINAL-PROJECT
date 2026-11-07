import api from './api.js';

export async function fetchListings() {
  const { data } = await api.get('/listings');
  return data.data;
}

export async function searchListings(filters = {}) {
  const { data } = await api.get('/listings/search', { params: filters });
  return data.data;
}

export async function fetchListing(id) {
  const { data } = await api.get(`/listings/${id}`);
  return data.data;
}

export async function fetchListingReviews(id) {
  const { data } = await api.get(`/listings/${id}/reviews`);
  return data.data;
}

export async function submitListingReview(id, review) {
  const { data } = await api.post(`/listings/${id}/reviews`, review);
  return data.data;
}

export async function createListing(listing) {
  const { data } = await api.post('/listings', listing);
  return data.data;
}

export async function updateListing(id, listing) {
  const { data } = await api.put(`/listings/${id}`, listing);
  return data.data;
}

export async function deleteListing(id) {
  await api.delete(`/listings/${id}`);
}
