import { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import CartDrawer from './components/CartDrawer';
import WishlistDrawer from './components/WishlistDrawer';
import Wishlist from './pages/Wishlist';
import Cart from './pages/Cart';
import Orders from './pages/Orders';
import Profile from './pages/Profile';
import AdminApp from './admin/AdminApp';

export default function App() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  // Search state (persisted in localStorage)
  const [searchQuery, setSearchQuery] = useState(() => {
    const stored = localStorage.getItem('searchQuery');
    return stored || '';
  });

  // Persist search query
  useEffect(() => {
    localStorage.setItem('searchQuery', searchQuery);
  }, [searchQuery]);

  // Drawer state
  const [isCartOpen, setCartOpen] = useState(false);
  const [isWishlistOpen, setWishlistOpen] = useState(false);
  const openCart = () => setCartOpen(true);
  const closeCart = () => setCartOpen(false);
  const openWishlist = () => setWishlistOpen(true);
  const closeWishlist = () => setWishlistOpen(false);

  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  if (isAdmin) {
    return (
      <Routes>
        <Route path="/admin/*" element={<AdminApp />} />
      </Routes>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white dark:bg-gray-900">
      <Header
        onMenuClick={toggleSidebar}
        onCartClick={openCart}
        onWishlistClick={openWishlist}
        query={searchQuery}
        setQuery={setSearchQuery}
      />
      <Sidebar isOpen={isSidebarOpen} onClose={toggleSidebar} />
      <div className="max-w-7xl mx-auto w-full">
        <main className="flex-1 p-3 sm:p-4 overflow-x-hidden">
          <Routes>
            <Route path="/" element={<Home searchQuery={searchQuery} />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<Home searchQuery={searchQuery} />} />
          </Routes>
        </main>
      </div>
      <CartDrawer isOpen={isCartOpen} onClose={closeCart} />
      <WishlistDrawer isOpen={isWishlistOpen} onClose={closeWishlist} />
    </div>
  );
}
