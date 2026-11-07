import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import authReducer, { logout } from '../redux/authSlice.js';
import notificationReducer, { receiveNotification } from '../redux/notificationSlice.js';
import Notifications from '../pages/Notifications.jsx';
import {
  deleteNotification,
  fetchNotifications,
  markAllNotificationsRead,
} from '../services/notificationService.js';

vi.mock('../services/notificationService.js', () => ({
  fetchNotifications: vi.fn(),
  fetchUnreadNotificationCount: vi.fn(),
  markNotificationRead: vi.fn(),
  markAllNotificationsRead: vi.fn(),
  deleteNotification: vi.fn(),
  connectNotificationStream: vi.fn(),
}));

const savedNotification = {
  id: 44,
  title: 'Verification approved',
  message: 'Your student verification has been approved.',
  type: 'STUDENT_VERIFICATION',
  targetUrl: '/verification',
  createdAt: '2026-10-09T15:00:00Z',
  readAt: null,
};

function createStore() {
  return configureStore({
    reducer: { auth: authReducer, notifications: notificationReducer },
    preloadedState: {
      auth: { token: 'student-token', user: { id: 17 } },
      notifications: {
        ownerId: '17',
        items: [savedNotification],
        unreadCount: 1,
        page: 0,
        pageSize: 20,
        totalItems: 1,
        totalPages: 1,
        loading: false,
        error: '',
      },
    },
  });
}

describe('Notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchNotifications).mockResolvedValue({
      items: [savedNotification],
      unreadCount: 1,
      page: 0,
      pageSize: 20,
      totalItems: 1,
      totalPages: 1,
    });
    vi.mocked(markAllNotificationsRead).mockResolvedValue({
      items: [{ ...savedNotification, readAt: '2026-10-10T12:00:00Z' }],
      unreadCount: 0,
      page: 0,
      pageSize: 20,
      totalItems: 1,
      totalPages: 1,
    });
    vi.mocked(deleteNotification).mockResolvedValue(undefined);
  });

  it('renders history and supports marking all read and deletion', async () => {
    const store = createStore();
    render(<Provider store={store}><MemoryRouter><Notifications /></MemoryRouter></Provider>);

    expect(await screen.findByText('Verification approved')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Mark all as read' }));
    await waitFor(() => expect(markAllNotificationsRead).toHaveBeenCalledWith({ page: 0, size: 20 }));
    fireEvent.click(screen.getByRole('button', { name: 'Delete Verification approved' }));
    await waitFor(() => expect(deleteNotification).toHaveBeenCalledWith(44));
    await waitFor(() => expect(screen.getByText('You’re all caught up')).toBeInTheDocument());
  });

  it('deduplicates realtime notifications and clears them at logout', () => {
    const store = createStore();
    store.dispatch(receiveNotification({ ...savedNotification, id: 45 }));
    store.dispatch(receiveNotification({ ...savedNotification, id: 45 }));
    expect(store.getState().notifications.items).toHaveLength(2);
    expect(store.getState().notifications.unreadCount).toBe(2);
    store.dispatch(logout());
    expect(store.getState().notifications.items).toEqual([]);
    expect(store.getState().notifications.ownerId).toBeNull();
  });
});
