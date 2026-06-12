// src/components/ProductCard.jsx

import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { formatPrice } from '../utils/formatPrice';
import { FiHeart } from 'react-icons/fi';
import RatingStars from './RatingStars';
import { motion } from 'framer-motion';
import { getImageUrl } from '../api';
import React, { memo } from 'react';

const ProductCard = memo(function ProductCard({ product }) {
  const { state, toggleWishlist } = useStore();
  const inWishlist = state.wishlist.includes(product.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3 }}
    >
      {product.link ? (
        <a
          href={product.link}
          target="_blank"
          rel="noopener noreferrer"
          className="group block bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700 h-full flex flex-col"
        >
          <div className="relative aspect-square bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <img
              src={getImageUrl(product.image_url)}
              alt={product.title}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            {/* Wishlist toggle */}
            <button
              onClick={(e) => {
                e.preventDefault();
                toggleWishlist(product.id);
              }}
              className="absolute top-2 left-2 text-primary hover:text-primary-dark transition-colors"
              aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <FiHeart fill={inWishlist ? '#ff6b6b' : 'none'} />
            </button>
          </div>
          <div className="p-3 flex-1 flex flex-col">
            <p className="text-xs text-gray-400 font-mono mb-1">{product.productCode}</p>
            <p className="font-medium text-gray-900 dark:text-gray-100 line-clamp-2 mb-1" title={product.title}>
              {product.title}
            </p>
            <div className="mb-2">
              <RatingStars rating={product.rating} />
            </div>
            <div className="mt-auto">
              {product.discount > 0 ? (
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-lg text-primary">{formatPrice(product.price * (1 - product.discount / 100))}</span>
                  <span className="text-xs text-gray-500 line-through">{formatPrice(product.price)}</span>
                </div>
              ) : (
                <p className="font-bold text-lg text-gray-900 dark:text-gray-100">
                  {formatPrice(product.price)}
                </p>
              )}
            </div>
          </div>
        </a>
      ) : (
        <Link
          to={`/product/${product.id}`}
          className="group block bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700 h-full flex flex-col"
        >
          <div className="relative aspect-square bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <img
              src={getImageUrl(product.image_url)}
              alt={product.title}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            {/* Wishlist toggle */}
            <button
              onClick={(e) => {
                e.preventDefault();
                toggleWishlist(product.id);
              }}
              className="absolute top-2 left-2 text-primary hover:text-primary-dark transition-colors"
              aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <FiHeart fill={inWishlist ? '#ff6b6b' : 'none'} />
            </button>
          </div>
          <div className="p-3 flex-1 flex flex-col">
            <p className="text-xs text-gray-400 font-mono mb-1">{product.productCode}</p>
            <p className="font-medium text-gray-900 dark:text-gray-100 line-clamp-2 mb-1" title={product.title}>
              {product.title}
            </p>
            <div className="mb-2">
              <RatingStars rating={product.rating} />
            </div>
            <div className="mt-auto">
              {product.discount > 0 ? (
                <div className="flex items-baseline gap-2">
                  <span className="font-bold text-lg text-primary">{formatPrice(product.price * (1 - product.discount / 100))}</span>
                  <span className="text-xs text-gray-500 line-through">{formatPrice(product.price)}</span>
                </div>
              ) : (
                <p className="font-bold text-lg text-gray-900 dark:text-gray-100">
                  {formatPrice(product.price)}
                </p>
              )}
            </div>
          </div>
        </Link>
      )}
    </motion.div>
  );
});

export default ProductCard;
