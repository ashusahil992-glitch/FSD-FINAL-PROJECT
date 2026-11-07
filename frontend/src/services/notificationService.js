import api from './api.js';

export async function fetchNotifications({ page = 0, size = 20 } = {}) {
  const { data } = await api.get('/notifications', { params: { page, size } });
  return data.data;
}

export async function fetchUnreadNotificationCount() {
  const { data } = await api.get('/notifications/unread-count');
  return data.data.count;
}

export async function markNotificationRead(notificationId, { page = 0, size = 20 } = {}) {
  const { data } = await api.patch(`/notifications/${notificationId}/read`, null, { params: { page, size } });
  return data.data;
}

export async function markAllNotificationsRead({ page = 0, size = 20 } = {}) {
  const { data } = await api.patch('/notifications/read-all', null, { params: { page, size } });
  return data.data;
}

export async function deleteNotification(notificationId) {
  await api.delete(`/notifications/${notificationId}`);
}

const delay = (milliseconds, signal) => new Promise((resolve) => {
  if (signal.aborted) {
    resolve();
    return;
  }
  const finish = () => {
    window.clearTimeout(timeout);
    signal.removeEventListener('abort', finish);
    resolve();
  };
  const timeout = window.setTimeout(finish, milliseconds);
  signal.addEventListener('abort', finish, { once: true });
});

export async function connectNotificationStream(token, onNotification, signal) {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
  let retryDelay = 1000;

  while (!signal.aborted) {
    try {
      const response = await fetch(`${baseUrl}/notifications/stream`, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'text/event-stream' },
        signal,
      });
      if (!response.ok || !response.body) {
        throw new Error(`Notification stream returned ${response.status}.`);
      }

      retryDelay = 1000;
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (!signal.aborted) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let boundary;
        while ((boundary = buffer.indexOf('\n\n')) !== -1) {
          const block = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);
          const data = block.split(/\r?\n/)
            .filter((line) => line.startsWith('data:'))
            .map((line) => line.slice(5).trim())
            .join('\n');
          if (data) onNotification(JSON.parse(data));
        }
      }
    } catch (error) {
      if (signal.aborted) return;
    }

    if (!signal.aborted) {
      await delay(retryDelay, signal);
      retryDelay = Math.min(retryDelay * 2, 30000);
    }
  }
}
