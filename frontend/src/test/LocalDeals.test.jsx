import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import authReducer, { setCredentials } from '../redux/authSlice.js';
import LocalDeals from '../pages/LocalDeals.jsx';
import { fetchLocalDeals, submitLocalDeal } from '../services/localDealService.js';

vi.mock('../services/localDealService.js', () => ({
  fetchLocalDeals: vi.fn(),
  submitLocalDeal: vi.fn(),
}));

const deal = {
  id: 6,
  businessName: 'Campus Corner Cafe',
  title: 'Student lunch combo',
  offer: '15% off with student ID',
  description: 'Valid on weekdays.',
  couponCode: 'CAMPUS15',
  category: 'Food & drink',
  location: 'North Gate',
  redemptionUrl: 'https://example.com/deals',
  validUntil: '2099-12-31',
  submittedBy: 'Campus student',
};

describe('Local business deals', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchLocalDeals).mockResolvedValue([deal]);
  });

  it('displays active deal details and supports deal search', async () => {
    render(
      <Provider store={configureStore({ reducer: { auth: authReducer } })}>
        <MemoryRouter><LocalDeals /></MemoryRouter>
      </Provider>,
    );

    expect(await screen.findByRole('heading', { name: 'Student lunch combo' })).toBeInTheDocument();
    expect(screen.getByText('Campus Corner Cafe')).toBeInTheDocument();
    expect(screen.getByText('CAMPUS15')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Visit business/ })).toHaveAttribute('rel', 'noreferrer');
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search local deals' }), {
      target: { value: 'North Gate' },
    });
    expect(screen.getByRole('heading', { name: 'Student lunch combo' })).toBeInTheDocument();
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search local deals' }), {
      target: { value: 'not present' },
    });
    expect(screen.getByRole('heading', { name: 'No current deals found' })).toBeInTheDocument();
  });

  it('allows a signed-in student to publish a local business deal', async () => {
    vi.mocked(fetchLocalDeals).mockResolvedValueOnce([]).mockResolvedValue([deal]);
    vi.mocked(submitLocalDeal).mockResolvedValue(deal);
    const store = configureStore({ reducer: { auth: authReducer } });
    store.dispatch(setCredentials({ token: 'student-token', user: { id: 21, fullName: 'Campus student' } }));
    render(
      <Provider store={store}>
        <MemoryRouter><LocalDeals /></MemoryRouter>
      </Provider>,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Share a local deal' }));
    fireEvent.change(screen.getByLabelText('Business name *'), { target: { value: 'Campus Corner Cafe' } });
    fireEvent.change(screen.getByLabelText('Deal title *'), { target: { value: 'Student lunch combo' } });
    fireEvent.change(screen.getByLabelText('Offer *'), { target: { value: '15% off with student ID' } });
    fireEvent.change(screen.getByLabelText('Details and terms *'), { target: { value: 'Valid on weekdays.' } });
    fireEvent.change(screen.getByLabelText('Promo code (optional)'), { target: { value: 'CAMPUS15' } });
    fireEvent.change(screen.getByLabelText('Location near campus *'), { target: { value: 'North Gate' } });
    fireEvent.change(screen.getByLabelText('Valid until *'), { target: { value: '2099-12-31' } });
    fireEvent.click(screen.getByRole('button', { name: 'Publish deal' }));

    expect(await screen.findByRole('heading', { name: 'Student lunch combo' })).toBeInTheDocument();
    expect(submitLocalDeal).toHaveBeenCalledWith(expect.objectContaining({
      businessName: 'Campus Corner Cafe',
      title: 'Student lunch combo',
      couponCode: 'CAMPUS15',
      category: 'Food & drink',
      validUntil: '2099-12-31',
    }));
    await waitFor(() => expect(fetchLocalDeals).toHaveBeenCalledTimes(2));
  });
});
