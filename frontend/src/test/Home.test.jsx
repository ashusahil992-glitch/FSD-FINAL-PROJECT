import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Home from '../pages/Home.jsx';
import { fetchListings, searchListings } from '../services/listingService.js';
import { createAppStore } from '../redux/store.js';
import { setCredentials } from '../redux/authSlice.js';
import { fetchWishlist as fetchWishlistThunk } from '../redux/wishlistSlice.js';
import { addWishlistItem as addWishlistItemRequest, fetchWishlist as fetchWishlistRequest } from '../services/wishlistService.js';

vi.mock('../services/listingService.js', () => ({
  fetchListings: vi.fn(),
  searchListings: vi.fn(),
}));

vi.mock('../services/wishlistService.js', () => ({
  fetchWishlist: vi.fn(),
  addWishlistItem: vi.fn(),
  removeWishlistItem: vi.fn(),
  checkWishlistItem: vi.fn(),
}));

const listings = [
  {
    id: 1,
    title: 'Engineering Mathematics textbook',
    description: 'Clean pages, lightly used.',
    price: 450,
    condition: 'GOOD',
    listingType: 'SALE',
    imageUrl: 'https://example.test/book.jpg',
    category: { name: 'Academic', slug: 'academic', icon: '📚' },
    seller: { name: 'Demo seller', verified: true },
    demo: true,
    popular: true,
    studentDeal: true,
    studentDiscountAvailable: true,
    studentDiscountEligible: false,
    studentDiscountedPrice: null,
    discountPercentage: null,
    amountSaved: null,
    hostelClearance: false,
  },
  {
    id: 2,
    title: 'Free badminton racket',
    description: 'Take it to your next game.',
    price: 0,
    condition: 'FAIR',
    listingType: 'GIVEAWAY',
    imageUrl: null,
    category: { name: 'Sports & Fitness', slug: 'sports-and-fitness', icon: '🏸' },
    seller: { name: 'Campus student', verified: true },
    demo: true,
    popular: false,
    studentDeal: false,
    studentDiscountAvailable: false,
    studentDiscountEligible: false,
    studentDiscountedPrice: null,
    discountPercentage: null,
    amountSaved: null,
    hostelClearance: false,
  },
];

function renderHome(store = createAppStore()) {
  return render(<Provider store={store}><MemoryRouter><Home /></MemoryRouter></Provider>);
}

describe('Home marketplace', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(fetchListings).mockResolvedValue(listings);
    vi.mocked(searchListings).mockImplementation(async ({ q, listingType, page, studentDiscountsOnly }) => {
      const items = studentDiscountsOnly
        ? listings.filter((listing) => listing.studentDiscountAvailable)
        : listingType === 'GIVEAWAY' ? [listings[1]] : q ? [listings[0]] : listings;
      return {
        items,
        page,
        size: 8,
        totalElements: items.length,
        totalPages: 1,
        first: page === 0,
        last: true,
      };
    });
    vi.mocked(addWishlistItemRequest).mockImplementation(async (id) => ({
      id: 21,
      addedAt: '2026-10-01T10:00:00Z',
      available: true,
      listing: { ...listings.find((listing) => String(listing.id) === String(id)), status: 'AVAILABLE' },
    }));
    vi.mocked(fetchWishlistRequest).mockResolvedValue([]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders product records from the listings service without public health details', async () => {
    renderHome();
    expect(await screen.findByRole('heading', { name: 'Recently Listed' })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { name: 'Engineering Mathematics textbook' }).length).toBeGreaterThan(0);
    expect(screen.queryByText(/backend connection/i)).not.toBeInTheDocument();
    expect(screen.getAllByText('Demo listing').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Verified student').length).toBeGreaterThan(0);

    const dealsSection = screen.getByRole('region', { name: 'Student Deals' });
    expect(within(dealsSection).getByRole('heading', { name: 'Engineering Mathematics textbook' })).toBeInTheDocument();
    expect(within(dealsSection).getByText('Student discount')).toBeInTheDocument();
    expect(within(dealsSection).getByText('Verify your student account to unlock student pricing.')).toBeInTheDocument();
    expect(within(dealsSection).queryByRole('heading', { name: 'Free badminton racket' })).not.toBeInTheDocument();
    expect(searchListings).toHaveBeenCalledWith(expect.objectContaining({
      studentDiscountsOnly: true,
      sort: 'discount_desc',
      page: 0,
      size: 4,
    }));
  });

  it('saves wishlist changes through the API and reloads them from the server', async () => {
    const store = createAppStore();
    store.dispatch(setCredentials({ token: 'student-token', user: { id: 7 } }));
    const { unmount } = renderHome(store);
    await screen.findByRole('heading', { name: 'Recently Listed' });
    const card = screen.getAllByRole('heading', { name: 'Free badminton racket' })[0].closest('article');
    const wishlistButton = within(card).getByRole('button', { name: 'Add Free badminton racket to wishlist' });
    fireEvent.click(wishlistButton);
    expect(await within(card).findByRole('button', { name: 'Remove Free badminton racket from wishlist' }))
      .toHaveAttribute('aria-pressed', 'true');
    expect(addWishlistItemRequest).toHaveBeenCalledWith(2);

    unmount();
    const refreshedStore = createAppStore();
    refreshedStore.dispatch(setCredentials({ token: 'student-token', user: { id: 7 } }));
    vi.mocked(fetchWishlistRequest).mockResolvedValue([{
      id: 21,
      addedAt: '2026-10-01T10:00:00Z',
      available: true,
      listing: { ...listings[1], status: 'AVAILABLE' },
    }]);
    await refreshedStore.dispatch(fetchWishlistThunk({ userId: 7 })).unwrap();
    renderHome(refreshedStore);
    await screen.findByRole('heading', { name: 'Recently Listed' });
    const reloadedItemHeading = screen.getAllByRole('heading', { name: 'Free badminton racket' })[0];
    const reloadedCard = reloadedItemHeading.closest('article');
    expect(within(reloadedCard).getByRole('button', { name: 'Remove Free badminton racket from wishlist' }))
      .toHaveAttribute('aria-pressed', 'true');
    expect(fetchWishlistRequest).toHaveBeenCalled();
  });

  it('sends sort and page selections to the paginated listings API', async () => {
    vi.mocked(searchListings).mockImplementation(async ({ page }) => ({
      items: listings,
      page,
      size: 8,
      totalElements: 20,
      totalPages: 3,
      first: page === 0,
      last: page === 2,
    }));
    renderHome();
    await screen.findByRole('heading', { name: 'Recently Listed' });

    fireEvent.change(screen.getByRole('combobox', { name: 'Sort listings' }), {
      target: { value: 'price_asc' },
    });
    await waitFor(() => expect(searchListings).toHaveBeenLastCalledWith(expect.objectContaining({
      sort: 'price_asc',
      page: 0,
      size: 8,
    })));

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByText('Page 2 of 3')).toBeInTheDocument();
    expect(searchListings).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1, sort: 'price_asc' }));
  });

  it('sends student discount filters and student price sorting to the search API', async () => {
    renderHome();
    await screen.findByRole('heading', { name: 'Recently Listed' });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Student discounts only' }));
    await waitFor(() => expect(searchListings).toHaveBeenLastCalledWith(expect.objectContaining({
      studentDiscountsOnly: true,
      page: 0,
    })));

    fireEvent.change(screen.getByRole('combobox', { name: 'Sort listings' }), {
      target: { value: 'student_price_asc' },
    });
    await waitFor(() => expect(searchListings).toHaveBeenLastCalledWith(expect.objectContaining({
      studentDiscountsOnly: true,
      sort: 'student_price_asc',
    })));
  });

  it('renders a real discounted listing and links to its product page in Student Deals', async () => {
    const deal = {
      ...listings[0],
      price: 1000,
      studentDiscountAvailable: true,
      studentDiscountEligible: true,
      studentDiscountedPrice: 800,
      discountPercentage: 20,
      amountSaved: 200,
    };
    vi.mocked(searchListings).mockImplementation(async ({ studentDiscountsOnly, page }) => {
      const items = studentDiscountsOnly ? [deal] : listings;
      return { items, page, size: 8, totalElements: items.length, totalPages: 1, first: true, last: true };
    });
    renderHome();

    const dealsSection = await screen.findByRole('region', { name: 'Student Deals' });
    expect(within(dealsSection).getByText('20% student discount')).toBeInTheDocument();
    expect(within(dealsSection).getByText('₹800')).toBeInTheDocument();
    expect(within(dealsSection).getByText('You save ₹200')).toBeInTheDocument();
    expect(within(dealsSection).getByRole('link', { name: 'View Engineering Mathematics textbook' }))
      .toHaveAttribute('href', '/listings/1');
  });

  it('shows an empty state when the backend returns no student discounts', async () => {
    vi.mocked(searchListings).mockImplementation(async ({ studentDiscountsOnly, page }) => {
      const items = studentDiscountsOnly ? [] : listings;
      return { items, page, size: 8, totalElements: items.length, totalPages: 1, first: true, last: true };
    });
    renderHome();
    expect(await screen.findByText('No student discounts available yet')).toBeInTheDocument();
  });
});
