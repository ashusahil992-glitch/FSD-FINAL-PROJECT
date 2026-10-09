export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white py-6 text-center text-sm text-slate-500">
      © {new Date().getFullYear()} CampusBazaar · Demo project for verified students
    </footer>
  );
}
