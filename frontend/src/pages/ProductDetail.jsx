import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { FiShare2, FiCopy } from 'react-icons/fi';
import { FaWhatsapp, FaFacebookF, FaInstagram, FaTwitter } from 'react-icons/fa';
import useProducts from '../hooks/useProducts';
import { formatPrice } from '../utils/formatPrice';
import { useStore } from '../context/StoreContext';
import { getUserProfileApi } from '../api';
import RatingStars from '../components/RatingStars';
import SizeSelector from '../components/SizeSelector';
import ColorSwatch from '../components/ColorSwatch';
import { motion } from 'framer-motion';

export default function ProductDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const products = useProducts();
  const product = products.find((p) => p.id === id);
  const { addToCart, addOrder, state, toggleWishlist } = useStore();
  const inWishlist = state.wishlist.includes(id);
  const [selectedColor, setSelectedColor] = useState(null);
  const [mainImage, setMainImage] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [hasCheckedProduct, setHasCheckedProduct] = useState(false);
  const shareRef = useRef(null);

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

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareText = `Check out this ${product.title} on Pandas Store!`;

    // Try native Web Share API first
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.title,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (err) {
        console.log('Web Share failed, falling back to copy:', err);
      }
    }

    // Try Clipboard API
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
        return;
      }
    } catch (err) {
      console.log('Clipboard API failed:', err);
    }

    // Fallback to legacy copy method
    try {
      const ta = document.createElement('textarea');
      ta.value = shareUrl;
      ta.style.position = 'fixed';
      ta.style.top = '0';
      ta.style.left = '0';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(ta);
      if (successful) {
        alert('Link copied to clipboard!');
      } else {
        // As a last resort show the link for manual copy
        window.prompt('Copy this link:', shareUrl);
      }
    } catch (err) {
      console.log('Fallback copy failed:', err);
      window.prompt('Copy this link:', shareUrl);
    }
  };

  useEffect(() => {
    function onDoc(e) {
      if (showShareMenu && shareRef.current && !shareRef.current.contains(e.target)) {
        setShowShareMenu(false);
      }
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [showShareMenu]);

  useEffect(() => {
    const timer = setTimeout(() => setHasCheckedProduct(true), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (product) {
      setSelectedColor(product.colors?.[0] || null);
      setMainImage(product.images?.[0] || product.image || null);
    }
  }, [product]);

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareText = product ? `Check out this ${product.title} on Pandas Store!` : 'Check out this product on Pandas Store!';

  const shareToWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
    window.open(url, '_blank');
    setShowShareMenu(false);
  };

  const shareToFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank');
    setShowShareMenu(false);
  };

  const shareToTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, '_blank');
    setShowShareMenu(false);
  };

  const shareToInstagram = async () => {
    // Instagram doesn't support direct web share of URLs reliably; try native share or copy fallback
    if (navigator.share) {
      await handleShare();
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copied — paste into Instagram to share');
      } catch (err) {
        window.prompt('Copy this link to share on Instagram:', shareUrl);
      }
    }
    setShowShareMenu(false);
  };

  const copyLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
      } else {
        const ta = document.createElement('textarea');
        ta.value = shareUrl;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        alert('Link copied to clipboard!');
      }
    } catch (err) {
      window.prompt('Copy this link:', shareUrl);
    }
    setShowShareMenu(false);
  };

  if (!product) {
    return (
      <div className="p-4 text-center">
        {hasCheckedProduct ? (
          <>
            <p className="text-gray-600 dark:text-gray-300">Product not found.</p>
            <Link to="/" className="text-primary underline">
              Back to store
            </Link>
          </>
        ) : (
          <p className="text-gray-600 dark:text-gray-300">Loading product...</p>
        )}
      </div>
    );
  }

  const handleBuyNow = async () => {
    const profile = await loadProfile();

    if (!isProfileComplete(profile)) {
      alert('⚠️ Profile Incomplete\n\nPlease complete your shipping address in your profile to place an order.');
      navigate('/profile');
      return;
    }

    const sanitizedQuantity = Math.max(1, Number(quantity) || 1);
    const unitPrice = product.price * (1 - (product.discount || 0) / 100);
    const totalPrice = unitPrice * sanitizedQuantity;

    const order = {
      id: `ORD-${Date.now()}`,
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
      items: [
        {
          id: product.id,
          title: product.title,
          productCode: product.productCode,
          image: product.image,
          quantity: sanitizedQuantity,
          unitPrice,
          totalPrice,
        },
      ],
      total: totalPrice,
    };

    addOrder(order);
    alert(`✅ Order Placed!\n\nOrder will be shipped to:\n${profile.firstName} ${profile.lastName}\n${profile.address}\n${profile.city}, ${profile.country}`);
    navigate('/orders');
  };

  return (
    <motion.div
      className="p-4 max-w-xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="flex flex-col space-y-4">
        {/* Image Gallery */}
        <div className="flex flex-col gap-2">
          <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center">
            <motion.img
              key={mainImage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              src={mainImage}
              alt={product.title}
              className="object-cover w-full h-full"
              loading="lazy"
            />
          </div>
          {product.images && product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setMainImage(img)}
                  className={`w-16 h-16 rounded-md overflow-hidden border-2 flex-shrink-0 ${mainImage === img ? 'border-primary' : 'border-transparent'}`}
                >
                  <img src={img} alt={`${product.title} view ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Title & Info */}
        <div className="flex justify-between items-start gap-4">
          <div>
            <p className="text-xs text-gray-400 font-mono mb-1">{product.productCode}</p>
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              {product.title}
            </h1>
          </div>
          <div className="relative" ref={shareRef}>
            <button
              onClick={() => setShowShareMenu((s) => !s)}
              className="p-2 text-gray-500 hover:text-primary transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Share"
            >
              <FiShare2 size={20} />
            </button>

            {showShareMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-40 py-2">
                <button onClick={shareToWhatsApp} className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3">
                  <FaWhatsapp className="w-4 h-4 text-green-600" /> <span className="text-sm">WhatsApp</span>
                </button>
                <button onClick={shareToFacebook} className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3">
                  <FaFacebookF className="w-4 h-4 text-blue-600" /> <span className="text-sm">Facebook</span>
                </button>
                <button onClick={shareToInstagram} className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3">
                  <FaInstagram className="w-4 h-4 text-pink-500" /> <span className="text-sm">Instagram</span>
                </button>
                <button onClick={shareToTwitter} className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3">
                  <FaTwitter className="w-4 h-4 text-sky-500" /> <span className="text-sm">Twitter</span>
                </button>
                <div className="border-t border-gray-100 dark:border-gray-700 mt-2 pt-2">
                  <button onClick={copyLink} className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3">
                    <FiCopy className="w-4 h-4" /> <span className="text-sm">Copy link</span>
                  </button>
                  <button onClick={handleShare} className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3">
                    <FiShare2 className="w-4 h-4" /> <span className="text-sm">Share via apps</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          {product.discount > 0 ? (
            <>
              <span className="text-primary">{formatPrice(product.price * (1 - product.discount / 100))}</span>
              <span className="text-sm text-gray-500 line-through font-normal">{formatPrice(product.price)}</span>
              <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold ml-2">-{product.discount}% OFF</span>
            </>
          ) : (
            <span>{formatPrice(product.price)}</span>
          )}
        </p>
        {/* Rating */}
        <RatingStars rating={product.rating} />
        {/* Color & size selectors */}
        <ColorSwatch colors={product.colors} selected={selectedColor} onSelect={setSelectedColor} />
        <SizeSelector sizes={product.sizes} />
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
            <span>Quantity</span>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(event) => {
                const raw = event.target.value;
                setQuantity(raw === '' ? '' : Math.max(1, Number(raw)));
              }}
              className="w-20 rounded-md border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-primary focus:ring-primary"
            />
          </label>
        </div>
        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            onClick={() => addToCart(product.id)}
            className="flex-1 min-w-24 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-md transition-colors font-semibold"
          >
            Add to Cart
          </button>
          <button
            onClick={handleBuyNow}
            className="flex-1 min-w-24 px-4 py-2 border border-primary text-primary rounded-md font-semibold hover:bg-primary hover:text-white transition-colors"
          >
            Buy Now
          </button>
          <button
            onClick={() => toggleWishlist(product.id)}
            className="p-2 rounded-md border border-gray-300 dark:border-gray-600"
            aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            {inWishlist ? '♥' : '♡'}
          </button>
        </div>
        <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Description</h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
            {product.description}
          </p>
        </div>
        <Link to="/" className="text-primary underline mt-4">
          ← Continue Shopping
        </Link>
      </div>
    </motion.div>
  );
}
