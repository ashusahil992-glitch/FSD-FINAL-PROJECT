import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import authReducer from '../redux/authSlice.js';
import AdminDashboard from '../pages/AdminDashboard.jsx';
import {
  fetchAdminDashboard,
  fetchAdminListings,
  fetchAdminReports,
  fetchAdminUsers,
  fetchAdminVerifications,
  fetchAdminVerificationDocument,
  fetchAdminVerificationHistory,
  reviewAdminVerification,
} from '../services/adminService.js';

vi.mock('../services/adminService.js', () => ({
  fetchAdminDashboard: vi.fn(),
  fetchAdminUsers: vi.fn(),
  fetchAdminListings: vi.fn(),
  fetchAdminReports: vi.fn(),
  fetchAdminVerifications: vi.fn(),
  fetchAdminVerificationDocument: vi.fn(),
  fetchAdminVerificationHistory: vi.fn(),
  reviewAdminVerification: vi.fn(),
  suspendUser: vi.fn(),
  reinstateUser: vi.fn(),
  moderateListing: vi.fn(),
  reviewReport: vi.fn(),
}));

const dashboard = {
  totalUsers: 12,
  pendingStudentVerification: 2,
  verifiedStudents: 8,
  suspendedUsers: 1,
  totalListings: 17,
  availableListings: 15,
  removedListings: 1,
  openReports: 1,
};

function renderDashboard(role) {
  const store = configureStore({ reducer: { auth: authReducer } });
  store.dispatch({
    type: 'auth/setCredentials',
    payload: { token: 'admin-test-token', user: { id: 1, fullName: 'Admin', role } },
  });
  render(<Provider store={store}><MemoryRouter><AdminDashboard /></MemoryRouter></Provider>);
}

describe('Admin dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchAdminDashboard).mockResolvedValue(dashboard);
    vi.mocked(fetchAdminUsers).mockResolvedValue([{
      id: 8,
      fullName: 'Pending Student',
      email: 'student@example.test',
      maskedStudentId: '****1234',
      university: 'Campus University',
      role: 'STUDENT',
      status: 'PENDING_STUDENT_VERIFICATION',
      studentVerified: false,
      emailVerified: false,
    }]);
    vi.mocked(fetchAdminListings).mockResolvedValue([]);
    vi.mocked(fetchAdminReports).mockResolvedValue([]);
    vi.mocked(fetchAdminVerifications).mockResolvedValue([{
      id: 18,
      studentId: 8,
      studentName: 'Pending Student',
      university: 'Campus University',
      maskedStudentId: '****1234',
      status: 'PENDING',
      submittedAt: '2026-10-10T10:00:00Z',
      rejectionReason: null,
    }]);
    vi.mocked(fetchAdminVerificationHistory).mockResolvedValue([]);
    vi.mocked(reviewAdminVerification).mockResolvedValue({ id: 18, status: 'VERIFIED' });
  });

  it('loads verification requests and approves only through request review', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderDashboard('ADMIN');
    expect(await screen.findAllByText('Pending Student')).toHaveLength(2);
    expect(screen.getByText('12')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Approve' }));

    await waitFor(() => expect(reviewAdminVerification).toHaveBeenCalledWith(18, 'VERIFIED', ''));
    expect(fetchAdminDashboard).toHaveBeenCalledTimes(2);
  });

  it('does not request or display admin data for a student role', () => {
    renderDashboard('STUDENT');
    expect(screen.getByRole('heading', { name: 'Admin access required' })).toBeInTheDocument();
    expect(fetchAdminDashboard).not.toHaveBeenCalled();
  });
});
