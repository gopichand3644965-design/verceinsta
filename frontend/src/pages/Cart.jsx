import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useProducts from '../hooks/useProducts';
import { useStore } from '../context/StoreContext';
import { formatPrice } from '../utils/formatPrice';
import { getUserProfileApi } from '../api';

export default function Cart() {
  const navigate = useNavigate();
  const { state, removeFromCart, clearCart, addOrder } = useStore();
  const products = useProducts();
  const cartItems = state.cart || [];

  const items = cartItems
    .map((item) => ({
      ...item,
      product: products.find((p) => p.id === item.id),
    }))
    .filter((item) => item.product);

  const total = useMemo(
    () => items.reduce((sum, item) => {
      const discountedPrice = item.product.price * (1 - (item.product.discount || 0) / 100);
      return sum + discountedPrice * item.quantity;
    }, 0),
    [items]
  );

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
    if (items.length === 0) return;

    const profile = await loadProfile();
    if (!isProfileComplete(profile)) {
      alert('Please complete your profile before placing an order.');
      navigate('/profile');
      return;
    }

    const orderItems = items.map((item) => {
      const unitPrice = item.product.price * (1 - (item.product.discount || 0) / 100);
      return {
        id: item.product.id,
        title: item.product.title,
        productCode: item.product.productCode,
        image_url: item.product.image_url,
        quantity: item.quantity,
        unitPrice,
        totalPrice: unitPrice * item.quantity,
      };
    });

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
      items: orderItems,
      total,
    };

    addOrder(order);
    clearCart();
    alert('✅ Order placed successfully!');
    navigate('/orders');
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Your Cart</h1>

      {items.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <p className="text-gray-600 dark:text-gray-300 mb-4">Your cart is empty.</p>
          <Link to="/" className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md">Continue shopping</Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.5fr_0.8fr]">
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex gap-4">
                <img src={item.product.image_url} alt={item.product.title} className="w-24 h-24 object-cover rounded-lg" />
                <div className="flex-1">
                  <h2 className="font-semibold text-lg text-gray-900 dark:text-gray-100">{item.product.title}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{item.product.productCode}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Quantity: {item.quantity}</p>
                  <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">{formatPrice(item.product.price)}</p>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <button onClick={() => removeFromCart(item.id)} className="text-red-600 hover:text-red-800 text-sm">Remove</button>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{formatPrice(item.product.price * item.quantity)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Subtotal</span>
                <span>{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Shipping</span>
                <span>Free</span>
              </div>
              <div className="flex justify-between text-base font-semibold text-gray-900 dark:text-gray-100">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>
            <button onClick={handleCheckout} className="w-full bg-primary text-white py-3 rounded-md font-semibold hover:bg-primary-dark transition">Proceed to checkout</button>
            <button onClick={clearCart} className="w-full mt-3 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 py-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-900 transition">Clear cart</button>
          </div>
        </div>
      )}
    </div>
  );
}
