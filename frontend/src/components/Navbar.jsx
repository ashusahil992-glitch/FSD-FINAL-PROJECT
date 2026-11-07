import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../redux/authSlice.js';
import NotificationBell from './NotificationBell.jsx';

export default function Navbar() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex shrink-0 items-center gap-2.5 text-lg font-bold tracking-tight text-slate-900" aria-label="CampusBazaar home">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-lg text-white" aria-hidden="true">C</span>
          <span>Campus<span className="text-indigo-600">Bazaar</span></span>
        </Link>
        <nav className="hidden items-center gap-5 xl:gap-7 md:flex" aria-label="Main navigation">
          <a href="#categories" className="text-sm font-medium text-slate-600 transition hover:text-indigo-700">Categories</a>
          <a href="#recently-listed" className="text-sm font-medium text-slate-600 transition hover:text-indigo-700">Marketplace</a>
          <Link to="/services" className="text-sm font-medium text-slate-600 transition hover:text-indigo-700">Student services</Link>
          <Link to="/hostel-clearance" className="text-sm font-medium text-slate-600 transition hover:text-indigo-700">Hostel clearance</Link>
          <Link to="/local-deals" className="text-sm font-medium text-slate-600 transition hover:text-indigo-700">Local deals</Link>
          <a href="#safety" className="text-sm font-medium text-slate-600 transition hover:text-indigo-700">Stay Safe</a>
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          {user ? (
            <>
              {user.role === 'ADMIN' && <Link to="/admin" className="rounded-lg px-2 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50">Admin</Link>}
              <Link to="/messages" className="rounded-lg px-2 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Messages</Link>
              <Link to="/wishlist" className="rounded-lg px-2 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Wishlist</Link>
              <Link to="/campus-board" className="rounded-lg px-2 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Campus board</Link>
              {user.role !== 'ADMIN' && <Link to="/verification" className="rounded-lg px-2 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Verification</Link>}
              <NotificationBell />
              <span className="hidden max-w-36 truncate text-sm font-medium text-slate-600 sm:block">{user.fullName}</span>
              <button type="button" onClick={() => dispatch(logout())} className="btn-secondary px-3 py-2.5">Log out</button>
            </>
          ) : (
            <>
              <Link to="/campus-board" className="hidden rounded-lg px-2 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 sm:inline-flex">Campus board</Link>
              <Link to="/wishlist" className="rounded-lg px-2 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">Wishlist</Link>
              <Link to="/login" className="rounded-lg px-2 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 sm:px-3">Sign in</Link>
              <Link to="/register" className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 md:inline-flex">Join</Link>
            </>
          )}
          <Link to="/sell" aria-label="Sell an item" className="btn-primary rounded-xl px-3.5 py-2.5 sm:px-5">
            <span className="mr-1" aria-hidden="true">+</span>
            <span className="hidden sm:inline">Sell an item</span>
            <span className="sm:hidden">Sell</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
