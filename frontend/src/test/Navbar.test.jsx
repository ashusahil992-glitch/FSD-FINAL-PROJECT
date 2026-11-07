import { render, screen } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import Navbar from '../components/Navbar.jsx';
import authReducer from '../redux/authSlice.js';
import { formatPrice } from '../utils/format.js';

describe('Navbar', () => {
  it('shows the CampusBazaar logo linking home', () => {
    const store = configureStore({ reducer: { auth: authReducer } });
    render(<Provider store={store}><MemoryRouter><Navbar /></MemoryRouter></Provider>);
    expect(screen.getByRole('link', { name: /CampusBazaar/i })).toHaveAttribute('href', '/');
  });
});

describe('formatPrice', () => {
  it('formats rupees and free items', () => {
    expect(formatPrice(0)).toBe('Free');
    expect(formatPrice(700)).toContain('700');
  });
});
