import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ErrorState from '../components/ErrorState.jsx';
import Loading from '../components/Loading.jsx';
import useFetch from '../hooks/useFetch.js';
import { fetchVerificationProfile, submitVerificationDocument } from '../services/verificationService.js';

const statusStyles = {
  PENDING: 'bg-amber-100 text-amber-900',
  VERIFIED: 'bg-emerald-100 text-emerald-900',
  REJECTED: 'bg-red-100 text-red-900',
};

function isValidDocument(file) {
  const extension = file.name.split('.').pop()?.toLowerCase();
  const validTypes = { pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png' };
  return validTypes[extension] === file.type && file.size <= 5 * 1024 * 1024;
}

export default function VerificationStatus() {
  const token = useSelector((state) => state.auth.token);
  const profileRequest = useFetch(fetchVerificationProfile);
  const [document, setDocument] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function submit(event) {
    event.preventDefault();
    if (!document || !isValidDocument(document)) {
      setError('Choose a valid PDF, JPG, or PNG file no larger than 5 MB.');
      return;
    }
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await submitVerificationDocument(document);
      setDocument(null);
      setSuccess('Your verification document was submitted successfully.');
      await profileRequest.reload();
    } catch (requestError) {
      setError(requestError.userMessage || 'Could not submit your verification document.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Sign in to check verification</h1>
        <Link to="/login" className="btn-primary mt-6 inline-flex rounded-xl px-5 py-3">Sign in</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <Link to="/" className="text-sm font-semibold text-indigo-700 hover:text-indigo-900">← Back to marketplace</Link>
      <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9" aria-labelledby="verification-heading">
        <p className="text-sm font-semibold uppercase tracking-wider text-indigo-700">Student account</p>
        <h1 id="verification-heading" className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Student verification</h1>
        {profileRequest.loading && <div className="mt-6"><Loading lines={3} /></div>}
        {profileRequest.error && <div className="mt-6"><ErrorState message={profileRequest.error} onRetry={profileRequest.reload} /></div>}
        {profileRequest.data && (
          <>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className={`rounded-full px-3 py-1.5 text-sm font-bold ${statusStyles[profileRequest.data.status]}`}>
                {profileRequest.data.status}
              </span>
              <span className="text-sm text-slate-600">{profileRequest.data.university || 'University not selected'}</span>
              {profileRequest.data.maskedStudentId && <span className="text-sm text-slate-500">Student ID {profileRequest.data.maskedStudentId}</span>}
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              {profileRequest.data.status === 'VERIFIED'
                ? 'Your student identity is verified. You can now use student marketplace features.'
                : profileRequest.data.status === 'REJECTED'
                  ? 'Your application was rejected. Review the reason below and upload a corrected document.'
                  : 'Your application is pending review. You can use the marketplace to browse while student-only actions remain restricted.'}
            </p>
            {profileRequest.data.status === 'REJECTED' && profileRequest.data.rejectionReason && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4" role="status">
                <h2 className="text-sm font-semibold text-red-900">Reason for rejection</h2>
                <p className="mt-1 whitespace-pre-wrap text-sm text-red-800">{profileRequest.data.rejectionReason}</p>
              </div>
            )}
            {success && <p role="status" className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{success}</p>}
            {profileRequest.data.canSubmitDocument && (
              <form onSubmit={submit} className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
                <h2 className="font-semibold text-slate-900">{profileRequest.data.status === 'REJECTED' ? 'Resubmit corrected document' : 'Submit university ID document'}</h2>
                <label htmlFor="verification-document" className="mt-3 block text-sm font-medium text-slate-700">University ID card or enrollment document</label>
                <input id="verification-document" type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" required
                  onChange={(event) => {
                    setDocument(event.target.files?.[0] || null);
                    setError('');
                  }}
                  className="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-indigo-700" />
                <p className="mt-1 text-xs text-slate-500">PDF, JPG, or PNG up to 5 MB. This document is private and accessible only to you and authorized administrators.</p>
                {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
                <button type="submit" disabled={submitting || !document} className="btn-primary mt-4 rounded-xl px-5 py-3 disabled:opacity-60">
                  {submitting ? 'Submitting…' : 'Submit for verification'}
                </button>
              </form>
            )}
            <section className="mt-8 border-t border-slate-100 pt-6" aria-labelledby="verification-history-heading">
              <h2 id="verification-history-heading" className="font-semibold text-slate-900">Verification history</h2>
              {profileRequest.data.history.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">No documents have been submitted yet.</p>
              ) : (
                <ol className="mt-3 space-y-3">
                  {profileRequest.data.history.map((item) => (
                    <li key={item.id} className="rounded-xl border border-slate-200 p-4">
                      <div className="flex flex-wrap justify-between gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusStyles[item.status]}`}>{item.status}</span>
                        <time className="text-xs text-slate-500" dateTime={item.submittedAt}>
                          Submitted {new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(item.submittedAt))}
                        </time>
                      </div>
                      {item.rejectionReason && <p className="mt-2 text-sm text-red-800">{item.rejectionReason}</p>}
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </>
        )}
      </section>
    </main>
  );
}
