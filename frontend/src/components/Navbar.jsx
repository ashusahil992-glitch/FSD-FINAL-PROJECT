import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold text-brand-700">
          <span aria-hidden="true">🎓</span>
          <span>CampusBazaar</span>
        </Link>
        <p className="hidden text-sm text-slate-500 sm:block">Buy. Sell. Save. Connect.</p>
      </div>
    </header>
  );
}
