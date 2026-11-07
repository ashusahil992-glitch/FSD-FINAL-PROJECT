import { useCallback, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ErrorState from '../components/ErrorState.jsx';
import Loading from '../components/Loading.jsx';
import useFetch from '../hooks/useFetch.js';
import {
  createCampusPost,
  deleteCampusPost,
  fetchCampusPosts,
  resolveCampusPost,
} from '../services/campusBoardService.js';

const postTypes = [
  { value: 'LOST', label: 'Lost item' },
  { value: 'FOUND', label: 'Found item' },
  { value: 'ANNOUNCEMENT', label: 'Campus announcement' },
];

export default function CampusBoard() {
  const navigate = useNavigate();
  const token = useSelector((state) => state.auth.token);
  const user = useSelector((state) => state.auth.user);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [form, setForm] = useState({ title: '', description: '', location: '', type: 'LOST' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [actionError, setActionError] = useState('');
  const loadPosts = useCallback(() => (token ? fetchCampusPosts() : Promise.resolve([])), [token]);
  const postsRequest = useFetch(loadPosts);
  const posts = (postsRequest.data || []).filter((post) => typeFilter === 'ALL' || post.type === typeFilter);

  async function submitPost(event) {
    event.preventDefault();
    if (!token) {
      navigate('/login');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      await createCampusPost({
        ...form,
        title: form.title.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
      });
      setForm({ title: '', description: '', location: '', type: 'LOST' });
      postsRequest.reload();
    } catch (error) {
      setFormError(error.userMessage || 'Could not publish your campus post.');
    } finally {
      setSubmitting(false);
    }
  }

  async function runPostAction(action, id) {
    setActionError('');
    try {
      await action(id);
      postsRequest.reload();
    } catch (error) {
      setActionError(error.userMessage || 'Could not update this campus post.');
    }
  }

  if (!token) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-3xl font-bold text-slate-900">Campus board</h1>
        <p className="mt-3 text-slate-600">Sign in to see notices shared with your university community.</p>
        <Link to="/login" className="btn-primary mt-6">Sign in to continue</Link>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] bg-slate-50 px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-indigo-700">Your campus, together</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Campus board</h1>
            <p className="mt-3 max-w-2xl text-slate-600">Share lost and found notices, or post an announcement for your university community.</p>
          </div>
          {user?.university && <span className="rounded-full bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-800">{user.university}</span>}
        </div>

        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <section aria-labelledby="board-posts-heading">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <h2 id="board-posts-heading" className="text-xl font-bold text-slate-900">Community posts</h2>
              <label className="text-sm font-medium text-slate-700">
                Show
                <select aria-label="Filter campus posts" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}
                  className="ml-2 rounded-lg border border-slate-300 bg-white px-3 py-2">
                  <option value="ALL">All posts</option>
                  <option value="LOST">Lost</option>
                  <option value="FOUND">Found</option>
                  <option value="ANNOUNCEMENT">Announcements</option>
                </select>
              </label>
            </div>

            {postsRequest.loading && <div className="card"><Loading lines={4} /></div>}
            {postsRequest.error && <ErrorState message={postsRequest.error} onRetry={postsRequest.reload} />}
            {actionError && <p role="alert" className="mb-4 text-sm text-red-700">{actionError}</p>}
            {!postsRequest.loading && posts.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                <h3 className="font-semibold text-slate-900">No posts here yet</h3>
                <p className="mt-2 text-sm text-slate-600">Post a notice to help your campus community.</p>
              </div>
            )}
            <div className="space-y-4">
              {posts.map((post) => {
                const isOwner = user?.id != null && String(user.id) === String(post.authorId);
                const typeLabel = postTypes.find((type) => type.value === post.type)?.label || post.type;
                return (
                  <article key={post.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        post.type === 'LOST' ? 'bg-rose-50 text-rose-800'
                          : post.type === 'FOUND' ? 'bg-emerald-50 text-emerald-800' : 'bg-indigo-50 text-indigo-800'
                      }`}>{typeLabel}</span>
                      <span className={`text-xs font-semibold ${post.status === 'RESOLVED' ? 'text-emerald-700' : 'text-slate-500'}`}>
                        {post.status === 'RESOLVED' ? 'Resolved' : 'Open'}
                      </span>
                    </div>
                    <h3 className="mt-3 text-lg font-bold text-slate-900">{post.title}</h3>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{post.description}</p>
                    <p className="mt-3 text-sm text-slate-600"><strong className="font-semibold text-slate-800">Location:</strong> {post.location}</p>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
                      <span>{post.authorName}{post.authorVerified ? ' · Verified student' : ''} · {post.universityName}</span>
                      <time dateTime={post.createdAt}>{new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(post.createdAt))}</time>
                    </div>
                    {isOwner && post.status === 'OPEN' && (
                      <div className="mt-4 flex gap-3">
                        <button type="button" className="btn-secondary px-3 py-2"
                          onClick={() => runPostAction(resolveCampusPost, post.id)}>Mark resolved</button>
                        <button type="button" className="btn-secondary px-3 py-2 text-red-700"
                          onClick={() => runPostAction(deleteCampusPost, post.id)}>Remove post</button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>

          <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Post to your campus</h2>
            {token ? (
              <form className="mt-4 space-y-4" onSubmit={submitPost}>
                <label className="block text-sm font-semibold text-slate-800" htmlFor="campus-post-type">Post type
                  <select id="campus-post-type" required value={form.type}
                    onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 font-normal">
                    {postTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                  </select>
                </label>
                <label className="block text-sm font-semibold text-slate-800" htmlFor="campus-post-title">Title
                  <input id="campus-post-title" required maxLength={140} value={form.title}
                    onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                    className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal" />
                </label>
                <label className="block text-sm font-semibold text-slate-800" htmlFor="campus-post-description">Details
                  <textarea id="campus-post-description" required maxLength={2000} rows={4} value={form.description}
                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                    className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal" />
                </label>
                <label className="block text-sm font-semibold text-slate-800" htmlFor="campus-post-location">Campus location
                  <input id="campus-post-location" required maxLength={180} placeholder="e.g. Library entrance" value={form.location}
                    onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))}
                    className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 font-normal" />
                </label>
                <p className="text-xs leading-5 text-slate-500">Do not post phone numbers, student IDs, or private contact details. Use platform messaging for follow-up.</p>
                {formError && <p role="alert" className="text-sm text-red-700">{formError}</p>}
                <button type="submit" disabled={submitting} className="btn-primary w-full justify-center disabled:opacity-60">
                  {submitting ? 'Posting…' : 'Publish post'}
                </button>
              </form>
            ) : (
              <div className="mt-3">
                <p className="text-sm leading-6 text-slate-600">Sign in to create a campus notice. Your university is taken from your account.</p>
                <Link to="/login" className="btn-primary mt-4 w-full justify-center">Sign in to post</Link>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
