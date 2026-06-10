import { Routes, Route } from 'react-router-dom';
import { AdminAuthProvider } from './AuthContext';
import Products from './pages/Products';
import ProductEdit from './pages/ProductEdit';
import AdminLogin from './pages/AdminLogin';
import AdminProtectedLayout from './AdminProtectedLayout';
import AdminDashboard from './pages/AdminDashboard';
import Orders from './pages/Orders';
import OrderDetails from './pages/OrderDetails';
import Banners from './pages/Banners';
import Settings from './pages/Settings';

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
          <Route path="banners" element={<Banners />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </AdminAuthProvider>
  );
}
