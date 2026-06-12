/* eslint-disable no-unused-vars */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../context/StoreContext';
import { getUserProfileApi } from '../api';
import { formatPrice } from '../utils/formatPrice';
import useProducts from '../hooks/useProducts';
import { Link } from 'react-router-dom';
import { FiX, FiTrash2 } from 'react-icons/fi';

function generateOrderId() {
  return `ORD-${Date.now()}`;
}

export default function CartDrawer({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { state, removeFromCart, addOrder, clearCart } = useStore();
  const cartItems = state.cart;

  const products = useProducts();
  const total = cartItems.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.id);
    if (!product) return sum;
    const discountedPrice = product.price * (1 - (product.discount || 0) / 100);
    return sum + discountedPrice * item.quantity;
  }, 0);

  const loadProfile = async () => {
    const stored = localStorage.getItem('userProfile');
    if (stored) {
      return JSON.parse(stored);
    }

    try {
      const user = await getUserProfileApi();
      const profile = user?.profile || user;
      if (profile) {
        localStorage.setItem('userProfile', JSON.stringify(profile));
        return profile;
      }
    } catch (error) {
      console.error('Could not load profile from backend:', error.message);
    }

    return null;
  };

  const isProfileComplete = (profile) => {
    if (!profile) return false;
    const requiredFields = ['firstName', 'lastName', 'email', 'address', 'city', 'country'];
    return requiredFields.every((field) => profile[field]?.trim());
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    
    const profile = await loadProfile();

    if (!isProfileComplete(profile)) {
      alert('⚠️ Profile Incomplete\n\nPlease complete your shipping address in your profile to place an order.');
      onClose();
      navigate('/profile');
      return;
    }

    const orderItems = cartItems.map((item) => {
      const product = products.find((p) => p.id === item.id);
      const unitPrice = product ? product.price * (1 - (product.discount || 0) / 100) : 0;
      return {
        id: item.id,
        title: product?.title || 'Unknown product',
        productCode: product?.productCode || '',
        image_url: product?.image_url || '',
        quantity: item.quantity,
        unitPrice,
        totalPrice: unitPrice * item.quantity,
      };
    });

    const newOrder = {
      id: generateOrderId(),
      date: new Date().toISOString(),
      status: 'Placed',
      shipping: {
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        phone: profile.phone,
        address: profile.address,
        city: profile.city,
        country: profile.country,
      },
      items: orderItems,
      total,
    };

    addOrder(newOrder);
    clearCart();
    onClose();
    alert(`✅ Order Placed!\n\nOrder will be shipped to:\n${profile.firstName} ${profile.lastName}\n${profile.address}\n${profile.city}, ${profile.country}`);
    navigate('/orders');
  };

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
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={onClose}
          />
          {/* Drawer */}
          <motion.div
            className="relative w-80 max-w-full bg-white dark:bg-gray-800 shadow-lg h-full"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold">Cart</h2>
              <button onClick={onClose} aria-label="Close cart">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto flex-1">
              {cartItems.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-300">Your cart is empty.</p>
              ) : (
                cartItems.map((item) => {
                  const product = products.find((p) => p.id === item.id);
                  if (!product) return null;
                  return (
                    <div key={item.id} className="flex items-center mb-4">
                      <img src={product.image_url} alt={product.title} className="w-12 h-12 object-cover rounded mr-3" />
                      <div className="flex-1">
                        <Link to={`/product/${product.id}`} className="font-medium text-gray-900 dark:text-gray-100" onClick={onClose}>
                          {product.title}
                        </Link>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {item.quantity} × {formatPrice(product.price)}
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromCart(product.id)}
                        aria-label="Remove item"
                        className="p-1 text-gray-500 hover:text-red-600"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
            {cartItems.length > 0 && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-lg font-semibold mb-2">Total: {formatPrice(total)}</p>
                <button
                  onClick={handleCheckout}
                  className="w-full bg-primary hover:bg-primary-dark text-white py-2 rounded-md font-semibold transition-colors"
                >
                  Place Order
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
