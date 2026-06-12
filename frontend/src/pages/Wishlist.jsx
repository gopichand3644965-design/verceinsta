import { Link } from 'react-router-dom';
import useProducts from '../hooks/useProducts';
import { useStore } from '../context/StoreContext';
import { formatPrice } from '../utils/formatPrice';

export default function Wishlist() {
  const { state, addToCart, toggleWishlist } = useStore();
  const wishlistIds = state.wishlist || [];
  const products = useProducts();
  const items = wishlistIds.map((id) => products.find((p) => p.id === id)).filter(Boolean);

  const handleAddToCart = (id) => {
    addToCart(id);
  };

  if (items.length === 0) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Wishlist</h1>
        <p className="text-gray-600 dark:text-gray-300">Your wishlist is empty.</p>
        <Link to="/" className="text-primary underline mt-2 inline-block">Continue shopping</Link>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Wishlist</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((p) => (
          <div key={p.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 border shadow-sm">
            <Link to={`/product/${p.id}`} className="block">
              <img src={p.image_url} alt={p.title} className="w-full h-44 object-cover rounded-md mb-3" />
            </Link>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">{p.title}</h3>
                <p className="text-sm text-gray-500">{formatPrice(p.price)}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <button onClick={() => handleAddToCart(p.id)} className="bg-primary text-white px-3 py-1 rounded-md text-sm">Add to cart</button>
                <button onClick={() => toggleWishlist(p.id)} className="text-sm text-red-600">Remove</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
