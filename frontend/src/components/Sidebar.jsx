import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const menuItems = [
  { name: 'Home', to: '/' },
  { name: 'Categories', to: '/categories' },
  { name: 'Orders', to: '/orders' },
  { name: 'Cart', to: '/cart' },
  { name: 'Wishlist', to: '/wishlist' },
  { name: 'Settings', to: '/settings' },
];

export default function Sidebar({ isOpen, onClose }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-40 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          {/* Drawer */}
          <motion.aside
            className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-900 z-50 shadow-lg p-4"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween' }}
          >
            <button
              aria-label="Close menu"
              onClick={onClose}
              className="p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <FiX className="w-6 h-6 text-primary" />
            </button>
            <nav className="mt-6 space-y-4">
              {menuItems.map((item) => (
                <div key={item.name}>
                  {item.isAdmin && (
                    <div className="my-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Admin</p>
                    </div>
                  )}
                  <Link
                    to={item.to}
                    onClick={onClose}
                    className={`block text-lg font-medium ${item.isAdmin ? 'text-orange-600 dark:text-orange-400 font-bold' : 'text-gray-700 dark:text-gray-200'} hover:text-primary`}
                  >
                    {item.name}
                  </Link>
                </div>
              ))}
            </nav>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
