import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';
import { clearWishlist, fetchWishlist } from '../redux/wishlistSlice.js';
import {
  clearNotifications,
  fetchNotificationUnreadCount,
  fetchNotifications,
  receiveNotification,
} from '../redux/notificationSlice.js';
import { connectNotificationStream } from '../services/notificationService.js';

export default function Layout() {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);
  const userId = useSelector((state) => state.auth.user?.id);

  useEffect(() => {
    if (!token || userId == null) {
      dispatch(clearWishlist());
      dispatch(clearNotifications());
      return undefined;
    }

    dispatch(fetchWishlist({ userId }));
    dispatch(fetchNotifications({ userId }));
    const abortController = new AbortController();
    connectNotificationStream(token, (notification) => {
      dispatch(receiveNotification(notification));
    }, abortController.signal);
    const refreshTimer = window.setInterval(() => {
      dispatch(fetchNotificationUnreadCount({ userId }));
    }, 30000);

    return () => {
      abortController.abort();
      window.clearInterval(refreshTimer);
    };
  }, [dispatch, token, userId]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
