import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from '../redux/notificationSlice.js';

function notificationLink(notification) {
  return notification.targetUrl
    || (notification.conversationId ? `/messages/${notification.conversationId}` : '/notifications');
}

export default function NotificationBell() {
  const dispatch = useDispatch();
  const userId = useSelector((state) => state.auth.user?.id);
  const token = useSelector((state) => state.auth.token);
  const { items, unreadCount, loading, error } = useSelector((state) => state.notifications);
  const [open, setOpen] = useState(false);

  if (!token) return null;

  function toggle() {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (nextOpen && userId != null) dispatch(fetchNotifications({ userId, page: 0, size: 8 }));
  }

  function markRead(notification) {
    if (!notification.readAt && userId != null) {
      dispatch(markNotificationRead({ id: notification.id, userId, page: 0, size: 8 }));
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ''}`}
        aria-expanded={open}
        onClick={toggle}
        className="relative rounded-xl border border-slate-200 px-3 py-2.5 text-slate-700 hover:bg-slate-50"
      >
        <span aria-hidden="true">♢</span>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <section className="absolute right-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-3 shadow-xl" aria-label="Notifications">
          <div className="flex items-center justify-between gap-3 px-2 py-1">
            <h2 className="font-semibold text-slate-900">Notifications</h2>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => dispatch(markAllNotificationsRead({ userId, page: 0, size: 8 }))}
                className="text-xs font-semibold text-indigo-700 hover:text-indigo-900"
              >
                Mark all read
              </button>
            )}
          </div>
          {error && <p role="alert" className="px-2 py-3 text-sm text-red-700">{error}</p>}
          {loading && items.length === 0 && <p className="px-2 py-4 text-sm text-slate-500">Loading notifications…</p>}
          {!loading && !error && items.length === 0 && (
            <p className="px-2 py-5 text-sm text-slate-500">You’re all caught up.</p>
          )}
          <ul className="mt-2 max-h-80 overflow-y-auto">
            {items.slice(0, 8).map((notification) => (
              <li key={notification.id}>
                <Link
                  to={notificationLink(notification)}
                  onClick={() => markRead(notification)}
                  className={`block rounded-xl px-3 py-3 hover:bg-slate-50 ${notification.readAt ? '' : 'bg-indigo-50/70'}`}
                >
                  <span className="flex items-start gap-2 text-sm font-medium text-slate-800">
                    {!notification.readAt && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-600" aria-label="Unread" />}
                    <span>{notification.title || notification.message}</span>
                  </span>
                  <span className="mt-1 block line-clamp-2 text-xs text-slate-600">{notification.message}</span>
                  <time className="mt-1 block text-[11px] text-slate-400" dateTime={notification.createdAt}>
                    {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(notification.createdAt))}
                  </time>
                </Link>
              </li>
            ))}
          </ul>
          <Link to="/notifications" onClick={() => setOpen(false)} className="mt-2 block rounded-lg px-3 py-2 text-center text-sm font-semibold text-indigo-700 hover:bg-indigo-50">
            View all
          </Link>
        </section>
      )}
    </div>
  );
}
