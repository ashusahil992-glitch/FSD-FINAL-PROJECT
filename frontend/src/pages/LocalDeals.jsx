import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import ErrorState from '../components/ErrorState.jsx';
import Loading from '../components/Loading.jsx';
import useFetch from '../hooks/useFetch.js';
import { fetchLocalDeals, submitLocalDeal } from '../services/localDealService.js';

const categories = ['Food & drink', 'Shopping', 'Health & wellness', 'Entertainment', 'Transport', 'Other'];
const inputClass = 'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100';

function todayString() {
  const today = new Date();
  const localToday = new Date(today.getTime() - today.getTimezoneOffset() * 60_000);
  return localToday.toISOString().slice(0, 10);
}

function DealCard({ deal }) {
  return (
    <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">{deal.category}</p>
          <h2 className="mt-2 text-lg font-bold text-slate-900">{deal.title}</h2>
        </div>
        <span className="shrink-0 rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-bold text-emerald-800">{deal.offer}</span>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{deal.description}</p>
      <div className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-sm">
        <p className="font-semibold text-slate-800">{deal.businessName}</p>
        <p className="text-slate-600">📍 {deal.location}</p>
        {deal.couponCode && (
          <p className="flex flex-wrap items-center gap-2 text-slate-600">
            Code <span className="rounded-md border border-dashed border-indigo-300 bg-indigo-50 px-2 py-1 font-mono font-semibold text-indigo-800">{deal.couponCode}</span>
          </p>
        )}
      </div>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-5">
        <p className="text-xs text-slate-500">Valid until {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(`${deal.validUntil}T00:00:00`))}</p>
        {deal.redemptionUrl && (
          <a href={deal.redemptionUrl} target="_blank" rel="noreferrer" className="text-sm font-semibold text-indigo-700 hover:text-indigo-900">
            Visit business <span aria-hidden="true">↗</span>
          </a>
        )}
      </div>
    </article>
  );
}

export default function LocalDeals() {
  const token = useSelector((state) => state.auth.token);
  const navigate = useNavigate();
  const dealsRequest = useFetch(fetchLocalDeals);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    businessName: '',
    title: '',
    offer: '',
    description: '',
    couponCode: '',
    category: categories[0],
    location: '',
    redemptionUrl: '',
    validUntil: '',
  });

  const deals = useMemo(() => (dealsRequest.data || []).filter((deal) => {
    const matchesCategory = !category || deal.category === category;
    const term = query.trim().toLowerCase();
    const matchesQuery = !term || [
      deal.businessName, deal.title, deal.offer, deal.description, deal.location,
    ].join(' ').toLowerCase().includes(term);
    return matchesCategory && matchesQuery;
  }), [category, dealsRequest.data, query]);

  function updateForm(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFormError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!token) {
      navigate('/login');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      const newDeal = await submitLocalDeal({
        ...form,
        businessName: form.businessName.trim(),
        title: form.title.trim(),
        offer: form.offer.trim(),
        description: form.description.trim(),
        couponCode: form.couponCode.trim() || null,
        location: form.location.trim(),
        redemptionUrl: form.redemptionUrl.trim() || null,
      });
      dealsRequest.reload();
      setFormOpen(false);
      setForm({
        businessName: '',
        title: '',
        offer: '',
        description: '',
        couponCode: '',
        category: categories[0],
        location: '',
        redemptionUrl: '',
        validUntil: '',
      });
      return newDeal;
    } catch (error) {
      setFormError(error.userMessage || 'Could not submit this local deal.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-[70vh] bg-slate-50 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-7xl">
        <section className="overflow-hidden rounded-3xl bg-emerald-950 px-6 py-10 text-white sm:px-10 sm:py-14">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-200">Good for students, good for local</p>
          <div className="mt-3 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Local business deals</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-emerald-100 sm:text-base">
                Discover current offers from businesses around campus. Check each deal&apos;s terms and expiry before redeeming.
              </p>
            </div>
            <button type="button" onClick={() => token ? setFormOpen((open) => !open) : navigate('/login')}
              className="btn shrink-0 rounded-xl bg-white px-5 py-3 font-semibold text-emerald-950 hover:bg-emerald-50">
              Share a local deal <span className="ml-2" aria-hidden="true">+</span>
            </button>
          </div>
        </section>

        {formOpen && (
          <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8" aria-labelledby="deal-form-heading">
            <h2 id="deal-form-heading" className="text-xl font-bold text-slate-900">Share a business offer</h2>
            <p className="mt-2 text-sm text-slate-600">Only post accurate offers you are authorized to share. Deals are visible publicly until their expiry date.</p>
            <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="deal-business" className="mb-1.5 block text-sm font-semibold text-slate-800">Business name *</label>
                <input id="deal-business" name="businessName" maxLength="140" required value={form.businessName} onChange={updateForm} className={inputClass} />
              </div>
              <div>
                <label htmlFor="deal-title" className="mb-1.5 block text-sm font-semibold text-slate-800">Deal title *</label>
                <input id="deal-title" name="title" maxLength="140" required value={form.title} onChange={updateForm} placeholder="e.g. Student lunch combo" className={inputClass} />
              </div>
              <div>
                <label htmlFor="deal-offer" className="mb-1.5 block text-sm font-semibold text-slate-800">Offer *</label>
                <input id="deal-offer" name="offer" maxLength="500" required value={form.offer} onChange={updateForm} placeholder="e.g. 15% off with student ID" className={inputClass} />
              </div>
              <div>
                <label htmlFor="deal-category" className="mb-1.5 block text-sm font-semibold text-slate-800">Category *</label>
                <select id="deal-category" name="category" required value={form.category} onChange={updateForm} className={inputClass}>
                  {categories.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="deal-description" className="mb-1.5 block text-sm font-semibold text-slate-800">Details and terms *</label>
                <textarea id="deal-description" name="description" rows="3" maxLength="3000" required value={form.description} onChange={updateForm} className={inputClass} />
              </div>
              <div>
                <label htmlFor="deal-code" className="mb-1.5 block text-sm font-semibold text-slate-800">Promo code (optional)</label>
                <input id="deal-code" name="couponCode" maxLength="80" value={form.couponCode} onChange={updateForm} className={inputClass} />
              </div>
              <div>
                <label htmlFor="deal-location" className="mb-1.5 block text-sm font-semibold text-slate-800">Location near campus *</label>
                <input id="deal-location" name="location" maxLength="180" required value={form.location} onChange={updateForm} placeholder="Area or branch address" className={inputClass} />
              </div>
              <div>
                <label htmlFor="deal-url" className="mb-1.5 block text-sm font-semibold text-slate-800">Business website (optional)</label>
                <input id="deal-url" name="redemptionUrl" type="url" maxLength="500" value={form.redemptionUrl} onChange={updateForm} placeholder="https://" className={inputClass} />
              </div>
              <div>
                <label htmlFor="deal-expiry" className="mb-1.5 block text-sm font-semibold text-slate-800">Valid until *</label>
                <input id="deal-expiry" name="validUntil" type="date" min={todayString()} required value={form.validUntil} onChange={updateForm} className={inputClass} />
              </div>
              {formError && <p role="alert" className="sm:col-span-2 text-sm text-red-700">{formError}</p>}
              <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-4 sm:col-span-2">
                <button type="button" onClick={() => setFormOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary rounded-xl px-5 py-3">
                  {submitting ? 'Submitting…' : 'Publish deal'}
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="mt-8" aria-label="Browse local deals">
          <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row">
            <label htmlFor="deals-search" className="sr-only">Search local deals</label>
            <input id="deals-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)}
              placeholder="Search business, offer, or location…" className={`${inputClass} min-w-0 flex-1`} />
            <label htmlFor="deals-category" className="sr-only">Filter deals by category</label>
            <select id="deals-category" value={category} onChange={(event) => setCategory(event.target.value)} className={`${inputClass} sm:w-56`}>
              <option value="">All categories</option>
              {categories.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
        </section>

        <section className="mt-8" aria-label="Available local business offers">
          {dealsRequest.loading && <div className="rounded-2xl bg-white p-5"><Loading lines={4} /></div>}
          {dealsRequest.error && <ErrorState message={dealsRequest.error} onRetry={dealsRequest.reload} />}
          {!dealsRequest.loading && !dealsRequest.error && deals.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
              <p className="text-3xl" aria-hidden="true">🏷️</p>
              <h2 className="mt-3 text-xl font-bold text-slate-900">No current deals found</h2>
              <p className="mt-2 text-sm text-slate-500">Try another search or share an offer from a local business.</p>
            </div>
          )}
          {!dealsRequest.loading && deals.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {deals.map((deal) => <DealCard key={deal.id} deal={deal} />)}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
