import { createSlice } from '@reduxjs/toolkit';

const TOKEN_KEY = 'campusbazaar_token';
const USER_KEY = 'campusbazaar_user';

function loadUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
}

const authSlice = createSlice({
  name: 'auth',
  initialState: { token: localStorage.getItem(TOKEN_KEY), user: loadUser() },
  reducers: {
    setCredentials(state, { payload }) {
      state.token = payload.token;
      state.user = payload.user;
      localStorage.setItem(TOKEN_KEY, payload.token);
      localStorage.setItem(USER_KEY, JSON.stringify(payload.user));
    },
    logout(state) {
      state.token = null;
      state.user = null;
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export const TOKEN_STORAGE_KEY = TOKEN_KEY;
export default authSlice.reducer;
