import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ErrorState from '../components/ErrorState.jsx';
import Loading from '../components/Loading.jsx';
import ProductCard from '../components/ProductCard.jsx';
import useFetch from '../hooks/useFetch.js';
import { fetchListings, searchListings } from '../services/listingService.js';

const categories = [
  { name: 'Books', icon: '📚', slug: 'academic', terms: ['book', 'academic', 'textbook', 'calculator'] },
  { name: 'Electronics', icon: '💻', slug: 'electronics', terms: ['electronic', 'laptop', 'headphone', 'guitar'] },
  { name: 'Hostel Essentials', icon: '🛏️', slug: 'hostel', terms: ['hostel', 'bedsheet', 'comforter', 'lamp'] },
  { name: 'Furniture', icon: '🪑', slug: 'hostel', terms: ['furniture', 'table', 'chair', 'desk'] },
  { name: 'Fashion', icon: '👕', slug: 'fashion', terms: ['fashion', 'clothes', 'backpack', 'shoes'] },
  { name: 'Sports', icon: '🏸', slug: 'sports-and-fitness', terms: ['sport', 'badminton', 'racket', 'bicycle'] },
  { name: 'Appliances', icon: '🔌', slug: 'appliances', terms: ['appliance', 'kettle', 'fan', 'induction'] },
  { name: 'Free Items', icon: '🎁', listingType: 'GIVEAWAY', terms: [] },
];

function matchesCategory(listing, category) {
  if (!category) return true;
  if (category.name === 'Free Items') return listing.listingType === 'GIVEAWAY';

  const listingText = [
    listing.title,
    listing.description,
    listing.category?.name,
    listing.category?.slug,
  ].join(' ').toLowerCase();
  return category.terms.some((term) => listingText.includes(term));
}

function ListingSection({ id, title, subtitle, listings, actionLabel, actionHref }) {
  if (listings.length === 0) return null;

  return (
    <section id={id} className="scroll-mt-24 py-12" aria-labelledby={`${id}-heading`}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id={`${id}-heading`} className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {title}
          </h2>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
        {actionHref
          ? <Link to={actionHref} className="text-sm font-semibold text-brand-700 hover:text-brand-900">{actionLabel || 'Explore listings'} <span aria-hidden="true">→</span></Link>
          : <a href="#recently-listed" className="text-sm font-semibold text-brand-700 hover:text-brand-900">{actionLabel || 'Explore listings'} <span aria-hidden="true">→</span></a>}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
        {listings.map((listing) => <ProductCard key={listing.id} listing={listing} />)}
      </div>
    </section>
  );
}

export default function Home() {
  const listingsRequest = useFetch(fetchListings);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);
  const [sortBy, setSortBy] = useState('newest');
  const [studentDiscountsOnly, setStudentDiscountsOnly] = useState(false);
  const [page, setPage] = useState(0);
  const searchFetcher = useCallback(() => searchListings({
    q: search.trim() || undefined,
    category: activeCategory?.slug,
    listingType: activeCategory?.listingType,
    studentDiscountsOnly: studentDiscountsOnly || undefined,
    sort: sortBy,
    page,
    size: 8,
  }), [search, activeCategory, studentDiscountsOnly, sortBy, page]);
  const searchRequest = useFetch(searchFetcher);
  const studentDealsFetcher = useCallback(() => searchListings({
    studentDiscountsOnly: true,
    sort: 'discount_desc',
    page: 0,
    size: 4,
  }), []);
  const studentDealsRequest = useFetch(studentDealsFetcher);

  const filteredListings = useMemo(() => {
    const listings = listingsRequest.data || [];
    const query = search.trim().toLowerCase();

    return listings.filter((listing) => {
      const matchesSearch = !query || [
        listing.title,
        listing.description,
        listing.category?.name,
        listing.seller?.name,
      ].join(' ').toLowerCase().includes(query);
      return matchesSearch && matchesCategory(listing, activeCategory);
    });
  }, [listingsRequest.data, search, activeCategory]);

  const budgetFinds = filteredListings.filter((listing) => Number(listing.price) <= 1000);
  const popularItems = filteredListings.filter((listing) => listing.popular);
  const hostelClearance = filteredListings.filter((listing) => listing.hostelClearance);

  function exploreListings(event) {
    event.preventDefault();
    document.getElementById('recently-listed')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <>
      <section className="relative isolate overflow-hidden bg-slate-950 text-white">
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_75%_30%,rgba(99,102,241,0.4),transparent_38%),radial-gradient(ellipse_at_10%_90%,rgba(16,185,129,0.2),transparent_35%)]" />
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.15fr_0.85fr] lg:px-8 lg:py-28">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-200">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Made for campus life
            </p>
            <h1 className="mt-6 max-w-2xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Your Campus.<br /><span className="text-indigo-300">Your Marketplace.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
              Find the things you need, pass on what you don&apos;t, and make student life a little easier.
              All around your campus.
            </p>

            <form onSubmit={exploreListings} role="search" className="mt-8 flex max-w-2xl flex-col gap-2 rounded-2xl bg-white p-2 shadow-2xl shadow-black/20 sm:flex-row">
              <label className="sr-only" htmlFor="marketplace-search">Search campus listings</label>
              <input
                id="marketplace-search"
                type="search"
                value={search}
                onChange={(event) => { setSearch(event.target.value); setPage(0); }}
                placeholder="Search books, electronics, hostel essentials..."
                className="min-w-0 flex-1 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500"
              />
              <button type="submit" className="btn-primary rounded-xl px-6 py-3">
                Search marketplace
              </button>
            </form>

            <div className="mt-5 flex flex-wrap gap-3">
              <a href="#recently-listed" className="btn-primary bg-indigo-500 px-5 py-3 hover:bg-indigo-400">Explore Marketplace <span className="ml-2" aria-hidden="true">→</span></a>
              <Link to="/sell" className="btn border border-white/25 bg-white/5 px-5 py-3 text-white hover:bg-white/10">Sell an Item</Link>
              <Link to="/hostel-clearance" className="btn border border-white/25 bg-white/5 px-5 py-3 text-white hover:bg-white/10">Hostel Clearance</Link>
              <a href="#student-deals" className="btn border border-white/25 bg-white/5 px-5 py-3 text-white hover:bg-white/10">Student Deals</a>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-300">
              <span>✓ Student-first community</span>
              <span>✓ Buy, sell, rent or give away</span>
            </div>
          </div>

          <div className="relative hidden min-h-[340px] lg:block" aria-hidden="true">
            <div className="absolute right-4 top-8 w-64 rotate-6 rounded-3xl border border-white/15 bg-white/10 p-3 shadow-2xl backdrop-blur">
              <div className="h-48 rounded-2xl bg-[linear-gradient(135deg,#a5b4fc,#312e81)]" />
              <div className="flex items-center justify-between px-2 py-4">
                <div><div className="h-3 w-32 rounded bg-white/70" /><div className="mt-2 h-2 w-20 rounded bg-white/30" /></div>
                <div className="h-4 w-14 rounded bg-emerald-300/80" />
              </div>
            </div>
            <div className="absolute bottom-5 left-1 w-64 -rotate-6 rounded-3xl border border-white/15 bg-white/10 p-3 shadow-2xl backdrop-blur">
              <div className="h-44 rounded-2xl bg-[linear-gradient(135deg,#6ee7b7,#047857)]" />
              <div className="flex items-center justify-between px-2 py-4">
                <div><div className="h-3 w-28 rounded bg-white/70" /><div className="mt-2 h-2 w-16 rounded bg-white/30" /></div>
                <div className="h-4 w-12 rounded bg-indigo-300/80" />
              </div>
            </div>
            <div className="absolute right-0 top-1/2 rounded-2xl border border-white/15 bg-slate-900/80 px-4 py-3 shadow-xl">
              <p className="text-xs text-slate-300">A better second life</p>
              <p className="mt-1 font-semibold">Starts on campus ♻️</p>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <section id="categories" className="scroll-mt-24 py-12 sm:py-16" aria-labelledby="category-heading">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-brand-700">Browse by category</p>
              <h2 id="category-heading" className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Find your campus essentials</h2>
            </div>
            {activeCategory && (
              <button type="button" className="text-sm font-semibold text-brand-700 hover:text-brand-900" onClick={() => setActiveCategory(null)}>
                Clear {activeCategory.name} filter
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {categories.map((category) => (
              <button
                key={category.name}
                type="button"
                aria-pressed={activeCategory?.name === category.name}
                onClick={() => {
                  setActiveCategory(activeCategory?.name === category.name ? null : category);
                  setPage(0);
                }}
                className={`group flex min-h-28 flex-col items-center justify-center gap-2 rounded-2xl border p-3 text-center transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                  activeCategory?.name === category.name
                    ? 'border-brand-500 bg-brand-50 text-brand-800'
                    : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                <span className="text-3xl transition group-hover:scale-110" aria-hidden="true">{category.icon}</span>
                <span className="text-xs font-semibold sm:text-sm">{category.name}</span>
              </button>
            ))}
          </div>
        </section>

        <section id="recently-listed" className="scroll-mt-24 py-8" aria-label="Marketplace listings">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <p className="text-sm text-slate-600" aria-live="polite">
              {search.trim() ? <>Showing results for <strong>&ldquo;{search.trim()}&rdquo;</strong></>
                : activeCategory ? <>Browsing <strong>{activeCategory.name}</strong></> : 'Fresh finds from your campus'}
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input type="checkbox" checked={studentDiscountsOnly}
                  onChange={(event) => { setStudentDiscountsOnly(event.target.checked); setPage(0); }}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                Student discounts only
              </label>
              <label className="text-sm font-medium text-slate-700">
                Sort by
                <select aria-label="Sort listings" value={sortBy}
                  onChange={(event) => { setSortBy(event.target.value); setPage(0); }}
                  className="ml-2 rounded-lg border border-slate-300 bg-white px-3 py-2">
                  <option value="newest">Recently listed</option>
                  <option value="price_asc">Price: low to high</option>
                  <option value="price_desc">Price: high to low</option>
                  <option value="student_price_asc">Lowest student price</option>
                  <option value="discount_desc">Highest discount</option>
                </select>
              </label>
            </div>
          </div>
          {searchRequest.loading && <div className="card"><Loading lines={4} /></div>}
          {searchRequest.error && <ErrorState message={searchRequest.error} onRetry={searchRequest.reload} />}
          {!searchRequest.loading && searchRequest.data && searchRequest.data.items.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
              <p className="text-3xl" aria-hidden="true">🔎</p>
              <h2 id="recent-heading" className="mt-3 text-xl font-bold text-slate-900">No listings match just yet</h2>
              <p className="mt-2 text-sm text-slate-500">Try another search or browse a different category.</p>
              <button type="button" className="btn-secondary mt-5" onClick={() => { setSearch(''); setActiveCategory(null); setPage(0); }}>
                Clear search and filters
              </button>
            </div>
          )}
          {!searchRequest.loading && searchRequest.data?.items.length > 0 && (
            <ListingSection
              id="recent-listings-grid"
              title={activeCategory ? `${activeCategory.name} on campus` : search.trim() ? 'Search results' : 'Recently Listed'}
              subtitle="Fresh finds from the campus community"
              listings={searchRequest.data.items}
            />
          )}
          {!searchRequest.loading && searchRequest.data?.totalPages > 1 && (
            <nav className="mt-8 flex items-center justify-center gap-4" aria-label="Listing pages">
              <button type="button" className="btn-secondary" disabled={searchRequest.data.first}
                onClick={() => setPage((current) => Math.max(0, current - 1))}>
                Previous
              </button>
              <span className="text-sm text-slate-600" aria-live="polite">
                Page {searchRequest.data.page + 1} of {searchRequest.data.totalPages}
              </span>
              <button type="button" className="btn-secondary" disabled={searchRequest.data.last}
                onClick={() => setPage((current) => current + 1)}>
                Next
              </button>
            </nav>
          )}
        </section>

        {listingsRequest.data && !search.trim() && !activeCategory && (
          <>
            <ListingSection id="popular-items" title="Popular Items" subtitle="Campus favourites worth a look" listings={popularItems.slice(0, 4)} />
            <ListingSection id="budget-finds" title="Budget Finds" subtitle="Good finds that are easy on your wallet" listings={budgetFinds.slice(0, 4)} />
            <ListingSection
              id="hostel-clearance"
              title="Hostel Clearance"
              subtitle="Useful things students are passing on while moving out"
              listings={hostelClearance.slice(0, 4)}
              actionHref="/hostel-clearance"
              actionLabel="Browse all hostel items"
            />
          </>
        )}

        <section id="student-deals" className="scroll-mt-24 py-12" aria-label="Student Deals">
          <div className="mb-6">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Student Deals</h2>
            <p className="mt-1 text-sm text-slate-500">Verified students get extra value on real campus listings.</p>
          </div>
          {studentDealsRequest.loading && <div className="card"><Loading lines={4} /></div>}
          {studentDealsRequest.error && <ErrorState message={studentDealsRequest.error} onRetry={studentDealsRequest.reload} />}
          {!studentDealsRequest.loading && !studentDealsRequest.error
            && studentDealsRequest.data?.items?.length === 0 && (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
                <h3 className="text-lg font-semibold text-slate-900">No student discounts available yet</h3>
                <p className="mt-2 text-sm text-slate-600">Check back later for listings with student pricing.</p>
              </div>
          )}
          {studentDealsRequest.data?.items?.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
              {studentDealsRequest.data.items.map((listing) => <ProductCard key={listing.id} listing={listing} />)}
            </div>
          )}
        </section>

        <section id="safety" className="my-10 scroll-mt-24 rounded-3xl bg-emerald-50 px-6 py-10 sm:px-10 sm:py-12" aria-labelledby="safety-heading">
          <div className="grid gap-8 md:grid-cols-[0.8fr_1.2fr] md:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-emerald-800">Good deals. Good sense.</p>
              <h2 id="safety-heading" className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Campus connections, with care.</h2>
              <p className="mt-3 text-slate-600">A few simple habits make every handover safer and smoother.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-white p-5"><span className="text-2xl" aria-hidden="true">🎓</span><h3 className="mt-3 font-semibold text-slate-900">Check the student</h3><p className="mt-1 text-sm leading-6 text-slate-600">Look for campus verification and keep conversations on-platform.</p></div>
              <div className="rounded-2xl bg-white p-5"><span className="text-2xl" aria-hidden="true">🤝</span><h3 className="mt-3 font-semibold text-slate-900">Meet on campus</h3><p className="mt-1 text-sm leading-6 text-slate-600">Choose a busy public place for item checks and handovers.</p></div>
              <div className="rounded-2xl bg-white p-5"><span className="text-2xl" aria-hidden="true">🔍</span><h3 className="mt-3 font-semibold text-slate-900">Inspect before paying</h3><p className="mt-1 text-sm leading-6 text-slate-600">Check the condition and agree on the details in person.</p></div>
            </div>
          </div>
        </section>

        <section className="my-12 flex flex-col items-start justify-between gap-5 rounded-3xl bg-indigo-50 p-7 sm:flex-row sm:items-center sm:p-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-indigo-700">Your next move</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Have something your campus needs?</h2>
            <p className="mt-2 max-w-xl text-slate-600">Pass it on to another student. Add the details and get your listing ready.</p>
          </div>
          <Link to="/sell" className="btn-primary shrink-0 rounded-xl px-5 py-3">List an item <span className="ml-2" aria-hidden="true">→</span></Link>
        </section>
      </div>
    </>
  );
}
