import { useCallback, useState } from 'react';
import { Link } from 'react-router-dom';
import ErrorState from '../components/ErrorState.jsx';
import Loading from '../components/Loading.jsx';
import ProductCard from '../components/ProductCard.jsx';
import useFetch from '../hooks/useFetch.js';
import { fetchCategories } from '../services/categoryService.js';
import { searchListings } from '../services/listingService.js';

const pageSize = 12;

export default function Services() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(0);
  const categoriesRequest = useFetch(fetchCategories);
  const serviceCategories = (categoriesRequest.data || []).filter((item) => item.parentName === 'Services');
  const fetcher = useCallback(() => searchListings({
    q: query.trim() || undefined,
    category: category || undefined,
    listingType: 'SERVICE',
    sort,
    page,
    size: pageSize,
  }), [category, page, query, sort]);
  const servicesRequest = useFetch(fetcher);

  function updateFilter(update) {
    setPage(0);
    update();
  }

  return (
    <main className="min-h-[70vh] bg-slate-50 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-7xl">
        <section className="overflow-hidden rounded-3xl bg-indigo-950 px-6 py-10 text-white sm:px-10 sm:py-14">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-indigo-200">Skills from your campus</p>
          <div className="mt-3 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Student services</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-indigo-100 sm:text-base">
                Find peer tutoring, creative help, repairs, and other services offered by students in your community.
              </p>
            </div>
            <Link to="/services/new" className="btn shrink-0 rounded-xl bg-white px-5 py-3 font-semibold text-indigo-900 hover:bg-indigo-50">
              Offer a service <span className="ml-2" aria-hidden="true">→</span>
            </Link>
          </div>
        </section>

        <section className="mt-8" aria-label="Browse student services">
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row">
            <label className="sr-only" htmlFor="services-search">Search student services</label>
            <input id="services-search" type="search" value={query}
              onChange={(event) => updateFilter(() => setQuery(event.target.value))}
              placeholder="Search tutoring, design, repairs…" className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
            <label className="sr-only" htmlFor="services-category">Filter services by category</label>
            <select id="services-category" value={category}
              onChange={(event) => updateFilter(() => setCategory(event.target.value))}
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm">
              <option value="">All service categories</option>
              {serviceCategories.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}
            </select>
            <label className="sr-only" htmlFor="services-sort">Sort services</label>
            <select id="services-sort" value={sort}
              onChange={(event) => updateFilter(() => setSort(event.target.value))}
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm">
              <option value="newest">Recently listed</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
            </select>
          </div>
        </section>

        <section className="mt-8" aria-label="Student service listings" aria-live="polite">
          {categoriesRequest.error && <ErrorState message={categoriesRequest.error} onRetry={categoriesRequest.reload} />}
          {servicesRequest.loading && <div className="rounded-2xl bg-white p-5"><Loading lines={4} /></div>}
          {servicesRequest.error && <ErrorState message={servicesRequest.error} onRetry={servicesRequest.reload} />}
          {!servicesRequest.loading && servicesRequest.data?.items.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
              <p className="text-3xl" aria-hidden="true">🛠️</p>
              <h2 className="mt-3 text-xl font-bold text-slate-900">No services found</h2>
              <p className="mt-2 text-sm text-slate-500">Try another search or be the first student to offer a service.</p>
              <Link to="/services/new" className="btn-primary mt-5 rounded-xl px-5 py-3">Offer a service</Link>
            </div>
          )}
          {!servicesRequest.loading && servicesRequest.data?.items.length > 0 && (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
                {servicesRequest.data.items.map((service) => <ProductCard key={service.id} listing={service} />)}
              </div>
              {servicesRequest.data.totalPages > 1 && (
                <nav className="mt-8 flex items-center justify-center gap-4" aria-label="Service pages">
                  <button type="button" className="btn-secondary" disabled={servicesRequest.data.first}
                    onClick={() => setPage((current) => Math.max(0, current - 1))}>Previous</button>
                  <span className="text-sm text-slate-600">Page {servicesRequest.data.page + 1} of {servicesRequest.data.totalPages}</span>
                  <button type="button" className="btn-secondary" disabled={servicesRequest.data.last}
                    onClick={() => setPage((current) => current + 1)}>Next</button>
                </nav>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
