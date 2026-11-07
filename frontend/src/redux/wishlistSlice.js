import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { logout, setCredentials } from './authSlice.js';
import * as wishlistService from '../services/wishlistService.js';

export const fetchWishlist = createAsyncThunk(
  'wishlist/fetch',
  async ({ userId }, { rejectWithValue }) => {
    try {
      return { userId: String(userId), entries: await wishlistService.fetchWishlist() };
    } catch (error) {
      return rejectWithValue({
        userId: String(userId),
        message: error.userMessage || 'Could not load your wishlist.',
      });
    }
  },
);

export const addWishlistItem = createAsyncThunk(
  'wishlist/add',
  async ({ listingId, userId }, { rejectWithValue }) => {
    try {
      const entry = await wishlistService.addWishlistItem(listingId);
      return { entry, userId: String(userId) };
    } catch (error) {
      return rejectWithValue(error.userMessage || 'Could not add this listing to your wishlist.');
    }
  },
);

export const removeWishlistItem = createAsyncThunk(
  'wishlist/remove',
  async ({ listingId, userId }, { rejectWithValue }) => {
    try {
      await wishlistService.removeWishlistItem(listingId);
      return { listingId: String(listingId), userId: String(userId) };
    } catch (error) {
      return rejectWithValue(error.userMessage || 'Could not remove this listing from your wishlist.');
    }
  },
);

const initialState = {
  ids: [],
  entries: [],
  ownerId: null,
  loading: false,
  error: '',
  pendingIds: [],
};

function listingKey(listingId) {
  return String(listingId);
}

function upsertEntry(state, entry) {
  const key = listingKey(entry.listing.id);
  const index = state.entries.findIndex((item) => listingKey(item.listing.id) === key);
  if (index >= 0) state.entries[index] = entry;
  else state.entries.unshift(entry);
  state.ids = state.entries.map((item) => item.listing.id);
}

function removeEntry(state, listingId) {
  state.entries = state.entries.filter((item) => listingKey(item.listing.id) !== listingKey(listingId));
  state.ids = state.entries.map((item) => item.listing.id);
}

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    clearWishlist(state) {
      Object.assign(state, initialState);
    },
  },
  extraReducers(builder) {
    builder
      .addCase(logout, () => initialState)
      .addCase(setCredentials, (state, { payload }) => {
        const newOwnerId = payload.user?.id == null ? null : String(payload.user.id);
        if (state.ownerId !== newOwnerId) Object.assign(state, { ...initialState, ownerId: newOwnerId });
      })
      .addCase(fetchWishlist.pending, (state, { meta }) => {
        const userId = String(meta.arg.userId);
        if (state.ownerId !== userId) Object.assign(state, { ...initialState, ownerId: userId });
        state.loading = true;
        state.error = '';
      })
      .addCase(fetchWishlist.fulfilled, (state, { payload }) => {
        if (state.ownerId !== payload.userId) return;
        state.entries = payload.entries;
        state.ids = payload.entries.map((entry) => entry.listing.id);
        state.loading = false;
        state.error = '';
      })
      .addCase(fetchWishlist.rejected, (state, { meta, payload }) => {
        if (state.ownerId !== String(meta.arg.userId)) return;
        state.loading = false;
        state.error = payload?.message || 'Could not load your wishlist.';
      })
      .addCase(addWishlistItem.pending, (state, { meta }) => {
        const id = listingKey(meta.arg.listingId);
        if (!state.pendingIds.includes(id)) state.pendingIds.push(id);
        state.error = '';
      })
      .addCase(addWishlistItem.fulfilled, (state, { payload }) => {
        if (state.ownerId !== payload.userId) return;
        state.pendingIds = state.pendingIds.filter((id) => id !== listingKey(payload.entry.listing.id));
        upsertEntry(state, payload.entry);
      })
      .addCase(addWishlistItem.rejected, (state, { meta, payload }) => {
        if (state.ownerId !== String(meta.arg.userId)) return;
        const id = listingKey(meta.arg.listingId);
        state.pendingIds = state.pendingIds.filter((pendingId) => pendingId !== id);
        state.error = payload || 'Could not add this listing to your wishlist.';
      })
      .addCase(removeWishlistItem.pending, (state, { meta }) => {
        const id = listingKey(meta.arg.listingId);
        if (!state.pendingIds.includes(id)) state.pendingIds.push(id);
        state.error = '';
      })
      .addCase(removeWishlistItem.fulfilled, (state, { payload }) => {
        if (state.ownerId !== payload.userId) return;
        state.pendingIds = state.pendingIds.filter((id) => id !== payload.listingId);
        removeEntry(state, payload.listingId);
      })
      .addCase(removeWishlistItem.rejected, (state, { meta, payload }) => {
        if (state.ownerId !== String(meta.arg.userId)) return;
        const id = listingKey(meta.arg.listingId);
        state.pendingIds = state.pendingIds.filter((pendingId) => pendingId !== id);
        state.error = payload || 'Could not remove this listing from your wishlist.';
      });
  },
});

export const { clearWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;
