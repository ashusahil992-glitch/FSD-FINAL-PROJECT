import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import ErrorState from '../components/ErrorState.jsx';
import Loading from '../components/Loading.jsx';
import useFetch from '../hooks/useFetch.js';
import { setCredentials } from '../redux/authSlice.js';
import { loginAccount, registerAccount, submitVerificationDocument } from '../services/authService.js';
import { fetchUniversities } from '../services/universityService.js';

export default function AuthPage({ mode }) {
  const isRegister = mode === 'register';
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const authenticated = useSelector((state) => Boolean(state.auth.token && state.auth.user));
  const user = useSelector((state) => state.auth.user);
  const universitiesRequest = useFetch(fetchUniversities);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    studentId: '',
    universityId: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [studentDocument, setStudentDocument] = useState(null);

  useEffect(() => {
    setError('');
    setSubmitting(false);
  }, [mode]);

  if (authenticated) {
    const pendingStudent = isRegister && user?.role === 'STUDENT' && !user.studentVerified;
    return <Navigate to={pendingStudent ? '/verification' : location.state?.from || '/'} replace />;
  }
  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError('');
  }

  function updateStudentDocument(event) {
    const file = event.target.files?.[0] || null;
    setError('');
    if (!file) {
      setStudentDocument(null);
      return;
    }
    const extension = file.name.split('.').pop()?.toLowerCase();
    const validTypes = {
      pdf: 'application/pdf',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
    };
    if (!validTypes[extension] || file.type !== validTypes[extension]) {
      setStudentDocument(null);
      event.target.value = '';
      setError('Upload a PDF, JPG, JPEG, or PNG university ID document.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setStudentDocument(null);
      event.target.value = '';
      setError('The university ID document must be 5 MB or smaller.');
      return;
    }
    setStudentDocument(file);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      let response;
      if (isRegister) {
        response = await registerAccount({
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          password: form.password,
          studentId: form.studentId.trim(),
          universityId: Number(form.universityId),
        })
        if (!studentDocument) {
          setError('Your account was created, but the university ID document is missing. Sign in to submit it.');
          return;
        }
        try {
          await submitVerificationDocument(studentDocument, response.accessToken);
        } catch (uploadError) {
          setError(`Your account was created, but the document was not submitted: ${uploadError.userMessage || 'Please sign in and retry from verification status.'}`);
          return;
        }
      } else {
        response = await loginAccount({ email: form.email.trim(), password: form.password });
      }

      dispatch(setCredentials({ token: response.accessToken, user: response.user }));
      toast.success(isRegister ? 'Account created. Your student verification is pending.' : 'Welcome back!');
      navigate(isRegister ? '/verification' : location.state?.from || '/', { replace: true });
    } catch (requestError) {
      setError(requestError.userMessage || 'Could not complete your request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-[70vh] bg-slate-50 px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-md">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <Link to="/" className="text-sm font-semibold text-indigo-700 hover:text-indigo-900">← Back to marketplace</Link>
          <p className="mt-7 text-sm font-semibold uppercase tracking-wider text-indigo-700">CampusBazaar</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {isRegister ? 'Join your campus' : 'Welcome back'}
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {isRegister
              ? 'Create a student account to get started. Your student ID will stay private while verification is pending.'
              : 'Sign in to your student marketplace account.'}
          </p>

          {isRegister && (
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-5 text-amber-900">
              Upload your university ID card to submit your application. Only an authorized administrator can view the document.
            </div>
          )}

          {error && <div className="mt-5"><ErrorState message={error} /></div>}

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            {isRegister && (
              <>
                <div>
                  <label htmlFor="auth-fullName" className="mb-1.5 block text-sm font-semibold text-slate-800">Full name</label>
                  <input id="auth-fullName" name="fullName" autoComplete="name" value={form.fullName} onChange={updateField} required maxLength={120}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
                </div>
                <div>
                  <label htmlFor="auth-universityId" className="mb-1.5 block text-sm font-semibold text-slate-800">University</label>
                  {universitiesRequest.loading && <Loading lines={1} />}
                  {universitiesRequest.error && <ErrorState message={universitiesRequest.error} onRetry={universitiesRequest.reload} />}
                  {universitiesRequest.data && (
                    <select id="auth-universityId" name="universityId" value={form.universityId} onChange={updateField} required
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100">
                      <option value="" disabled>Select your university</option>
                      {universitiesRequest.data.map((university) => (
                        <option key={university.id} value={university.id}>{university.name} — {university.city}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label htmlFor="auth-studentId" className="mb-1.5 block text-sm font-semibold text-slate-800">Student ID</label>
                  <input id="auth-studentId" name="studentId" autoComplete="off" value={form.studentId} onChange={updateField} required maxLength={50}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
                  <p className="mt-1 text-xs text-slate-500">Stored for verification and never shown in full.</p>
                </div>
                <div>
                  <label htmlFor="auth-student-document" className="mb-1.5 block text-sm font-semibold text-slate-800">University ID document</label>
                  <input id="auth-student-document" type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                    onChange={updateStudentDocument} required
                    className="block w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-indigo-700" />
                  <p className="mt-1 text-xs text-slate-500">PDF, JPG, or PNG up to 5 MB. Stored privately; never shown in public profile or listing APIs.</p>
                </div>
              </>
            )}

            <div>
              <label htmlFor="auth-email" className="mb-1.5 block text-sm font-semibold text-slate-800">Email</label>
              <input id="auth-email" name="email" type="email" autoComplete="email" value={form.email} onChange={updateField} required maxLength={180}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
            </div>

            <div>
              <label htmlFor="auth-password" className="mb-1.5 block text-sm font-semibold text-slate-800">Password</label>
              <input id="auth-password" name="password" type="password" autoComplete={isRegister ? 'new-password' : 'current-password'}
                value={form.password} onChange={updateField} required minLength={isRegister ? 12 : undefined} maxLength={64}
                aria-describedby={isRegister ? 'password-guidance' : undefined}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
              {isRegister && <p id="password-guidance" className="mt-1 text-xs text-slate-500">Use at least 12 characters.</p>}
            </div>

            <button type="submit" disabled={submitting || (isRegister && (!universitiesRequest.data || universitiesRequest.loading))}
              className="btn-primary w-full rounded-xl py-3 disabled:opacity-60">
              {submitting ? 'Please wait…' : isRegister ? 'Create student account' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600">
            {isRegister ? 'Already have an account?' : 'New to CampusBazaar?'}{' '}
            <Link to={isRegister ? '/login' : '/register'} className="font-semibold text-indigo-700 hover:text-indigo-900">
              {isRegister ? 'Sign in' : 'Create an account'}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
