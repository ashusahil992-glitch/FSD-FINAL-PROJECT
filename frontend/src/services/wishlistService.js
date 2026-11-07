import api from './api.js';

export async function fetchWishlist() {
  const { data } = await api.get('/wishlist');
  return data.data;
}

export async function addWishlistItem(listingId) {
  const { data } = await api.post(`/wishlist/${listingId}`);
  return data.data;
}

export async function removeWishlistItem(listingId) {
  await api.delete(`/wishlist/${listingId}`);
}

export async function checkWishlistItem(listingId) {
  const { data } = await api.get(`/wishlist/check/${listingId}`);
  return data.data;
}
