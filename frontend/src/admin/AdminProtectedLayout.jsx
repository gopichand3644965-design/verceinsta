import { Outlet, Navigate } from 'react-router-dom';
import { useAdminAuth } from './AuthContext';
import { useState } from 'react';
import AdminSidebar from './components/AdminSidebar';
import AdminTopbar from './components/AdminTopbar';

export default function AdminProtectedLayout() {
  const { admin, loading, logout } = useAdminAuth();
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="rounded-3xl border border-slate-200/80 bg-white px-8 py-10 shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <p className="text-center text-slate-900 dark:text-slate-100">Verifying admin session...</p>
        </div>
      </div>
    );
  }

  if (!admin) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950">
      <AdminSidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} onLogout={logout} />
      <div className="flex-1 flex flex-col w-full overflow-hidden">
        <AdminTopbar onMenuClick={() => setSidebarOpen((current) => !current)} onLogout={logout} />
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
