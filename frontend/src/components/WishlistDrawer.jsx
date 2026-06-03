// src/components/WishlistDrawer.jsx

import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../context/StoreContext';
import { Link } from 'react-router-dom';
import { FiX, FiHeart } from 'react-icons/fi';
import useProducts from '../hooks/useProducts';
import { formatPrice } from '../utils/formatPrice';

export default function WishlistDrawer({ isOpen, onClose }) {
  const { state, toggleWishlist } = useStore();
  const wishlist = state.wishlist;

  const products = useProducts();
  const items = wishlist
    .map((id) => products.find((p) => p.id === id))
    .filter(Boolean);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-40 flex justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
          {/* Drawer */}
          <motion.div
            className="relative w-80 max-w-full bg-white dark:bg-gray-800 shadow-lg h-full"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold">Wishlist</h2>
              <button onClick={onClose} aria-label="Close wishlist">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              {items.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-300">Your wishlist is empty.</p>
              ) : (
                items.map((product) => (
                  <div key={product.id} className="flex items-center mb-4">
                    <img src={product.image} alt={product.title} className="w-12 h-12 object-cover rounded mr-3" />
                    <div className="flex-1">
                      <Link to={`/product/${product.id}`} className="font-medium text-gray-900 dark:text-gray-100" onClick={onClose}>
                        {product.title}
                      </Link>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {product.price != null && formatPrice(product.price)}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleWishlist(product.id)}
                      aria-label="Remove from wishlist"
                      className="p-1 text-gray-500 hover:text-red-600"
                    >
                      <FiHeart />
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
