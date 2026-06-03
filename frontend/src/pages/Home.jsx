// src/pages/Home.jsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from '../components/ProductCard';
import useProducts from '../hooks/useProducts';
import useSearch from '../hooks/useSearch';
import { FiChevronRight, FiChevronLeft } from 'react-icons/fi';
import { FaInstagram } from 'react-icons/fa';
import { getBannersApi } from '../api';

// banners will be loaded from API

const categories = ['All', 'Trending', 'New Arrivals', 'Plain', 'Polo', 'Graphic', 'Striped'];

export default function Home({ searchQuery = '' }) {
  const [currentBanner, setCurrentBanner] = useState(0);
  const [banners, setBanners] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Auto-slide hero banner
  useEffect(() => {
    let mounted = true;
    getBannersApi().then((data) => {
      if (mounted && Array.isArray(data)) setBanners(data);
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!banners || banners.length === 0) return;
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners]);

  const nextBanner = () => {
    if (!banners || banners.length === 0) return;
    setCurrentBanner((prev) => (prev + 1) % banners.length);
  };
  const prevBanner = () => {
    if (!banners || banners.length === 0) return;
    setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length);
  };

  // Filter products based on search query (case-insensitive)
  const products = useProducts();
  const searchFiltered = useSearch(products, searchQuery);
  
  // Further filter by category if needed
  const categoryFiltered = searchFiltered.filter((p) => {
    if (selectedCategory === 'All') return true;
    if (selectedCategory === 'Trending') return p.isTrending;
    if (selectedCategory === 'New Arrivals') return p.isNewArrival;
    return p.category === selectedCategory;
  });

  const trendingProducts = products.filter(p => p.isTrending);
  const newArrivals = products.filter(p => p.isNewArrival);
  const saleProducts = products.filter(p => p.discount > 0);

  // Reusable section component for horizontal scrolling lists
  const ProductSection = ({ title, products }) => {
    if (!products || products.length === 0) return null;
    return (
      <div className="my-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 px-1">{title}</h2>
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <div key={p.id} className="h-full">
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-4">
      
      {/* Search results override */}
      {searchQuery ? (
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Search Results for "{searchQuery}"</h2>
          {categoryFiltered.length > 0 ? (
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {categoryFiltered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No products found.</p>
          )}
        </div>
      ) : (
        <>
          {/* Hero Banner Slider - Responsive on all screens */}
          <div className="relative w-full h-[150px] sm:h-[250px] md:h-[400px] rounded-xl overflow-hidden group">
            <AnimatePresence initial={false} mode="sync">
                <motion.div
                  key={currentBanner}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0"
                >
                  <div className="absolute inset-0 bg-black/40 z-10" />
                  {banners && banners.length > 0 ? (
                    <img
                      src={banners[currentBanner]?.image}
                      alt="Banner"
                      className="w-full h-full object-cover object-center"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 dark:bg-gray-700" />
                  )}
                <div className="absolute inset-0 z-20 flex flex-col justify-center items-start p-3 sm:p-6 md:p-10 text-white overflow-hidden">
                  <motion.h2 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-lg sm:text-2xl md:text-4xl font-bold mb-1 sm:mb-2 line-clamp-2"
                  >
                    {banners[currentBanner]?.title || 'Welcome'}
                  </motion.h2>
                  <motion.p 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-xs sm:text-sm md:text-lg mb-2 sm:mb-4 max-w-[150px] sm:max-w-xs md:max-w-md line-clamp-2"
                  >
                    {banners[currentBanner]?.subtitle || ''}
                  </motion.p>
                  <div className="mt-2 flex items-center gap-3">
                    <motion.button
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.6 }}
                      className="bg-white text-gray-900 px-3 py-1.5 sm:px-6 sm:py-3 rounded-full font-semibold text-xs sm:text-sm md:text-base hover:bg-gray-100 transition-colors shadow-lg whitespace-normal"
                    >
                      Shop Now
                    </motion.button>
                    <motion.a
                      href="https://www.instagram.com/yourstore"
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Instagram"
                      className="inline-flex items-center justify-center w-10 h-10 p-1 text-white hover:text-pink-400 transition-colors"
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.6 }}
                    >
                      <FaInstagram className="w-5 h-5" />
                    </motion.a>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
            
            {/* Banner Controls - Hidden on mobile */}
            <button 
              onClick={prevBanner}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-30 p-1 sm:p-2 bg-white/30 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex items-center justify-center"
            >
              <FiChevronLeft size={20} className="sm:w-6 sm:h-6" />
            </button>
            <button 
              onClick={nextBanner}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-30 p-1 sm:p-2 bg-white/30 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex items-center justify-center"
            >
              <FiChevronRight size={20} className="sm:w-6 sm:h-6" />
            </button>
            
            {/* Dots */}
            <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-1 sm:gap-2">
              {banners.map((_, idx) => (
                <button 
                  key={idx}
                  onClick={() => setCurrentBanner(idx)}
                  className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all ${idx === currentBanner ? 'bg-white w-3 sm:w-4' : 'bg-white/50'}`}
                />
              ))}
            </div>
          </div>

          {/* Horizontal Category Scroll */}
          <div className="flex overflow-x-auto gap-2 py-4 hide-scrollbar sticky top-[60px] sm:top-[70px] bg-white dark:bg-gray-900 z-20 shadow-sm sm:shadow-none -mx-2 px-2 sm:mx-0 sm:px-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-normal px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === cat 
                  ? 'bg-primary text-white shadow-md' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Sections based on selected category */}
          {selectedCategory === 'All' ? (
            <>
              <ProductSection title="Trending Now" products={trendingProducts} />
              <ProductSection title="New Arrivals" products={newArrivals} />
              <ProductSection title="Hot Deals" products={saleProducts} />
              
              <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 px-1">All Products</h2>
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                  {categoryFiltered.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="pt-2">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 px-1">{selectedCategory}</h2>
              {categoryFiltered.length > 0 ? (
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                  {categoryFiltered.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 py-10 text-center">No products found in this category.</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
