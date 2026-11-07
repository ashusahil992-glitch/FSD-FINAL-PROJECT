import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import HostelClearance from '../pages/HostelClearance.jsx';
import { searchListings } from '../services/listingService.js';
import { createAppStore } from '../redux/store.js';

vi.mock('../services/listingService.js', () => ({
  searchListings: vi.fn(),
}));

describe('Hostel clearance workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads real clearance listings from the filtered marketplace API and links to publish', async () => {
    vi.mocked(searchListings).mockResolvedValue({
      items: [],
      page: 0,
      totalPages: 0,
      totalElements: 0,
    });

    render(
      <Provider store={createAppStore()}>
        <MemoryRouter><HostelClearance /></MemoryRouter>
      </Provider>,
    );

    expect(await screen.findByText('No hostel-clearance items yet')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'List a hostel item' })).toHaveAttribute('href', '/hostel-clearance/new');
    await waitFor(() => expect(searchListings).toHaveBeenCalledWith({
      hostelClearanceOnly: true,
      sort: 'newest',
      page: 0,
      size: 12,
    }));
  });
});
