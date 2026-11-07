import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAppStore } from '../redux/store.js';
import Services from '../pages/Services.jsx';
import { fetchCategories } from '../services/categoryService.js';
import { searchListings } from '../services/listingService.js';

vi.mock('../services/categoryService.js', () => ({
  fetchCategories: vi.fn(),
}));

vi.mock('../services/listingService.js', () => ({
  searchListings: vi.fn(),
}));

describe('Student services directory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchCategories).mockResolvedValue([
      { id: 1, name: 'Tutoring', slug: 'services-tutoring', parentName: 'Services' },
      { id: 2, name: 'Books', slug: 'academic-books', parentName: 'Academic' },
    ]);
    vi.mocked(searchListings).mockResolvedValue({
      items: [{
        id: 31,
        title: 'Calculus tutoring',
        description: 'Peer help with calculus.',
        price: 0,
        listingType: 'SERVICE',
        category: { name: 'Tutoring', icon: '📚' },
        seller: { name: 'Campus tutor' },
      }],
      page: 0,
      size: 12,
      totalElements: 1,
      totalPages: 1,
      first: true,
      last: true,
    });
  });

  it('shows service listings and searches within the selected service category', async () => {
    render(
      <Provider store={createAppStore()}>
        <MemoryRouter><Services /></MemoryRouter>
      </Provider>,
    );

    expect(await screen.findByRole('heading', { name: 'Student services' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Calculus tutoring' })).toBeInTheDocument();
    await waitFor(() => expect(searchListings).toHaveBeenCalledWith(expect.objectContaining({
      listingType: 'SERVICE',
      size: 12,
      category: undefined,
    })));

    fireEvent.change(screen.getByLabelText('Filter services by category'), {
      target: { value: 'services-tutoring' },
    });
    await waitFor(() => expect(searchListings).toHaveBeenLastCalledWith(expect.objectContaining({
      listingType: 'SERVICE',
      category: 'services-tutoring',
      page: 0,
    })));
    expect(screen.getByRole('link', { name: 'Offer a service' })).toHaveAttribute('href', '/services/new');
  });
});
