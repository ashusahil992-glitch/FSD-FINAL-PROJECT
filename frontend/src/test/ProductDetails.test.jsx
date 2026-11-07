import { act, fireEvent, render, screen } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ProductDetails from '../pages/ProductDetails.jsx';
import { deleteListing, fetchListing, fetchListingReviews, submitListingReview } from '../services/listingService.js';
import { startConversation, submitListingReport } from '../services/messagingService.js';
import authReducer, { setCredentials } from '../redux/authSlice.js';

vi.mock('../services/listingService.js', () => ({
  fetchListing: vi.fn(),
  fetchListingReviews: vi.fn(),
  submitListingReview: vi.fn(),
  deleteListing: vi.fn(),
}));

vi.mock('../services/messagingService.js', () => ({
  startConversation: vi.fn(),
  submitListingReport: vi.fn(),
}));

describe('Product details', () => {
  beforeEach(() => {
    vi.mocked(fetchListing).mockResolvedValue({
      id: 42,
      title: 'Acoustic guitar',
      description: 'Beginner-friendly guitar available to rent for the semester.',
      price: 0,
      condition: 'GOOD',
      listingType: 'RENT',
      imageUrl: null,
      category: { name: 'Music', slug: 'music', icon: '🎸' },
      seller: { id: 11, name: 'Campus student', verified: true },
      demo: true,
      createdAt: '2026-10-01T10:00:00Z',
    });
    vi.mocked(fetchListingReviews).mockResolvedValue({
      reviews: [],
      listingAverageRating: null,
      listingReviewCount: 0,
      sellerAverageRating: null,
      sellerReviewCount: 0,
      hasReviewed: false,
    });
  });

  it('loads the listing by route id and renders its full details', async () => {
    render(
      <MemoryRouter initialEntries={['/listings/42']}>
        <Provider store={configureStore({ reducer: { auth: authReducer } })}>
          <Routes>
            <Route path="/listings/:id" element={<ProductDetails />} />
            <Route path="/messages/:conversationId" element={<h1>Conversation view</h1>} />
            <Route path="/login" element={<h1>Sign in page</h1>} />
          </Routes>
        </Provider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { name: 'Acoustic guitar' })).toBeInTheDocument();
    expect(fetchListing).toHaveBeenCalledWith('42');
    expect(screen.getByText('Beginner-friendly guitar available to rent for the semester.')).toBeInTheDocument();
    expect(screen.getByText('For rent')).toBeInTheDocument();
    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.getByText('Campus student')).toBeInTheDocument();
    expect(screen.getByText(/Verified student/)).toBeInTheDocument();
    expect(await screen.findByText(/No reviews yet/)).toBeInTheDocument();
  });

  it('shows the normal price and verification prompt when student pricing is unavailable to the viewer', async () => {
    vi.mocked(fetchListing).mockResolvedValueOnce({
      id: 43,
      title: 'Discounted textbook',
      description: 'A real listing with student pricing.',
      price: 1000,
      studentDiscountAvailable: true,
      studentDiscountEligible: false,
      studentDiscountedPrice: null,
      discountPercentage: null,
      amountSaved: null,
      condition: 'GOOD',
      listingType: 'SALE',
      category: { name: 'Books', slug: 'books' },
      seller: { id: 12, name: 'Verified seller', verified: true },
    });
    render(
      <MemoryRouter initialEntries={['/listings/43']}>
        <Provider store={configureStore({ reducer: { auth: authReducer } })}>
          <Routes><Route path="/listings/:id" element={<ProductDetails />} /></Routes>
        </Provider>
      </MemoryRouter>,
    );
    expect(await screen.findByRole('heading', { name: 'Discounted textbook' })).toBeInTheDocument();
    expect(screen.getByText('Verify your student account to unlock student pricing.')).toBeInTheDocument();
    expect(screen.queryByText(/Student price:/)).not.toBeInTheDocument();
  });

  it('shows the actual discounted price and savings for verified students', async () => {
    vi.mocked(fetchListing).mockResolvedValueOnce({
      id: 44,
      title: 'Verified student textbook deal',
      description: 'Discount enabled.',
      price: 1000,
      studentDiscountAvailable: true,
      studentDiscountEligible: true,
      studentDiscountedPrice: 800,
      discountPercentage: 20,
      amountSaved: 200,
      condition: 'GOOD',
      listingType: 'SALE',
      category: { name: 'Books', slug: 'books' },
      seller: { id: 12, name: 'Verified seller', verified: true },
    });
    const store = configureStore({ reducer: { auth: authReducer } });
    store.dispatch(setCredentials({ token: 'verified-token', user: { id: 21, studentVerified: true } }));
    render(
      <MemoryRouter initialEntries={['/listings/44']}>
        <Provider store={store}>
          <Routes><Route path="/listings/:id" element={<ProductDetails />} /></Routes>
        </Provider>
      </MemoryRouter>,
    );
    expect(await screen.findByText(/Student price:/)).toHaveTextContent('₹800');
    expect(screen.getByText('20% student discount')).toBeInTheDocument();
    expect(screen.getByText(/You save ₹200/)).toBeInTheDocument();
  });

  it('submits a listing review and renders the updated listing and seller ratings', async () => {
    vi.mocked(submitListingReview).mockResolvedValue({
      reviews: [{
        id: 8,
        rating: 4,
        comment: 'Exactly as described.',
        reviewerName: 'Current student',
        createdAt: '2026-10-02T10:00:00Z',
      }],
      listingAverageRating: 4,
      listingReviewCount: 1,
      sellerAverageRating: 4,
      sellerReviewCount: 1,
      hasReviewed: true,
    });
    const store = configureStore({ reducer: { auth: authReducer } });
    store.dispatch(setCredentials({ token: 'student-token', user: { id: 22 } }));
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/listings/42']}>
          <Routes>
            <Route path="/listings/:id" element={<ProductDetails />} />
          </Routes>
        </MemoryRouter>
      </Provider>,
    );

    await screen.findByRole('heading', { name: 'Acoustic guitar' });
    fireEvent.change(await screen.findByLabelText('Your rating'), { target: { value: '4' } });
    fireEvent.change(screen.getByLabelText('Comment (optional)'), { target: { value: 'Exactly as described.' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Submit review' }));
    });

    expect(submitListingReview).toHaveBeenCalledWith(42, {
      rating: 4,
      comment: 'Exactly as described.',
    });
    expect(await screen.findByText('Exactly as described.')).toBeInTheDocument();
    expect(screen.getByText(/★ 4\.0 seller rating/)).toBeInTheDocument();
    expect(screen.getByText(/★ 4\.0 \/ 5/)).toBeInTheDocument();
    expect(await screen.findByRole('status')).toHaveTextContent('already reviewed this listing');
  });

  it('submits listing reports for signed-in students', async () => {
    vi.mocked(submitListingReport).mockResolvedValue({});
    const store = configureStore({ reducer: { auth: authReducer } });
    store.dispatch(setCredentials({ token: 'student-token', user: { id: 22 } }));
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/listings/42']}>
          <Routes>
            <Route path="/listings/:id" element={<ProductDetails />} />
          </Routes>
        </MemoryRouter>
      </Provider>,
    );

    await screen.findByRole('heading', { name: 'Acoustic guitar' });
    fireEvent.click(screen.getByRole('button', { name: 'Report this listing' }));
    fireEvent.change(screen.getByLabelText(/Why are you reporting/), { target: { value: 'This listing looks suspicious.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit report' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Your report has been sent');
    expect(submitListingReport).toHaveBeenCalledWith(42, 'This listing looks suspicious.');
  });

  it('shows listing controls to the owner and removes the listing through the API', async () => {
    vi.mocked(deleteListing).mockResolvedValue(undefined);
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const store = configureStore({ reducer: { auth: authReducer } });
    store.dispatch(setCredentials({ token: 'student-token', user: { id: 11 } }));
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/listings/42']}>
          <Routes>
            <Route path="/listings/:id" element={<ProductDetails />} />
            <Route path="/" element={<h1>Marketplace home</h1>} />
          </Routes>
        </MemoryRouter>
      </Provider>,
    );

    await screen.findByRole('heading', { name: 'Acoustic guitar' });
    fireEvent.click(screen.getByRole('button', { name: 'Delete listing' }));
    expect(await screen.findByRole('heading', { name: 'Marketplace home' })).toBeInTheDocument();
    expect(deleteListing).toHaveBeenCalledWith('42');
    confirm.mockRestore();
  });
});
