import { useEffect, useState } from 'react';
import { FiBell, FiSearch, FiMoon, FiSun, FiMenu, FiCalendar, FiChevronDown, FiLogOut } from 'react-icons/fi';
import { useAdminAuth } from '../AuthContext';

export default function AdminTopbar({ onMenuClick = () => {}, onLogout = () => {} }) {
  const { admin } = useAdminAuth();
  const [query, setQuery] = useState('');
  const [theme, setTheme] = useState(() => localStorage.getItem('adminTheme') || 'light');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('adminTheme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  };

  return (
    <header className="flex flex-col gap-3 px-4 py-4 border-b border-slate-200/80 bg-white/95 backdrop-blur dark:bg-slate-950/95 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 shadow-sm transition hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
        >
          <FiMenu size={20} />
        </button>
        <div className="rounded-3xl border border-slate-200/80 bg-slate-100 px-4 py-3 hidden sm:flex items-center gap-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <FiSearch size={18} className="text-slate-400" />
          <input
            type="search"
            placeholder="Search dashboard..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400 dark:text-slate-200 dark:placeholder:text-slate-500"
          />
        </div>
      </div>

      <div className="flex flex-1 items-center justify-between gap-3 md:justify-end">
        <div className="hidden sm:flex items-center gap-3 rounded-3xl border border-slate-200/80 bg-slate-100 px-4 py-3 text-sm text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          <FiCalendar size={18} />
          <span>{new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
          <FiChevronDown size={16} className="text-slate-400" />
        </div>

        <div className="hidden sm:flex items-center gap-2 rounded-3xl border border-slate-200/80 bg-slate-100 px-3 py-2 text-sm text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          <label className="sr-only" htmlFor="admin-date-picker">Select Date</label>
          <input
            id="admin-date-picker"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full bg-transparent outline-none text-sm text-slate-700 dark:text-slate-200"
          />
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200/80 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          {theme === 'light' ? <FiMoon size={18} /> : <FiSun size={18} />}
        </button>

        <button className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200/80 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
          <FiBell size={18} />
          <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1.5 text-[11px] font-semibold text-white">3</span>
        </button>

        <div className="hidden sm:flex items-center gap-3 rounded-3xl border border-slate-200/80 bg-white px-4 py-2 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-400 text-white">
            {admin?.name?.slice(0, 1) || 'A'}
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-sm font-semibold text-slate-900 dark:text-white">{admin?.name || 'Admin'}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{admin?.role || 'Administrator'}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="inline-flex h-11 items-center gap-2 rounded-3xl border border-slate-200/80 bg-slate-100 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          <FiLogOut size={18} />
          Sign out
        </button>
      </div>
    </header>
  );
}
