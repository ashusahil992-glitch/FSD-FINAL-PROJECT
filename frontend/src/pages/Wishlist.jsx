import { useDispatch, useSelector } from 'react-redux';
import { Link, Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ErrorState from '../components/ErrorState.jsx';
import Loading from '../components/Loading.jsx';
import { fetchWishlist, removeWishlistItem } from '../redux/wishlistSlice.js';
import { formatPrice } from '../utils/format.js';

export default function Wishlist() {
  const dispatch = useDispatch();
  const token = useSelector((state) => state.auth.token);
  const userId = useSelector((state) => state.auth.user?.id);
  const { entries, ownerId, loading, error, pendingIds } = useSelector((state) => state.wishlist);

  if (!token) return <Navigate to="/login" replace state={{ from: '/wishlist' }} />;

  const currentUserWishlistLoading = loading || ownerId !== String(userId);

  async function remove(listingId) {
    try {
      await dispatch(removeWishlistItem({ listingId, userId })).unwrap();
      toast.success('Removed from your wishlist.');
    } catch (requestError) {
      toast.error(typeof requestError === 'string' ? requestError : 'Could not remove this listing.');
    }
  }

  return (
    <section className="min-h-[70vh] bg-slate-50 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-indigo-700">Saved for later</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Your wishlist</h1>
          </div>
          <Link to="/" className="text-sm font-semibold text-indigo-700 hover:text-indigo-900">Browse marketplace</Link>
        </div>

        {currentUserWishlistLoading && <div className="mt-8"><Loading lines={4} /></div>}
        {!currentUserWishlistLoading && error && (
          <div className="mt-8">
            <ErrorState message={error} onRetry={() => dispatch(fetchWishlist({ userId }))} />
          </div>
        )}
        {!currentUserWishlistLoading && !error && entries.length === 0 && (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <p className="text-lg font-semibold text-slate-900">Your wishlist is empty</p>
            <p className="mt-2 text-sm text-slate-600">Save listings you are interested in and find them here.</p>
            <Link to="/" className="btn-primary mt-5 inline-flex">Explore listings</Link>
          </div>
        )}
        {!currentUserWishlistLoading && !error && entries.length > 0 && (
          <ul className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {entries.map((entry) => {
              const listing = entry.listing;
              const available = entry.available && listing.status === 'AVAILABLE';
              const pending = pendingIds.includes(String(listing.id));
              return (
                <li key={entry.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  {available ? (
                    <Link to={`/listings/${listing.id}`} aria-label={`View ${listing.title}`} className="block aspect-[4/3] bg-slate-100">
                      {listing.imageUrl
                        ? <img src={listing.imageUrl} alt={listing.title} className="h-full w-full object-cover" />
                        : <div className="flex h-full items-center justify-center text-5xl" aria-hidden="true">{listing.category?.icon || '🛍️'}</div>}
                    </Link>
                  ) : (
                    <div className="relative aspect-[4/3] bg-slate-100">
                      {listing.imageUrl
                        ? <img src={listing.imageUrl} alt={listing.title} className="h-full w-full object-cover opacity-60" />
                        : <div className="flex h-full items-center justify-center text-5xl opacity-60" aria-hidden="true">{listing.category?.icon || '🛍️'}</div>}
                      <span className="absolute inset-x-0 bottom-0 bg-slate-900/80 px-3 py-2 text-center text-sm font-semibold text-white">
                        No longer available
                      </span>
                    </div>
                  )}
                  <div className="p-4">
                    <p className="text-xs font-medium text-slate-500">{listing.category?.name || 'Campus find'}</p>
                    <h2 className="mt-1 line-clamp-2 text-lg font-semibold text-slate-900">{listing.title}</h2>
                    {listing.studentDiscountEligible && listing.studentDiscountedPrice != null ? (
                      <div className="mt-2">
                        <p className="text-xs text-slate-500 line-through">{formatPrice(Number(listing.price))}</p>
                        <p className="font-bold text-emerald-800">{formatPrice(Number(listing.studentDiscountedPrice))}</p>
                        {listing.discountPercentage != null && (
                          <span className="mt-1 inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-900">
                            {Number(listing.discountPercentage)}% student discount
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="mt-2 font-bold text-slate-900">{formatPrice(Number(listing.price))}</p>
                    )}
                    {listing.studentDiscountAvailable && !listing.studentDiscountEligible && (
                      <p className="mt-1 text-xs text-indigo-700">Verify your student account to unlock student pricing.</p>
                    )}
                    <p className={`mt-1 text-sm ${available ? 'text-emerald-700' : 'text-amber-800'}`}>
                      {available ? 'Available' : 'This listing has been sold or removed.'}
                    </p>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      {available
                        ? <Link to={`/listings/${listing.id}`} className="text-sm font-semibold text-indigo-700 hover:text-indigo-900">View details</Link>
                        : <span className="text-sm text-slate-500">Unavailable</span>}
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => remove(listing.id)}
                        className="rounded-lg px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                      >
                        {pending ? 'Removing…' : 'Remove'}
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
