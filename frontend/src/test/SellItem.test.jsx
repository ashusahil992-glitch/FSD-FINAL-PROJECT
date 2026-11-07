import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import authReducer, { setCredentials } from '../redux/authSlice.js';
import SellItem from '../pages/SellItem.jsx';
import { fetchCategories } from '../services/categoryService.js';
import { createListing, fetchListing, updateListing } from '../services/listingService.js';

vi.mock('../services/categoryService.js', () => ({
  fetchCategories: vi.fn(),
}));

vi.mock('../services/listingService.js', () => ({
  createListing: vi.fn(),
  fetchListing: vi.fn(),
  updateListing: vi.fn(),
}));

function renderSellItem(authenticated = true, initialPath = '/sell', user = { id: 10, fullName: 'Test Student' }) {
  if (authenticated) {
    localStorage.setItem('campusbazaar_token', 'test-token');
    localStorage.setItem('campusbazaar_user', JSON.stringify(user));
  }
  const store = configureStore({ reducer: { auth: authReducer } });
  if (authenticated) {
    store.dispatch(setCredentials({ token: 'test-token', user }));
  }
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/sell" element={<SellItem />} />
          <Route path="/hostel-clearance/new" element={<SellItem hostelClearanceOnly />} />
          <Route path="/services/new" element={<SellItem serviceOnly />} />
          <Route path="/services/:id/edit" element={<SellItem serviceOnly />} />
          <Route path="/listings/:id/edit" element={<SellItem />} />
          <Route path="/listings/:id" element={<h1>Listing details</h1>} />
          <Route path="/login" element={<h1>Sign in page</h1>} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
}

describe('Sell item form', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.mocked(fetchListing).mockReset();
    vi.mocked(updateListing).mockReset();
    vi.mocked(fetchCategories).mockResolvedValue([
      { id: 1, name: 'Books', slug: 'academic-books', parentName: 'Academic' },
      { id: 2, name: 'Tutoring', slug: 'services-tutoring', parentName: 'Services' },
    ]);
  });

  it('requires an account before showing the publishing form', () => {
    renderSellItem(false);
    expect(screen.getByRole('heading', { name: 'Sign in to sell on campus' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login');
  });

  it('saves the listing using the API and navigates to its details', async () => {
    vi.mocked(createListing).mockResolvedValue({ id: 81, title: 'Physics textbook' });
    renderSellItem();

    fireEvent.change(await screen.findByLabelText(/Item title/), { target: { value: 'Physics textbook' } });
    fireEvent.change(screen.getByLabelText(/Category/), { target: { value: 'academic-books' } });
    fireEvent.change(screen.getByLabelText(/Price/), { target: { value: '500' } });
    fireEvent.change(screen.getByLabelText(/Condition/), { target: { value: 'GOOD' } });
    fireEvent.change(screen.getByLabelText(/Description/), { target: { value: 'Good condition, clean pages.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Publish listing' }));

    await screen.findByRole('heading', { name: 'Listing details' });
    expect(createListing).toHaveBeenCalledWith({
      title: 'Physics textbook',
      description: 'Good condition, clean pages.',
      categorySlug: 'academic-books',
      listingType: 'SALE',
      condition: 'GOOD',
      price: 500,
      studentDiscountEnabled: false,
      studentDiscountedPrice: null,
      hostelClearance: false,
    });
  });

  it('sends giveaways at zero price and displays backend failures', async () => {
    vi.mocked(createListing).mockRejectedValueOnce(Object.assign(new Error('Category not found'), {
      userMessage: 'The selected category is not available.',
    }));
    renderSellItem();

    fireEvent.change(await screen.findByLabelText(/Item title/), { target: { value: 'Free notebook' } });
    fireEvent.change(screen.getByLabelText(/Category/), { target: { value: 'academic-books' } });
    fireEvent.change(screen.getByLabelText(/What would you like to do/), { target: { value: 'GIVEAWAY' } });
    fireEvent.change(screen.getByLabelText(/Condition/), { target: { value: 'GOOD' } });
    fireEvent.change(screen.getByLabelText(/Description/), { target: { value: 'Free for pickup.' } });
    expect(screen.queryByLabelText(/Price/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Publish listing' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('The selected category is not available.');
    await waitFor(() => expect(createListing).toHaveBeenCalledWith(expect.objectContaining({
      listingType: 'GIVEAWAY',
      price: 0,
    })));
  });

  it('publishes a free campus service without item-condition fields', async () => {
    vi.mocked(createListing).mockResolvedValue({ id: 92, title: 'Calculus tutoring' });
    renderSellItem(true, '/services/new');

    fireEvent.change(await screen.findByLabelText(/Service title/), { target: { value: 'Calculus tutoring' } });
    fireEvent.change(screen.getByLabelText(/Category/), { target: { value: 'services-tutoring' } });
    fireEvent.change(screen.getByLabelText(/Service details/), { target: { value: 'Peer tutoring for first-year calculus.' } });
    expect(screen.queryByLabelText('Condition')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('What would you like to do?')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Publish service' }));

    await screen.findByRole('heading', { name: 'Listing details' });
    expect(createListing).toHaveBeenCalledWith({
      title: 'Calculus tutoring',
      description: 'Peer tutoring for first-year calculus.',
      categorySlug: 'services-tutoring',
      listingType: 'SERVICE',
      condition: 'GOOD',
      price: 0,
      studentDiscountEnabled: false,
      studentDiscountedPrice: null,
      hostelClearance: false,
    });
  });

  it('loads and updates only the authenticated owner’s listing', async () => {
    vi.mocked(fetchListing).mockResolvedValue({
      id: 81,
      title: 'Physics textbook',
      description: 'Good condition, clean pages.',
      price: 500,
      condition: 'GOOD',
      listingType: 'SALE',
      category: { slug: 'academic-books' },
      seller: { id: 10 },
      studentDiscountAvailable: true,
      studentDiscountedPrice: 400,
    });
    vi.mocked(updateListing).mockResolvedValue({ id: 81 });
    renderSellItem(true, '/listings/81/edit');

    const title = await screen.findByLabelText(/Item title/);
    expect(title).toHaveValue('Physics textbook');
    fireEvent.change(title, { target: { value: 'Updated physics textbook' } });
    expect(await screen.findByLabelText('Student discounted price (₹)')).toHaveValue(400);
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    await screen.findByRole('heading', { name: 'Listing details' });
    expect(updateListing).toHaveBeenCalledWith('81', expect.objectContaining({
      title: 'Updated physics textbook',
      price: 500,
      studentDiscountEnabled: true,
      studentDiscountedPrice: 400,
      categorySlug: 'academic-books',
      hostelClearance: false,
    }));
  });

  it('lets a seller enable, calculate, and remove a student discount', async () => {
    vi.mocked(createListing).mockResolvedValue({ id: 93, title: 'Discounted book' });
    renderSellItem();

    fireEvent.change(await screen.findByLabelText(/Item title/), { target: { value: 'Discounted book' } });
    fireEvent.change(screen.getByLabelText(/Category/), { target: { value: 'academic-books' } });
    fireEvent.change(screen.getByLabelText(/Price/), { target: { value: '1000' } });
    fireEvent.change(screen.getByLabelText(/Condition/), { target: { value: 'GOOD' } });
    fireEvent.change(screen.getByLabelText(/Description/), { target: { value: 'Student pricing available.' } });
    fireEvent.click(screen.getByRole('checkbox', { name: /Enable student-only pricing/ }));
    fireEvent.change(screen.getByLabelText('Student discounted price (₹)'), { target: { value: '800' } });
    expect(screen.getByText('Discount:')).toHaveTextContent('20.00%');

    fireEvent.click(screen.getByRole('button', { name: 'Publish listing' }));
    await screen.findByRole('heading', { name: 'Listing details' });
    expect(createListing).toHaveBeenCalledWith(expect.objectContaining({
      price: 1000,
      studentDiscountEnabled: true,
      studentDiscountedPrice: 800,
    }));
  });

  it('starts the dedicated hostel clearance listing workflow with the category flag enabled', async () => {
    vi.mocked(createListing).mockResolvedValue({ id: 94, title: 'Desk lamp' });
    renderSellItem(true, '/hostel-clearance/new');

    expect(await screen.findByRole('heading', { name: 'List a hostel item' })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /Include this item in Hostel Clearance/ })).toBeChecked();
    fireEvent.change(screen.getByLabelText(/Item title/), { target: { value: 'Desk lamp' } });
    fireEvent.change(screen.getByLabelText(/Category/), { target: { value: 'academic-books' } });
    fireEvent.change(screen.getByLabelText(/Price/), { target: { value: '250' } });
    fireEvent.change(screen.getByLabelText(/Condition/), { target: { value: 'GOOD' } });
    fireEvent.change(screen.getByLabelText(/Description/), { target: { value: 'A desk lamp for the next resident.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Publish listing' }));

    await screen.findByRole('heading', { name: 'Listing details' });
    expect(createListing).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Desk lamp',
      hostelClearance: true,
    }));
  });
});
