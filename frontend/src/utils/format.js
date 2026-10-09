const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

export function formatPrice(amount) {
  if (amount === 0) return 'Free';
  return inr.format(amount);
}
