import { NavLink } from 'react-router-dom';
import { FiPackage, FiLogOut, FiTrendingUp, FiShoppingBag, FiImage, FiSettings } from 'react-icons/fi';

const links = [
  { name: 'Dashboard', to: '/admin/dashboard', icon: <FiTrendingUp size={18} /> },
  { name: 'Products', to: '/admin/products', icon: <FiPackage size={18} /> },
  { name: 'Orders', to: '/admin/orders', icon: <FiShoppingBag size={18} /> },
  { name: 'Banners', to: '/admin/banners', icon: <FiImage size={18} /> },
  { name: 'Settings', to: '/admin/settings', icon: <FiSettings size={18} /> },
];

export default function AdminSidebar({ isOpen = false, onClose = () => {}, onLogout = () => {} }) {
  return (
    <>
      <aside className="w-72 bg-slate-950 text-slate-100 border-r border-white/10 p-6 hidden md:flex flex-col">
        <div className="mb-8">
          <div className="inline-flex items-center gap-3 rounded-3xl bg-slate-900 px-4 py-3 shadow-[0_20px_60px_rgba(15,23,42,0.35)]">
            <div className="h-10 w-10 grid place-items-center rounded-2xl bg-orange-500 text-white text-lg font-bold">F</div>
            <div>
              <h2 className="text-xl font-semibold">FULLWB</h2>
              <p className="text-sm text-slate-400">Premium Admin</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-3xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? 'bg-white/10 text-white shadow-lg shadow-slate-900/20'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <span className="text-slate-300 group-hover:text-white">{link.icon}</span>
              {link.name}
            </NavLink>
          ))}
        </nav>

        <button
          type="button"
          onClick={onLogout}
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 hover:bg-white/10 transition"
        >
          <FiLogOut size={18} />
          Logout
        </button>
      </aside>

      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={onClose} />
          <div className="absolute left-0 top-0 bottom-0 w-72 max-w-[85vw] bg-slate-950 p-5 overflow-y-auto shadow-2xl">
            <div className="mb-8 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold text-white">FULLWB</h2>
                <p className="text-sm text-slate-400">Premium Admin</p>
              </div>
              <button onClick={onClose} className="rounded-2xl border border-white/10 px-3 py-2 text-sm text-slate-200">Close</button>
            </div>
            <nav className="space-y-2">
              {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={onClose}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-3xl px-4 py-3 text-sm font-medium transition ${
                    isActive
                      ? 'bg-white/10 text-white shadow-lg shadow-slate-900/20'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                <span>{link.icon}</span>
                {link.name}
              </NavLink>
            ))}
            </nav>
            <button
              type="button"
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 hover:bg-white/10 transition"
            >
              <FiLogOut size={18} />
              Logout
            </button>
          </div>
        </div>
      )}
    </>
  );
}
