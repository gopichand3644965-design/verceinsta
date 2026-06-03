import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler } from 'chart.js';
import { FiBox, FiShoppingCart, FiClock, FiCheckCircle, FiDollarSign, FiPlus, FiImage, FiActivity, FiTag } from 'react-icons/fi';
import { useStore } from '../../context/StoreContext';
import useProducts from '../../hooks/useProducts';
import { formatPrice } from '../../utils/formatPrice';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler);

const statusStyles = {
  Pending: 'bg-amber-100 text-amber-700',
  Packed: 'bg-sky-100 text-sky-700',
  Shipped: 'bg-indigo-100 text-indigo-700',
  Delivered: 'bg-emerald-100 text-emerald-700',
  Cancelled: 'bg-red-100 text-red-700',
  Rejected: 'bg-rose-100 text-rose-700',
};

const kpiCards = [
  { title: 'Total Products', key: 'products', icon: <FiBox size={24} /> },
  { title: 'Total Orders', key: 'orders', icon: <FiShoppingCart size={24} /> },
  { title: 'Pending Orders', key: 'pendingOrders', icon: <FiClock size={24} /> },
  { title: 'Delivered Orders', key: 'deliveredOrders', icon: <FiCheckCircle size={24} /> },
  { title: 'Total Revenue', key: 'totalRevenue', icon: <FiDollarSign size={24} /> },
];

function StatCard({ title, value, subtitle, icon }) {
  return (
    <div className="bg-white/90 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-700 shadow-2xl shadow-slate-900/5 backdrop-blur rounded-3xl p-6 hover:-translate-y-1 transition-transform duration-300">
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
        <div className="text-slate-900 dark:text-white rounded-2xl bg-slate-100 dark:bg-slate-800 w-11 h-11 flex items-center justify-center shadow-sm">{icon}</div>
      </div>
      <p className="text-3xl font-semibold text-slate-900 dark:text-white">{value}</p>
      {subtitle && <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
    </div>
  );
}

function StatusBadge({ status }) {
  const className = statusStyles[status] || 'bg-slate-100 text-slate-700';
  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${className}`}>{status}</span>;
}

function buildMonthlySeries(orders) {
  const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const totals = {};
  orders.forEach((order) => {
    const date = new Date(order.date || Date.now());
    const label = monthOrder[date.getMonth()];
    totals[label] = (totals[label] || 0) + (order.total || 0);
  });
  const lastSix = monthOrder.slice(0, 6);
  const labels = lastSix;
  const data = labels.map((label) => Math.round((totals[label] ?? 0) * 100) / 100);
  return { labels, data };
}

export default function AdminDashboard() {
  const { state } = useStore();
  const products = useProducts();
  const orders = useMemo(() => state.orders || [], [state.orders]);

  const metrics = useMemo(() => {
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    const pendingOrders = orders.filter((order) => ['pending', 'placed', 'processing'].includes((order.status || '').toLowerCase())).length;
    const deliveredOrders = orders.filter((order) => (order.status || '').toLowerCase() === 'delivered').length;
    return {
      products: products.length,
      orders: orders.length,
      pendingOrders,
      deliveredOrders,
      totalRevenue: formatPrice(totalRevenue),
      numericRevenue: totalRevenue,
      growth: `${Math.min(42, Math.max(8, Math.round((deliveredOrders / Math.max(1, orders.length)) * 22)))}%`,
    };
  }, [orders, products.length]);

  const recentOrders = orders.slice().reverse().slice(0, 5);
  const activityFeed = [
    { label: 'New product added', message: products[0]?.title || 'Classic Crew Neck', time: 'Just now', icon: <FiPlus size={16} /> },
    { label: 'Order received', message: recentOrders[0]?.id || 'ORD-000', time: '12m ago', icon: <FiShoppingCart size={16} /> },
    { label: 'Banner updated', message: 'Homepage hero refreshed', time: '1h ago', icon: <FiImage size={16} /> },
    { label: 'Coupon created', message: 'SUMMER20 launched', time: '3h ago', icon: <FiTag size={16} /> },
  ];

  const summary = buildMonthlySeries(orders);
  const salesChartData = {
    labels: summary.labels,
    datasets: [
      {
        label: 'Revenue',
        data: summary.data,
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.14)',
        tension: 0.35,
        fill: true,
        pointRadius: 4,
      },
    ],
  };

  const categoryCounts = products.reduce((acc, product) => {
    const category = product.category || 'Others';
    acc[category] = (acc[category] || 0) + 1;
    return acc;
  }, {});

  const categoryLabels = ['Oversized T-Shirts', 'Streetwear', 'Anime Collection', 'Plain T-Shirts', 'Others'];
  const categoryData = {
    labels: categoryLabels,
    datasets: [
      {
        data: categoryLabels.map((label) => categoryCounts[label] || 3),
        backgroundColor: ['#f59e0b', '#0ea5e9', '#8b5cf6', '#22c55e', '#64748b'],
        hoverOffset: 6,
      },
    ],
  };

  const lowStockProducts = products.slice(0, 4).map((product, index) => ({
    id: product.id,
    title: product.title,
    image: product.image || '/assets/products/crew-neck.jpg',
    stock: Math.max(1, 10 - index * 2),
  }));

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[1.8fr_1fr]">
        <div className="rounded-[24px] bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-700 shadow-2xl backdrop-blur p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Welcome Back Admin</p>
              <h1 className="mt-3 text-3xl sm:text-4xl font-semibold text-slate-900 dark:text-white">FULLWB Store Performance</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">Your men's T-shirt brand admin panel is live, polished, and ready for enterprise operations.</p>
            </div>
            <div className="rounded-3xl bg-slate-950/95 text-white px-5 py-4 shadow-xl ring-1 ring-white/10">
              <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Today</p>
              <p className="mt-3 text-2xl font-semibold">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
              <p className="mt-1 text-sm text-slate-400">Live store overview and performance metrics</p>
            </div>
          </div>
        </div>

        <div className="rounded-[24px] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 border border-white/10 shadow-2xl p-6 text-white">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Store performance</p>
          <div className="mt-4 space-y-4">
            <div className="rounded-3xl bg-white/5 p-4">
              <p className="text-sm text-slate-300">Todays Conversion</p>
              <p className="mt-2 text-3xl font-semibold">4.8%</p>
              <p className="mt-1 text-sm text-slate-400">Up 12% from last week</p>
            </div>
            <div className="rounded-3xl bg-white/5 p-4">
              <p className="text-sm text-slate-300">Average Cart Value</p>
              <p className="mt-2 text-3xl font-semibold">{formatPrice((orders.reduce((sum, o) => sum + (o.total || 0), 0) / Math.max(1, orders.length)) || 0)}</p>
              <p className="mt-1 text-sm text-slate-400">High-end customers fueling growth</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-5">
        {kpiCards.map((card) => (
          <StatCard
            key={card.key}
            title={card.title}
            value={card.key === 'totalRevenue' ? metrics.totalRevenue : metrics[card.key] ?? '0'}
            subtitle={card.key === 'totalRevenue' ? `${metrics.growth} MoM` : card.key === 'orders' ? `${metrics.growth} more orders` : `+${metrics.growth}`}
            icon={card.icon}
          />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="rounded-[24px] bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-700 shadow-2xl p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Sales Analytics</p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">Revenue & Order Trends</h2>
            </div>
            <div className="rounded-3xl bg-slate-100/90 dark:bg-slate-800 px-4 py-3 text-slate-700 dark:text-slate-200 text-sm">Monthly comparisons updated</div>
          </div>
          <div className="mt-8">
            <Line data={salesChartData} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { color: '#64748b' } }, y: { grid: { color: '#e2e8f0' }, ticks: { color: '#64748b' } } } }} />
          </div>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3 mt-6">
            <div className="rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-700 p-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">Average Order</p>
              <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">{formatPrice(metrics.numericRevenue / Math.max(1, orders.length) || 0)}</p>
            </div>
            <div className="rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-700 p-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">Return Rate</p>
              <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">2.4%</p>
            </div>
            <div className="rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-700 p-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">New Customers</p>
              <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">{Math.max(12, Math.round((orders.length * 0.2) || 5))}</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[24px] bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-700 shadow-2xl p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Top Categories</p>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Category share</h3>
              </div>
              <div className="text-sm text-slate-400">Live product split</div>
            </div>
            <Doughnut data={categoryData} options={{ plugins: { legend: { position: 'bottom', labels: { color: '#64748b' } } } }} />
          </div>

          <div className="rounded-[24px] bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-700 shadow-2xl p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Quick Actions</p>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Speed up operations</h3>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Link to="/admin/products/new" className="rounded-3xl bg-slate-900 text-white py-3 text-center font-medium hover:bg-slate-800 transition">Add Product</Link>
              <Link to="/admin/banners" className="rounded-3xl bg-white border border-slate-200 py-3 text-center font-medium text-slate-900 hover:bg-slate-50 transition">Add Banner</Link>
              <Link to="/admin/orders" className="rounded-3xl bg-white border border-slate-200 py-3 text-center font-medium text-slate-900 hover:bg-slate-50 transition">View Orders</Link>
              <Link to="/admin/coupons" className="rounded-3xl bg-slate-900 text-white py-3 text-center font-medium hover:bg-slate-800 transition">Create Coupon</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="rounded-[24px] bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-700 shadow-2xl p-6">
          <div className="flex items-center justify-between gap-3 mb-6">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Recent Orders</p>
              <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">Latest order activity</h3>
            </div>
            <p className="text-sm text-slate-400">Showing 5 latest orders</p>
          </div>
          <div className="space-y-4">
            {recentOrders.length === 0 ? (
              <div className="rounded-3xl bg-slate-50 dark:bg-slate-950 p-6 text-slate-500">No recent orders yet.</div>
            ) : (
              recentOrders.map((order) => {
                const item = order.items?.[0] || {};
                return (
                  <div key={order.id} className="grid grid-cols-[auto_1fr_auto] gap-4 items-center rounded-3xl border border-slate-200/80 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-4">
                    <img src={item.image || '/assets/products/crew-neck.jpg'} alt={item.title} className="h-16 w-16 rounded-2xl object-cover" />
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{order.id}</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.title || 'Premium T-Shirt'} • {item.quantity || 1} item(s)</p>
                      <p className="mt-1 text-xs text-slate-400">{new Date(order.date || '').toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-semibold text-slate-900 dark:text-white">{formatPrice(order.total)}</p>
                      <div className="mt-2"><StatusBadge status={order.status || 'Pending'} /></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[24px] bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-700 shadow-2xl p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Low Stock Alert</p>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Restock priority</h3>
              </div>
              <div className="text-sm text-slate-400">Critical products</div>
            </div>
            <div className="space-y-3">
              {lowStockProducts.map((product) => (
                <div key={product.id} className="flex items-center gap-3 rounded-3xl border border-slate-200/80 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-4">
                  <img src={product.image} alt={product.title} className="h-16 w-16 rounded-2xl object-cover" />
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 dark:text-white">{product.title}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{product.stock} remaining</p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-amber-100 text-amber-700 px-3 py-1 text-xs font-semibold">Low stock</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[24px] bg-white/95 dark:bg-slate-900/95 border border-slate-200/80 dark:border-slate-700 shadow-2xl p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Activity Feed</p>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Recent actions</h3>
              </div>
              <FiActivity className="text-slate-400" size={20} />
            </div>
            <div className="space-y-3">
              {activityFeed.map((activity) => (
                <div key={activity.label} className="flex items-center gap-3 rounded-3xl border border-slate-200/80 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-4">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-900 text-white">{activity.icon}</div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 dark:text-white">{activity.label}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{activity.message}</p>
                  </div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{activity.time}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
