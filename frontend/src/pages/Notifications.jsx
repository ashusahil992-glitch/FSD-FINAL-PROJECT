import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  removeNotification,
} from '../redux/notificationSlice.js';

function formatDate(value) {
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function notificationLink(notification) {
  return notification.targetUrl
    || (notification.conversationId ? `/messages/${notification.conversationId}` : '/notifications');
}

export default function Notifications() {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);
  const userId = useSelector((state) => state.auth.user?.id);
  const { items, unreadCount, page, totalPages, totalItems, loading, error } = useSelector((state) => state.notifications);

  function deleteItem(id) {
    dispatch(removeNotification({ id, userId })).then((result) => {
      if (!result.error && items.length === 1 && page > 0) {
        dispatch(fetchNotifications({ userId, page: page - 1, size: 20 }));
      }
    });
  }

  useEffect(() => {
    if (token && userId != null) dispatch(fetchNotifications({ userId, page: 0, size: 20 }));
  }, [dispatch, token, userId]);

  if (!token) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-12">
        <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
        <p className="mt-3 text-slate-600">Sign in to view your notifications.</p>
        <Link className="mt-4 inline-flex text-indigo-700 underline" to="/login?next=%2Fnotifications">Sign in</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-700">Your account</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Notifications</h1>
          <p className="mt-2 text-sm text-slate-600">{unreadCount} unread · {totalItems} total</p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => dispatch(markAllNotificationsRead({ userId, page, size: 20 }))}
            className="btn-secondary"
          >
            Mark all as read
          </button>
        )}
      </header>

      {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      {loading && items.length === 0 && <p role="status" className="py-12 text-center text-slate-500">Loading notifications…</p>}
      {!loading && !error && items.length === 0 && (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <h2 className="text-lg font-semibold text-slate-900">You’re all caught up</h2>
          <p className="mt-2 text-sm text-slate-600">Updates about messages, listings, and verification will appear here.</p>
        </section>
      )}
      {items.length > 0 && (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {items.map((notification) => (
            <li key={notification.id} className={`flex items-start gap-3 p-4 sm:p-5 ${notification.readAt ? '' : 'bg-indigo-50/50'}`}>
              <Link
                to={notificationLink(notification)}
                onClick={() => {
                  if (!notification.readAt) dispatch(markNotificationRead({ id: notification.id, userId, page, size: 20 }));
                }}
                className="min-w-0 flex-1"
              >
                <span className="flex items-center gap-2">
                  {!notification.readAt && <span className="h-2 w-2 shrink-0 rounded-full bg-indigo-600" aria-label="Unread" />}
                  <strong className="truncate text-sm font-semibold text-slate-900">{notification.title || notification.message}</strong>
                </span>
                <span className="mt-1 block text-sm text-slate-600">{notification.message}</span>
                <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                  <span>{notification.type.replaceAll('_', ' ')}</span>
                  <time dateTime={notification.createdAt}>{formatDate(notification.createdAt)}</time>
                </span>
              </Link>
              <button
                type="button"
                aria-label={`Delete ${notification.title || 'notification'}`}
                onClick={() => deleteItem(notification.id)}
                className="shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-700"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <nav className="mt-5 flex items-center justify-between" aria-label="Notification pages">
          <button
            type="button"
            disabled={page <= 0 || loading}
            onClick={() => dispatch(fetchNotifications({ userId, page: page - 1, size: 20 }))}
            className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-slate-600">Page {page + 1} of {totalPages}</span>
          <button
            type="button"
            disabled={page + 1 >= totalPages || loading}
            onClick={() => dispatch(fetchNotifications({ userId, page: page + 1, size: 20 }))}
            className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </nav>
      )}
    </main>
  );
}
