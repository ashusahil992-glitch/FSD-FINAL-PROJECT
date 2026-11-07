import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice.js';
import wishlistReducer from './wishlistSlice.js';
import notificationReducer from './notificationSlice.js';

export function createAppStore() {
  return configureStore({
    reducer: { auth: authReducer, wishlist: wishlistReducer, notifications: notificationReducer },
  });
}

const store = createAppStore();
export default store;
