import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { addWishlistItem, removeWishlistItem } from '../redux/wishlistSlice.js';

export default function WishlistButton({ listing, className = '' }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const token = useSelector((state) => state.auth.token);
  const userId = useSelector((state) => state.auth.user?.id);
  const saved = useSelector((state) => (state.wishlist?.ids || []).some((id) => String(id) === String(listing.id)));
  const pending = useSelector((state) => (state.wishlist?.pendingIds || []).includes(String(listing.id)));
  const [error, setError] = useState('');

  async function toggle() {
    if (!token) {
      navigate('/login', { state: { from: `${location.pathname}${location.search}` } });
      return;
    }
    setError('');
    try {
      if (saved) {
        await dispatch(removeWishlistItem({ listingId: listing.id, userId })).unwrap();
        toast.success('Removed from your wishlist.');
      } else {
        await dispatch(addWishlistItem({ listingId: listing.id, userId })).unwrap();
        toast.success('Added to your wishlist.');
      }
    } catch (requestError) {
      const message = typeof requestError === 'string' ? requestError : 'Could not update your wishlist.';
      setError(message);
      toast.error(message);
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label={saved ? `Remove ${listing.title} from wishlist` : `Add ${listing.title} to wishlist`}
        aria-pressed={saved}
        aria-busy={pending}
        disabled={pending}
        onClick={toggle}
        className={`flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-xl shadow-sm transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:cursor-wait disabled:opacity-60 ${saved ? 'text-rose-600' : 'text-slate-500'} ${className}`}
      >
        <span aria-hidden="true">{saved ? '♥' : '♡'}</span>
      </button>
      {error && <span role="alert" className="sr-only">{error}</span>}
    </>
  );
}
