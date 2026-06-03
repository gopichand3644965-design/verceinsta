import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMenu, FiHeart, FiShoppingCart, FiUser, FiInstagram, FiSearch } from 'react-icons/fi';
import SearchBar from './SearchBar';

export default function Header({ onMenuClick, onCartClick, onWishlistClick, query, setQuery }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between p-1 sm:p-3 gap-1 sm:gap-2 w-full">
        {/* Hamburger */}
        <button
          aria-label="Open menu"
          onClick={onMenuClick}
          className="p-1.5 sm:p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary flex-shrink-0"
        >
          <FiMenu className="w-5 sm:w-6 h-5 sm:h-6 text-primary" />
        </button>

        {/* Search bar – desktop only */}
        <div className="hidden sm:flex flex-1 mx-2">
          <SearchBar query={query} setQuery={setQuery} />
        </div>

        {/* Mobile search dropdown */}
        {searchOpen && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute left-0 right-0 top-full mt-0 bg-white dark:bg-gray-800 p-2 shadow-lg rounded-b-md sm:hidden z-50"
            >
              <SearchBar query={query} setQuery={setQuery} onClose={() => setSearchOpen(false)} />
            </motion.div>
          </AnimatePresence>
        )}

        {/* Icons */}
        <div className="flex items-center gap-1 sm:space-x-3 flex-shrink-0">
          {/* Mobile search icon */}
          <button
            aria-label="Search"
            onClick={() => setSearchOpen((v) => !v)}
            className="p-1.5 sm:hidden rounded-md focus:outline-none focus:ring-2 focus:ring-primary flex-shrink-0"
          >
            <FiSearch className="w-5 h-5 text-primary" />
          </button>

          <a href="https://instagram.com/pandas" target="_blank" rel="noreferrer" aria-label="Instagram" className="hidden sm:block p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <FiInstagram className="w-5 h-5 text-gray-700 dark:text-gray-300 hover:text-pink-600 transition-colors" />
          </a>
          <button aria-label="Wishlist" className="p-1.5 sm:p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0" onClick={onWishlistClick}>
            <FiHeart className="w-5 sm:w-5 h-5 sm:h-5 text-primary" />
          </button>
          <button aria-label="Cart" className="p-1.5 sm:p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0" onClick={onCartClick}>
            <FiShoppingCart className="w-5 sm:w-5 h-5 sm:h-5 text-primary" />
          </button>
          <button aria-label="Profile" className="p-1.5 sm:p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-primary hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0" onClick={() => navigate('/profile')}>
            <FiUser className="w-5 sm:w-5 h-5 sm:h-5 text-primary" />
          </button>
        </div>
      </div>
    </header>
  );
}
