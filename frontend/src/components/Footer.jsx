export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1fr_auto] md:items-center lg:px-8">
        <div>
          <a href="/" className="inline-flex items-center gap-2 font-bold tracking-tight text-slate-900">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm text-white" aria-hidden="true">C</span>
            <span>Campus<span className="text-indigo-600">Bazaar</span></span>
          </a>
          <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">A better way for students to buy, sell and share what campus life needs.</p>
        </div>
        <nav className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-500" aria-label="Footer navigation">
          <a href="#categories" className="hover:text-indigo-700">Browse categories</a>
          <a href="#student-deals" className="hover:text-indigo-700">Student deals</a>
          <a href="#safety" className="hover:text-indigo-700">Safety tips</a>
        </nav>
        <p className="border-t border-slate-100 pt-5 text-xs text-slate-400 md:col-span-2">
          © {new Date().getFullYear()} CampusBazaar. Built for campus communities.
        </p>
      </div>
    </footer>
  );
}
