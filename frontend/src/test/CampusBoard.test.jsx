import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CampusBoard from '../pages/CampusBoard.jsx';
import authReducer, { setCredentials } from '../redux/authSlice.js';
import {
  createCampusPost,
  fetchCampusPosts,
} from '../services/campusBoardService.js';

vi.mock('../services/campusBoardService.js', () => ({
  createCampusPost: vi.fn(),
  deleteCampusPost: vi.fn(),
  fetchCampusPosts: vi.fn(),
  resolveCampusPost: vi.fn(),
}));

function renderBoard(user = null) {
  const store = configureStore({ reducer: { auth: authReducer } });
  if (user) store.dispatch(setCredentials({ token: 'student-token', user }));
  return render(
    <Provider store={store}>
      <MemoryRouter>
        <CampusBoard />
      </MemoryRouter>
    </Provider>,
  );
}

describe('Campus board', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchCampusPosts).mockResolvedValue([]);
    vi.mocked(createCampusPost).mockResolvedValue({});
  });

  it('loads the signed-in student’s university posts and filters by post type', async () => {
    vi.mocked(fetchCampusPosts).mockResolvedValue([
      {
        id: 1,
        authorId: 8,
        title: 'Found a water bottle',
        description: 'Blue bottle near the library.',
        location: 'Library entrance',
        type: 'FOUND',
        status: 'OPEN',
        authorName: 'Campus student',
        authorVerified: true,
        universityName: 'Demo Institute of Technology',
        createdAt: '2026-10-01T10:00:00Z',
      },
      {
        id: 2,
        authorId: 8,
        title: 'Club meetup',
        description: 'Meet us at the student centre.',
        location: 'Student centre',
        type: 'ANNOUNCEMENT',
        status: 'OPEN',
        authorName: 'Campus student',
        authorVerified: true,
        universityName: 'Demo Institute of Technology',
        createdAt: '2026-10-01T10:00:00Z',
      },
    ]);
    renderBoard({ id: 8, universityId: 5, university: 'Demo Institute of Technology' });

    expect(await screen.findByRole('heading', { name: 'Found a water bottle' })).toBeInTheDocument();
    expect(fetchCampusPosts).toHaveBeenCalledWith();
    fireEvent.change(screen.getByRole('combobox', { name: 'Filter campus posts' }), {
      target: { value: 'ANNOUNCEMENT' },
    });
    expect(screen.getByRole('heading', { name: 'Club meetup' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Found a water bottle' })).not.toBeInTheDocument();
  });

  it('creates a campus notice using the authenticated account', async () => {
    renderBoard({ id: 8, universityId: 5, university: 'Demo Institute of Technology' });
    fireEvent.change(await screen.findByLabelText('Post type'), { target: { value: 'LOST' } });
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Lost student ID card' } });
    fireEvent.change(screen.getByLabelText('Details'), { target: { value: 'Lost after the afternoon lecture.' } });
    fireEvent.change(screen.getByLabelText('Campus location'), { target: { value: 'Science block' } });
    fireEvent.click(screen.getByRole('button', { name: 'Publish post' }));

    await waitFor(() => expect(createCampusPost).toHaveBeenCalledWith({
      title: 'Lost student ID card',
      description: 'Lost after the afternoon lecture.',
      location: 'Science block',
      type: 'LOST',
    }));
  });
});
