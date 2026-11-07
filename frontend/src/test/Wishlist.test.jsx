import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import authReducer, { logout, setCredentials } from '../redux/authSlice.js';
import wishlistReducer from '../redux/wishlistSlice.js';
import Wishlist from '../pages/Wishlist.jsx';
import {
  fetchWishlist as fetchWishlistRequest,
  removeWishlistItem as removeWishlistItemRequest,
} from '../services/wishlistService.js';

vi.mock('../services/wishlistService.js', () => ({
  fetchWishlist: vi.fn(),
  addWishlistItem: vi.fn(),
  removeWishlistItem: vi.fn(),
  checkWishlistItem: vi.fn(),
}));

describe('Wishlist page', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(fetchWishlistRequest).mockResolvedValue([]);
    vi.mocked(removeWishlistItemRequest).mockResolvedValue(undefined);
  });

  it('shows unavailable saved listings and removes them through the server', async () => {
    const listing = {
      id: 33,
      title: 'Sold biology textbook',
      status: 'SOLD',
      price: 250,
      category: { name: 'Books', icon: '📚' },
      studentDiscountAvailable: false,
    };
    const store = configureStore({
      reducer: { auth: authReducer, wishlist: wishlistReducer },
      preloadedState: {
        auth: { token: 'student-token', user: { id: 14 } },
        wishlist: {
          ids: [33],
          entries: [{ id: 3, available: false, listing }],
          ownerId: '14',
          loading: false,
          error: '',
          pendingIds: [],
        },
      },
    });

    render(<Provider store={store}><MemoryRouter><Wishlist /></MemoryRouter></Provider>);

    expect(screen.getByText('No longer available')).toBeInTheDocument();
    expect(screen.getByText('This listing has been sold or removed.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));

    await waitFor(() => expect(removeWishlistItemRequest).toHaveBeenCalledWith(33));
    await waitFor(() => expect(screen.getByText('Your wishlist is empty')).toBeInTheDocument());
  });

  it('clears private IDs at logout and replaces entries when another user signs in', async () => {
    const store = configureStore({ reducer: { auth: authReducer, wishlist: wishlistReducer } });
    store.dispatch(setCredentials({ token: 'first-token', user: { id: 21 } }));
    store.dispatch({
      type: 'wishlist/fetch/fulfilled',
      payload: {
        userId: '21',
        entries: [{ id: 8, listing: { id: 55, title: 'Private saved listing' } }],
      },
    });
    expect(store.getState().wishlist.ids).toEqual([55]);

    store.dispatch(logout());
    expect(store.getState().wishlist.ids).toEqual([]);
    expect(store.getState().wishlist.ownerId).toBeNull();

    store.dispatch(setCredentials({ token: 'second-token', user: { id: 22 } }));
    expect(store.getState().wishlist.ids).toEqual([]);
    await store.dispatch({ type: 'wishlist/fetch/pending', meta: { arg: { userId: 22 } } });
    await store.dispatch({
      type: 'wishlist/fetch/fulfilled',
      payload: {
        userId: '22',
        entries: [{ id: 9, listing: { id: 66, title: 'Second user saved listing' } }],
      },
    });
    expect(store.getState().wishlist.ids).toEqual([66]);
  });
});
