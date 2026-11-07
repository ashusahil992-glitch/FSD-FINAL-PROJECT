import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import authReducer, { setCredentials } from '../redux/authSlice.js';
import notificationReducer from '../redux/notificationSlice.js';
import Messages from '../pages/Messages.jsx';
import NotificationBell from '../components/NotificationBell.jsx';
import {
  fetchConversations,
  fetchMessages,
  sendMessage,
} from '../services/messagingService.js';
import { fetchNotifications, markNotificationRead } from '../services/notificationService.js';

vi.mock('../services/messagingService.js', () => ({
  fetchConversations: vi.fn(),
  startConversation: vi.fn(),
  fetchMessages: vi.fn(),
  sendMessage: vi.fn(),
}));

vi.mock('../services/notificationService.js', () => ({
  fetchNotifications: vi.fn(),
  fetchUnreadNotificationCount: vi.fn(),
  markNotificationRead: vi.fn(),
  markAllNotificationsRead: vi.fn(),
  deleteNotification: vi.fn(),
  connectNotificationStream: vi.fn(),
}));

const conversation = {
  id: 33,
  listingId: 8,
  listingTitle: 'Used Physics Textbook',
  otherParticipantId: 4,
  otherParticipantName: 'Seller Student',
  lastMessage: 'Is this available?',
  updatedAt: '2026-10-09T15:00:00Z',
};

function renderWithAccount(ui, path = '/') {
  const store = configureStore({ reducer: { auth: authReducer, notifications: notificationReducer } });
  store.dispatch(setCredentials({
    token: 'test-token',
    user: { id: 21, fullName: 'Buyer Student', email: 'buyer@example.test' },
  }));
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/messages/:conversationId?" element={ui} />
          <Route path="*" element={ui} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}

describe('Messaging and notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchConversations).mockResolvedValue([conversation]);
    vi.mocked(fetchMessages).mockResolvedValue([
      {
        id: 51,
        conversationId: 33,
        senderId: 4,
        senderName: 'Seller Student',
        content: 'Yes, it is available.',
        createdAt: '2026-10-09T15:00:00Z',
      },
    ]);
  });

  it('loads a chat, sends a message, and refreshes its conversation', async () => {
    vi.mocked(sendMessage).mockResolvedValue({ id: 52 });
    renderWithAccount(<Messages />, '/messages/33');

    expect(await screen.findByText('Yes, it is available.')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Write a message'), { target: { value: 'Thanks, when can we meet?' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => expect(sendMessage).toHaveBeenCalledWith('33', 'Thanks, when can we meet?'));
    expect(fetchMessages).toHaveBeenCalledWith('33');
  });

  it('shows notification count and marks the notification read when opened', async () => {
    vi.mocked(fetchNotifications).mockResolvedValue({
      unreadCount: 1,
      items: [{
        id: 70,
        title: 'New message',
        message: 'New message from Seller Student',
        conversationId: 33,
        listingId: 8,
        listingTitle: 'Used Physics Textbook',
        createdAt: '2026-10-09T15:00:00Z',
        readAt: null,
      }],
    });
    vi.mocked(markNotificationRead).mockResolvedValue({ unreadCount: 0, items: [], page: 0, pageSize: 8, totalItems: 1, totalPages: 1 });
    renderWithAccount(<NotificationBell />);

    const button = screen.getByRole('button', { name: 'Notifications' });
    fireEvent.click(button);
    fireEvent.click(await screen.findByRole('link', { name: /New message from Seller Student/ }));

    expect(await screen.findByRole('button', { name: 'Notifications, 1 unread' })).toBeInTheDocument();
    await waitFor(() => expect(markNotificationRead).toHaveBeenCalledWith(70, { page: 0, size: 8 }));
  });
});
