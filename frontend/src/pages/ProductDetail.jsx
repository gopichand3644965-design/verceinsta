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
  const mainImage = imageOverride !== null ? imageOverride : (product?.images?.[0] || product?.image || null);
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
      <div className="p-4 text-center">
        {productsAvailable ? (
          <>
            <p className="text-gray-600 dark:text-gray-300">Product not found.</p>
            <Link to="/" className="text-primary underline mt-4 inline-block">
              Back to store
            </Link>
          </>
        ) : (
          <p className="text-gray-600 dark:text-gray-300">Loading product...</p>
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
            {product.images && product.images.length > 0 && (
              <div className="flex gap-2 mt-3">
                {product.images.slice(0, 3).map((img, idx) => (
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
              className="inline-flex w-full items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-primary-dark"
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
