import { fetchHealth, fetchUniversities } from '../services/universityService.js';
import useFetch from '../hooks/useFetch.js';
import Loading from '../components/Loading.jsx';
import ErrorState from '../components/ErrorState.jsx';
import EmptyState from '../components/EmptyState.jsx';

export default function Home() {
  const health = useFetch(fetchHealth);
  const universities = useFetch(fetchUniversities);

  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-gradient-to-r from-brand-600 to-brand-900 p-8 text-white">
        <p className="text-sm font-semibold tracking-widest">BUY • SELL • SAVE • CONNECT</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Your Campus Marketplace</h1>
        <p className="mt-2 max-w-xl text-brand-100">
          Phase 1 foundation is running. The marketplace, deals and chat arrive in the next phases.
        </p>
      </section>

      <section className="card" aria-labelledby="status-heading">
        <h2 id="status-heading" className="text-lg font-semibold">Backend connection</h2>
        <div className="mt-3">
          {health.loading && <Loading lines={1} />}
          {health.error && <ErrorState message={health.error} onRetry={health.reload} />}
          {health.data && (
            <p className="text-green-700">
              🟢 {health.data.app} API is {health.data.status}
            </p>
          )}
        </div>
      </section>

      <section className="card" aria-labelledby="uni-heading">
        <h2 id="uni-heading" className="text-lg font-semibold">Universities (from MySQL)</h2>
        <div className="mt-3">
          {universities.loading && <Loading />}
          {universities.error && <ErrorState message={universities.error} onRetry={universities.reload} />}
          {universities.data && universities.data.length === 0 && (
            <EmptyState title="No universities yet." hint="Start the backend with SEED_ENABLED=true." />
          )}
          {universities.data && universities.data.length > 0 && (
            <ul className="divide-y divide-slate-100">
              {universities.data.map((u) => (
                <li key={u.id} className="py-2">
                  <span className="font-medium">{u.name}</span>
                  <span className="ml-2 text-sm text-slate-500">{u.city}, {u.state}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
