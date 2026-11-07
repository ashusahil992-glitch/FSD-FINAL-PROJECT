import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  deleteNotification,
  fetchNotifications as fetchNotificationsRequest,
  fetchUnreadNotificationCount as fetchUnreadCountRequest,
  markAllNotificationsRead as markAllNotificationsReadRequest,
  markNotificationRead as markNotificationReadRequest,
} from '../services/notificationService.js';

const initialState = {
  ownerId: null,
  items: [],
  unreadCount: 0,
  page: 0,
  pageSize: 20,
  totalItems: 0,
  totalPages: 0,
  loading: false,
  error: '',
};

const ownerKey = (userId) => String(userId);

export const fetchNotifications = createAsyncThunk(
  'notifications/fetch',
  async ({ userId, page = 0, size = 20 }, { rejectWithValue }) => {
    try {
      return { userId: ownerKey(userId), data: await fetchNotificationsRequest({ page, size }) };
    } catch (error) {
      return rejectWithValue(error.userMessage || 'Could not load notifications.');
    }
  },
);

export const fetchNotificationUnreadCount = createAsyncThunk(
  'notifications/fetch-unread-count',
  async ({ userId }, { rejectWithValue }) => {
    try {
      return { userId: ownerKey(userId), count: await fetchUnreadCountRequest() };
    } catch (error) {
      return rejectWithValue(error.userMessage || 'Could not load unread notification count.');
    }
  },
);

export const markNotificationRead = createAsyncThunk(
  'notifications/mark-read',
  async ({ id, userId, page = 0, size = 20 }, { rejectWithValue }) => {
    try {
      return { userId: ownerKey(userId), data: await markNotificationReadRequest(id, { page, size }) };
    } catch (error) {
      return rejectWithValue(error.userMessage || 'Could not mark the notification as read.');
    }
  },
);

export const markAllNotificationsRead = createAsyncThunk(
  'notifications/mark-all-read',
  async ({ userId, page = 0, size = 20 }, { rejectWithValue }) => {
    try {
      return { userId: ownerKey(userId), data: await markAllNotificationsReadRequest({ page, size }) };
    } catch (error) {
      return rejectWithValue(error.userMessage || 'Could not mark notifications as read.');
    }
  },
);

export const removeNotification = createAsyncThunk(
  'notifications/delete',
  async ({ id, userId }, { rejectWithValue }) => {
    try {
      await deleteNotification(id);
      return { id, userId: ownerKey(userId) };
    } catch (error) {
      return rejectWithValue(error.userMessage || 'Could not delete the notification.');
    }
  },
);

const slice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    clearNotifications: () => initialState,
    receiveNotification(state, { payload }) {
      if (state.ownerId == null || state.items.some((item) => item.id === payload.id)) return;
      if (state.page === 0) {
        state.items.unshift(payload);
        if (state.items.length > state.pageSize) state.items.pop();
      }
      if (!payload.readAt) state.unreadCount += 1;
      state.totalItems += 1;
      state.totalPages = Math.ceil(state.totalItems / state.pageSize);
    },
  },
  extraReducers(builder) {
    builder
      .addCase('auth/logout', () => initialState)
      .addCase('auth/setCredentials', (state, action) => {
        const nextOwner = action.payload?.user?.id == null ? null : ownerKey(action.payload.user.id);
        if (state.ownerId !== nextOwner) return { ...initialState, ownerId: nextOwner };
      })
      .addCase(fetchNotifications.pending, (state, action) => {
        const ownerId = ownerKey(action.meta.arg.userId);
        if (state.ownerId !== ownerId) Object.assign(state, { ...initialState, ownerId });
        state.loading = true;
        state.error = '';
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        if (state.ownerId !== action.payload.userId) return;
        Object.assign(state, action.payload.data, { ownerId: action.payload.userId, loading: false, error: '' });
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        if (state.ownerId !== ownerKey(action.meta.arg.userId)) return;
        state.loading = false;
        state.error = action.payload || 'Could not load notifications.';
      })
      .addCase(fetchNotificationUnreadCount.fulfilled, (state, action) => {
        if (state.ownerId === action.payload.userId) state.unreadCount = action.payload.count;
      })
      .addCase(fetchNotificationUnreadCount.rejected, (state, action) => {
        if (state.ownerId === ownerKey(action.meta.arg.userId)) {
          state.error = action.payload || 'Could not load unread notification count.';
        }
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        if (state.ownerId !== action.payload.userId) return;
        Object.assign(state, action.payload.data, { ownerId: action.payload.userId, loading: false });
      })
      .addCase(markNotificationRead.rejected, (state, action) => {
        state.error = action.payload || 'Could not mark the notification as read.';
      })
      .addCase(markAllNotificationsRead.fulfilled, (state, action) => {
        if (state.ownerId !== action.payload.userId) return;
        Object.assign(state, action.payload.data, { ownerId: action.payload.userId, loading: false });
      })
      .addCase(markAllNotificationsRead.rejected, (state, action) => {
        state.error = action.payload || 'Could not mark notifications as read.';
      })
      .addCase(removeNotification.fulfilled, (state, action) => {
        if (state.ownerId !== action.payload.userId) return;
        const removed = state.items.find((item) => item.id === action.payload.id);
        state.items = state.items.filter((item) => item.id !== action.payload.id);
        if (removed && !removed.readAt) state.unreadCount = Math.max(0, state.unreadCount - 1);
        state.totalItems = Math.max(0, state.totalItems - 1);
        state.totalPages = Math.ceil(state.totalItems / state.pageSize);
      })
      .addCase(removeNotification.rejected, (state, action) => {
        state.error = action.payload || 'Could not delete the notification.';
      });
  },
});

export const { clearNotifications, receiveNotification } = slice.actions;
export default slice.reducer;
