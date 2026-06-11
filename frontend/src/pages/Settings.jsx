import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/admin/dashboard', { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="rounded-[32px] border border-slate-200 bg-white px-8 py-10 shadow-xl shadow-slate-200/50 dark:border-slate-700 dark:bg-slate-900 text-center">
        <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Admin Portal</p>
        <h1 className="mt-4 text-3xl font-semibold text-slate-900 dark:text-white">Opening admin dashboard…</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Redirecting to admin access without requiring a login.</p>
      </div>
    </div>
  );
}
