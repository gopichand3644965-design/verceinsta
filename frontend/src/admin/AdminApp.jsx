import { Routes, Route } from 'react-router-dom';
import { AdminAuthProvider } from './AuthContext';
import AdminDashboard from './pages/AdminDashboard';
import Products from './pages/Products';
import ProductEdit from './pages/ProductEdit';
import Orders from './pages/Orders';
import Banners from './pages/Banners';
import Delivery from './pages/Delivery';
import Settings from './pages/Settings';
import Users from './pages/Users';
import CustomerProfile from './pages/CustomerProfile';
import OrderDetails from './pages/OrderDetails';
import Analytics from './pages/Analytics';
import Reviews from './pages/Reviews';
import Coupons from './pages/Coupons';
import AdminLogin from './pages/AdminLogin';
import AdminProtectedLayout from './AdminProtectedLayout';

export default function AdminApp() {
  return (
    <AdminAuthProvider>
      <Routes>
        <Route path="login" element={<AdminLogin />} />
        <Route element={<AdminProtectedLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="products/:id/edit" element={<ProductEdit />} />
          <Route path="products/new" element={<ProductEdit />} />
          <Route path="orders" element={<Orders />} />
          <Route path="orders/:orderId" element={<OrderDetails />} />
          <Route path="customers" element={<Users />} />
          <Route path="customers/:customerKey" element={<CustomerProfile />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="banners" element={<Banners />} />
          <Route path="coupons" element={<Coupons />} />
          <Route path="delivery" element={<Delivery />} />
          <Route path="reports" element={<Analytics />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </AdminAuthProvider>
  );
}
