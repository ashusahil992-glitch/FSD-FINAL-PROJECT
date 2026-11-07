import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import authReducer from '../redux/authSlice.js';
import AuthPage from '../pages/AuthPage.jsx';
import { loginAccount, registerAccount, submitVerificationDocument } from '../services/authService.js';
import { fetchUniversities } from '../services/universityService.js';

vi.mock('../services/authService.js', () => ({
  loginAccount: vi.fn(),
  registerAccount: vi.fn(),
  submitVerificationDocument: vi.fn(),
}));

vi.mock('../services/universityService.js', () => ({
  fetchUniversities: vi.fn(),
}));

const authResponse = {
  accessToken: 'test-access-token',
  user: {
    id: 15,
    fullName: 'Campus Student',
    email: 'student@example.test',
    maskedStudentId: '****4567',
    role: 'STUDENT',
    status: 'PENDING_STUDENT_VERIFICATION',
    emailVerified: false,
    studentVerified: false,
  },
};

function renderAuth(path) {
  const store = configureStore({ reducer: { auth: authReducer } });
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route path="/verification" element={<h1>Verification status page</h1>} />
          <Route path="/" element={<h1>Marketplace home</h1>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
  return store;
}

describe('Authentication pages', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.mocked(fetchUniversities).mockResolvedValue([
      { id: 1, name: 'Demo Institute of Technology', city: 'Chandigarh' },
    ]);
    vi.mocked(submitVerificationDocument).mockResolvedValue({ status: 'PENDING' });
  });

  it('registers a pending student account and stores the returned session', async () => {
    vi.mocked(registerAccount).mockResolvedValue(authResponse);
    const store = renderAuth('/register');

    fireEvent.change(await screen.findByLabelText('Full name'), { target: { value: 'Campus Student' } });
    fireEvent.change(screen.getByLabelText('University'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Student ID'), { target: { value: 'STU-4567' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'student@example.test' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'safe-password-123' } });
    const document = new File(['%PDF-1.7'], 'student-card.pdf', { type: 'application/pdf' });
    const documentInput = screen.getByLabelText('University ID document');
    Object.defineProperty(documentInput, 'files', { configurable: true, value: [document] });
    fireEvent.change(documentInput);
    fireEvent.submit(screen.getByRole('button', { name: 'Create student account' }).closest('form'));

    await screen.findByRole('heading', { name: 'Verification status page' });
    expect(registerAccount).toHaveBeenCalledWith({
      fullName: 'Campus Student',
      email: 'student@example.test',
      password: 'safe-password-123',
      studentId: 'STU-4567',
      universityId: 1,
    });
    expect(submitVerificationDocument).toHaveBeenCalledWith(document, 'test-access-token');
    expect(store.getState().auth.token).toBe('test-access-token');
    expect(JSON.parse(localStorage.getItem('campusbazaar_user')).maskedStudentId).toBe('****4567');
  });

  it('logs in and displays API errors for invalid credentials', async () => {
    vi.mocked(loginAccount).mockRejectedValueOnce(Object.assign(new Error('Invalid email or password.'), {
      userMessage: 'Invalid email or password.',
    }));
    renderAuth('/login');

    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'student@example.test' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong-password' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password.');

    vi.mocked(loginAccount).mockResolvedValueOnce(authResponse);
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'safe-password-123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Marketplace home' })).toBeInTheDocument());
    expect(loginAccount).toHaveBeenLastCalledWith({
      email: 'student@example.test',
      password: 'safe-password-123',
    });
  });
});
