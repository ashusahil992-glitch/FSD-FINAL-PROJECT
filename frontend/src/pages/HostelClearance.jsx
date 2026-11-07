import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import ErrorState from '../components/ErrorState.jsx';
import Loading from '../components/Loading.jsx';
import ProductCard from '../components/ProductCard.jsx';
import useFetch from '../hooks/useFetch.js';
import { searchListings } from '../services/listingService.js';

const PAGE_SIZE = 12;

export default function HostelClearance() {
  const [page, setPage] = useState(0);
  const fetchClearanceListings = useCallback(() => searchListings({
    hostelClearanceOnly: true,
    sort: 'newest',
    page,
    size: PAGE_SIZE,
  }), [page]);
  const listingsRequest = useFetch(fetchClearanceListings);
  const listings = listingsRequest.data?.items || [];

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-800 px-6 py-10 text-white sm:px-10 sm:py-12">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-200">Campus move-out, made easier</p>
        <h1 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">Hostel Clearance</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-50 sm:text-base">
          Find items students are passing on as they move out, or list something useful for the next resident.
          Arrange handovers safely through campus messages.
        </p>
        <Link to="/hostel-clearance/new" className="mt-6 inline-flex rounded-xl bg-white px-5 py-3 text-sm font-semibold text-emerald-900 hover:bg-emerald-50">
          List a hostel item
        </Link>
      </section>

      <section className="py-9" aria-labelledby="clearance-listings-heading">
        <div className="mb-5">
          <h2 id="clearance-listings-heading" className="text-2xl font-bold text-slate-900">Items being passed on</h2>
          <p className="mt-1 text-sm text-slate-600">Available hostel-clearance listings, newest first.</p>
        </div>
        {listingsRequest.loading && <div className="card"><Loading lines={4} /></div>}
        {listingsRequest.error && <ErrorState message={listingsRequest.error} onRetry={listingsRequest.reload} />}
        {!listingsRequest.loading && !listingsRequest.error && listings.length === 0 && (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
            <p className="text-4xl" aria-hidden="true">🛏️</p>
            <h2 className="mt-3 text-xl font-bold text-slate-900">No hostel-clearance items yet</h2>
            <p className="mt-2 text-sm text-slate-600">Be the first to help another student settle in.</p>
            <Link to="/hostel-clearance/new" className="btn-primary mt-5 inline-flex rounded-xl px-5 py-3">List an item</Link>
          </div>
        )}
        {listings.length > 0 && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
              {listings.map((listing) => <ProductCard key={listing.id} listing={listing} />)}
            </div>
            {listingsRequest.data.totalPages > 1 && (
              <nav className="mt-8 flex items-center justify-center gap-4" aria-label="Hostel clearance pages">
                <button type="button" className="btn-secondary" disabled={listingsRequest.data.first || listingsRequest.loading}
                  onClick={() => setPage((current) => Math.max(0, current - 1))}>
                  Previous
                </button>
                <span className="text-sm text-slate-600" aria-live="polite">
                  Page {listingsRequest.data.page + 1} of {listingsRequest.data.totalPages}
                </span>
                <button type="button" className="btn-secondary" disabled={listingsRequest.data.last || listingsRequest.loading}
                  onClick={() => setPage((current) => current + 1)}>
                  Next
                </button>
              </nav>
            )}
          </>
        )}
      </section>
    </main>
  );
}
