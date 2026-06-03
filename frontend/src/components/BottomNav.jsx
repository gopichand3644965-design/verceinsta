import { NavLink } from 'react-router-dom';
import { FiHome, FiSearch, FiHeart, FiShoppingCart, FiUser } from 'react-icons/fi';

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 z-30 md:hidden">
      <ul className="flex justify-around p-2">
        <li>
          <NavLink to="/" end className="flex flex-col items-center text-sm text-gray-600 dark:text-gray-300 hover:text-primary">
            <FiHome className="w-6 h-6" />
            <span>Home</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/search" className="flex flex-col items-center text-sm text-gray-600 dark:text-gray-300 hover:text-primary">
            <FiSearch className="w-6 h-6" />
            <span>Search</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/wishlist" className="flex flex-col items-center text-sm text-gray-600 dark:text-gray-300 hover:text-primary">
            <FiHeart className="w-6 h-6" />
            <span>Wishlist</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/cart" className="flex flex-col items-center text-sm text-gray-600 dark:text-gray-300 hover:text-primary">
            <FiShoppingCart className="w-6 h-6" />
            <span>Cart</span>
          </NavLink>
        </li>
        <li>
          <NavLink to="/profile" className="flex flex-col items-center text-sm text-gray-600 dark:text-gray-300 hover:text-primary">
            <FiUser className="w-6 h-6" />
            <span>Profile</span>
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}
