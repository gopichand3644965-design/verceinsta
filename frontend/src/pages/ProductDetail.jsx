import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import useProducts from '../hooks/useProducts';
import { formatPrice } from '../utils/formatPrice';
import RatingStars from '../components/RatingStars';
import { motion } from 'framer-motion';
import { getImageUrl } from '../api';

export default function ProductDetail() {
  const { id } = useParams();
  const products = useProducts();
  const product = products.find((p) => p.id === id);
  const [imageOverride, setImageOverride] = useState(null);
  const mainImage = imageOverride !== null ? imageOverride : (product?.images?.[0] || product?.image_url || null);
  const imageSrc = mainImage ? getImageUrl(mainImage) : null;

  const [prevProductId, setPrevProductId] = useState(id);
  if (id !== prevProductId) {
    setPrevProductId(id);
    setImageOverride(null);
  }
  const productUrl = typeof window !== 'undefined' ? window.location.href : '';

  if (!product) {
    // If products are still loading, show a loading state
    const productsAvailable = Array.isArray(products) && products.length > 0;
    return (
      <div className="p-4 max-w-xl mx-auto text-center py-20">
        {productsAvailable ? (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-10">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <p className="text-gray-600 dark:text-gray-300 font-medium">Product not found.</p>
            <Link to="/" className="text-primary hover:text-primary-dark font-medium underline mt-4 inline-block transition-colors">
              Back to store
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-primary rounded-full animate-spin"></div>
            <p className="text-sm text-gray-500 animate-pulse font-medium">Loading product details...</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <motion.div
      className="p-4 max-w-xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="space-y-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm p-5">
        {mainImage && (
          <div>
            <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
              <img
                src={imageSrc}
                alt={product.title}
                className="object-cover w-full h-full"
                loading="lazy"
              />
            </div>

            {/* Thumbnails (show up to 3) */}
            {product.images && Array.isArray(product.images) && product.images.length > 0 && (
              <div className="flex gap-2 mt-3">
                {product.images
                  .filter((img) => img && typeof img === 'string')
                  .slice(0, 3)
                  .map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setImageOverride(img)}
                      className={`w-16 h-16 rounded-md overflow-hidden border-2 flex-shrink-0 ${mainImage === img ? 'border-primary' : 'border-transparent'}`}
                      aria-label={`View image ${idx + 1}`}
                    >
                      <img src={getImageUrl(img)} alt={`${product.title} view ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
              </div>
            )}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-[0.25em] mb-1">Product code</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{product.productCode || product.id}</p>
          </div>

          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-[0.25em] mb-1">Price</p>
            <p className="text-2xl font-bold text-primary">
              {formatPrice(product.price * (1 - (product.discount || 0) / 100))}
            </p>
            {product.discount > 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 line-through">
                {formatPrice(product.price)}
              </p>
            )}
          </div>

          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-[0.25em] mb-1">Rating</p>
            <RatingStars rating={product.rating} />
          </div>

          <div>
            <a
              href={product.link || productUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-full items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary/30 transition-all hover:bg-primary-dark active:scale-95"
            >
              Buy from here
            </a>
          </div>
        </div>

        <Link to="/" className="text-primary underline">
          ← Back to products
        </Link>
      </div>
    </motion.div>
  );
}
