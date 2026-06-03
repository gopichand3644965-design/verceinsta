import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FiShoppingCart, FiClock, FiTruck, FiCheckCircle, FiXCircle, FiPackage, FiSearch, FiDownload, FiFilter, FiChevronRight } from 'react-icons/fi';
import { useStore } from '../../context/StoreContext';
import { formatPrice } from '../../utils/formatPrice';

const ORDER_TABS = [
  { key: 'all', label: 'All Orders' },
  { key: 'New', label: 'New Orders' },
  { key: 'Confirmed', label: 'Confirmed Orders' },
  { key: 'Processing', label: 'Processing Orders' },
  { key: 'Packed', label: 'Packed Orders' },
  { key: 'Shipped', label: 'Shipped Orders' },
  { key: 'Out For Delivery', label: 'Out For Delivery' },
  { key: 'Delivered', label: 'Delivered Orders' },
  { key: 'Cancelled', label: 'Cancelled Orders' },
  { key: 'Returned', label: 'Returned Orders' },
];

const statusStyles = {
  New: 'bg-amber-100 text-amber-700',
  Confirmed: 'bg-sky-100 text-sky-700',
  Processing: 'bg-violet-100 text-violet-700',
  Packed: 'bg-orange-100 text-orange-700',
  Shipped: 'bg-cyan-100 text-cyan-700',
  'Out For Delivery': 'bg-indigo-100 text-indigo-700',
  Delivered: 'bg-emerald-100 text-emerald-700',
  Cancelled: 'bg-rose-100 text-rose-700',
  Returned: 'bg-slate-800 text-slate-100',
};

const iconMap = {
  totalOrders: <FiShoppingCart size={20} />,
  newOrders: <FiPackage size={20} />,
  processingOrders: <FiClock size={20} />,
  shippedOrders: <FiTruck size={20} />,
  deliveredOrders: <FiCheckCircle size={20} />,
  cancelledOrders: <FiXCircle size={20} />,
};

const normalizeStatus = (status) => {
  if (!status) return 'New';
  const lower = status.toString().toLowerCase();
  if (lower.includes('reject') || lower.includes('cancel')) return 'Cancelled';
  if (lower.includes('out for delivery')) return 'Out For Delivery';
  if (lower.includes('return')) return 'Returned';
  if (lower.includes('deliver')) return 'Delivered';
  if (lower.includes('packed')) return 'Packed';
  if (lower.includes('ship')) return 'Shipped';
  if (lower.includes('process')) return 'Processing';
  if (lower.includes('confirm')) return 'Confirmed';
  if (lower.includes('new') || lower.includes('placed') || lower.includes('pending')) return 'New';
  return status;
};

const getBadgeClass = (status) => statusStyles[status] || 'bg-slate-100 text-slate-700';

const sameDay = (dateA, dateB) => {
  return dateA.getFullYear() === dateB.getFullYear() && dateA.getMonth() === dateB.getMonth() && dateA.getDate() === dateB.getDate();
};

export default function Orders() {
  const { state, updateOrderStatus } = useStore();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const activeTab = searchParams.get('status') || 'all';
  const orders = useMemo(() => state.orders || [], [state.orders]);

  const enrichedOrders = useMemo(() => {
    return orders.map((order) => {
      const status = normalizeStatus(order.status);
      const customerName = order.shipping?.firstName || order.shipping?.lastName ? `${order.shipping?.firstName || ''} ${order.shipping?.lastName || ''}`.trim() : order.shipping?.email || 'Guest User';
      const trackingId = order.trackingId || `TRK-${order.id.slice(-8)}`;
      const productCount = order.items?.length || 0;
      const totalQuantity = order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
      const grandTotal = order.total ?? 0;
      const orderDate = new Date(order.date || '1970-01-01');
      const category = order.items?.[0]?.category || 'Uncategorized';
      const city = order.shipping?.city || 'Unknown';

      return {
        ...order,
        status,
        customerName,
        trackingId,
        productCount,
        totalQuantity,
        grandTotal,
        orderDate,
        category,
        city,
      };
    });
  }, [orders]);

  const statusCounts = useMemo(() => {
    const counts = ORDER_TABS.reduce((acc, tab) => ({ ...acc, [tab.key]: 0 }), {});
    counts.all = enrichedOrders.length;
    enrichedOrders.forEach((order) => {
      counts[order.status] = (counts[order.status] || 0) + 1;
    });
    return counts;
  }, [enrichedOrders]);

  const todayCount = useMemo(() => {
    const today = new Date();
    return enrichedOrders.filter((order) => sameDay(order.orderDate, today)).length;
  }, [enrichedOrders]);

  const cities = useMemo(() => Array.from(new Set(enrichedOrders.map((order) => order.city))).sort(), [enrichedOrders]);
  const categories = useMemo(() => Array.from(new Set(enrichedOrders.map((order) => order.category))).sort(), [enrichedOrders]);

  const filteredOrders = useMemo(() => {
    return enrichedOrders
      .filter((order) => (activeTab === 'all' ? true : order.status === activeTab))
      .filter((order) => {
        if (!query) return true;
        const lookup = query.toLowerCase();
        return [order.id, order.customerName, order.trackingId].some((value) => value?.toLowerCase().includes(lookup));
      })
      .filter((order) => (cityFilter === 'all' ? true : order.city === cityFilter))
      .filter((order) => (categoryFilter === 'all' ? true : order.category === categoryFilter))
      .filter((order) => {
        if (!startDate) return true;
        return order.orderDate >= new Date(`${startDate}T00:00:00`);
      })
      .filter((order) => {
        if (!endDate) return true;
        return order.orderDate <= new Date(`${endDate}T23:59:59`);
      })
      .sort((a, b) => b.orderDate - a.orderDate);
  }, [activeTab, categoryFilter, cityFilter, endDate, enrichedOrders, query, startDate]);

  const exportOrders = () => {
    const rows = [
      ['Order ID', 'Customer', 'Phone', 'Status', 'Tracking ID', 'Order Date', 'Products', 'Qty', 'Grand Total', 'City', 'Category'].join(','),
      ...filteredOrders.map((order) => [
        order.id,
        order.customerName,
        order.shipping?.phone || 'N/A',
        order.status,
        order.trackingId,
        order.orderDate.toISOString(),
        order.productCount,
        order.totalQuantity,
        order.grandTotal,
        order.city,
        order.category,
      ].map((value) => `"${String(value || '')}"`).join(',')),
    ];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'orders-export.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const summary = [
    { label: 'Total Orders', value: statusCounts.all, icon: iconMap.totalOrders, today: todayCount },
    { label: 'New Orders', value: statusCounts.New || 0, icon: iconMap.newOrders, today: enrichedOrders.filter((order) => order.status === 'New' && sameDay(order.orderDate, new Date())).length },
    { label: 'Processing Orders', value: statusCounts.Processing || 0, icon: iconMap.processingOrders, today: enrichedOrders.filter((order) => order.status === 'Processing' && sameDay(order.orderDate, new Date())).length },
    { label: 'Shipped Orders', value: statusCounts.Shipped || 0, icon: iconMap.shippedOrders, today: enrichedOrders.filter((order) => order.status === 'Shipped' && sameDay(order.orderDate, new Date())).length },
    { label: 'Delivered Orders', value: statusCounts.Delivered || 0, icon: iconMap.deliveredOrders, today: enrichedOrders.filter((order) => order.status === 'Delivered' && sameDay(order.orderDate, new Date())).length },
    { label: 'Cancelled Orders', value: statusCounts.Cancelled || 0, icon: iconMap.cancelledOrders, today: enrichedOrders.filter((order) => order.status === 'Cancelled' && sameDay(order.orderDate, new Date())).length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Order Management</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">Premium Order Dashboard</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500 dark:text-slate-400">Manage every order stage with clear status tabs, fast search, and complete order visibility.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={exportOrders} className="inline-flex items-center gap-2 rounded-3xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition">
            <FiDownload size={16} /> Export Orders
          </button>
          <button className="inline-flex items-center gap-2 rounded-3xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50 transition dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900">
            <FiFilter size={16} /> Filter
          </button>
        </div>
      </div>

      <section className="grid gap-4 xl:grid-cols-3">
        {summary.map((card) => (
          <div key={card.label} className="rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 shadow-lg">
            <div className="flex items-center justify-between gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-3xl bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white">
                {card.icon}
              </div>
              <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">Today {card.today}</div>
            </div>
            <div className="mt-6">
              <p className="text-sm text-slate-500 dark:text-slate-400">{card.label}</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">{card.value}</p>
              <p className="mt-2 text-sm text-emerald-600">+{Math.max(3, Math.min(25, card.today + 5))}% growth</p>
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 shadow-lg">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Order Management</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Search by order, customer, tracking ID, or filter by status, date, city, and category.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-4 w-full">
            <div className="relative w-full">
              <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search orders, customer, tracking ID"
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-slate-400 dark:focus:ring-slate-800"
              />
            </div>
            <div>
              <select
                value={cityFilter}
                onChange={(event) => setCityFilter(event.target.value)}
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 py-3 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-slate-400 dark:focus:ring-slate-800"
              >
                <option value="all">All cities</option>
                {cities.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>
            <div>
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 py-3 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-slate-400 dark:focus:ring-slate-800"
              >
                <option value="all">All categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Start date</label>
            <input
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              type="date"
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 py-3 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-slate-400 dark:focus:ring-slate-800"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">End date</label>
            <input
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
              type="date"
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 py-3 px-4 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-slate-400 dark:focus:ring-slate-800"
            />
          </div>
          <div className="flex items-end">
            <button onClick={() => { setQuery(''); setCityFilter('all'); setCategoryFilter('all'); setStartDate(''); setEndDate(''); }} className="w-full rounded-3xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50 transition dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900">
              Clear filters
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-5 shadow-lg">
        <div className="flex flex-wrap gap-3 overflow-x-auto pb-2">
          {ORDER_TABS.map((tab) => (
            <Link
              key={tab.key}
              to={`/admin/orders?status=${encodeURIComponent(tab.key)}`}
              className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${activeTab === tab.key ? 'border-slate-900 bg-slate-950 text-white dark:border-white' : 'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200'}`}
            >
              {tab.label} <span className="ml-2 inline-flex rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">{statusCounts[tab.key] ?? 0}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        {filteredOrders.length === 0 ? (
          <div className="rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-10 text-center text-slate-500 dark:text-slate-300">
            No orders match the selected filters.
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div key={order.id} className="rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 shadow-lg">
              <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr] xl:items-center">
                <div className="space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Order ID</p>
                      <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">{order.id}</p>
                    </div>
                    <div className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold ${getBadgeClass(order.status)}`}>
                      {order.status}
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-3xl bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-700">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Customer</p>
                      <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{order.customerName}</p>
                    </div>
                    <div className="rounded-3xl bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-700">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Phone</p>
                      <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{order.shipping?.phone || 'N/A'}</p>
                    </div>
                    <div className="rounded-3xl bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-700">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Order Date</p>
                      <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{order.orderDate.toLocaleDateString()}</p>
                    </div>
                    <div className="rounded-3xl bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-700">
                      <p className="text-xs text-slate-500 dark:text-slate-400">Tracking ID</p>
                      <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{order.trackingId}</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-3xl bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-700 text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Products</p>
                    <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">{order.productCount}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-700 text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Quantity</p>
                    <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">{order.totalQuantity}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-950 p-4 text-center text-white border border-slate-800">
                    <p className="text-xs uppercase tracking-[0.35em] text-slate-300">Grand Total</p>
                    <p className="mt-2 text-2xl font-semibold">{formatPrice(order.grandTotal)}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-3xl bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-700">
                  <p className="text-sm text-slate-500 dark:text-slate-400">Items in order</p>
                  <div className="mt-4 space-y-3">
                    {order.items?.map((item) => (
                      <div key={`${item.id}-${item.title}`} className="grid gap-3 sm:grid-cols-[auto_1fr_auto] items-center">
                        <div className="h-16 w-16 overflow-hidden rounded-3xl bg-slate-200 dark:bg-slate-800">
                          {item.image ? <img src={item.image} alt={item.title} className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center text-slate-500">No image</div>}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.title}</p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">ID: {item.productCode || item.id}</p>
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Size: {item.size || 'N/A'} · Color: {item.color || 'N/A'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-slate-500 dark:text-slate-400">Qty {item.quantity}</p>
                          <p className="mt-1 font-semibold text-slate-900 dark:text-white">{formatPrice(item.unitPrice)}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{formatPrice(item.totalPrice)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-700 space-y-4">
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Shipping Address</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{order.shipping?.firstName} {order.shipping?.lastName}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{order.shipping?.address}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{order.shipping?.city}, {order.shipping?.country}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{order.shipping?.email}</p>
                  </div>
                  <div className="rounded-3xl bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-700">
                    <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Order timeline</p>
                    <div className="mt-4 space-y-4">
                      {['Order Placed', 'Order Confirmed', 'Processing', 'Packed', 'Shipped', 'Out For Delivery', 'Delivered'].map((stage, index) => {
                        const reached = index <= ORDER_TABS.findIndex((tab) => tab.key === order.status);
                        const stageDate = new Date(order.orderDate.getTime() + index * 90 * 60000);
                        return (
                          <div key={stage} className="flex gap-3">
                            <div className={`mt-1 h-3 w-3 rounded-full ${reached ? 'bg-slate-900' : 'bg-slate-300 dark:bg-slate-700'}`} />
                            <div className="flex-1">
                              <p className="text-sm font-semibold text-slate-900 dark:text-white">{stage}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">{stageDate.toLocaleDateString()} · {stageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">Admin note: {reached ? `Completed ${stage.toLowerCase()}` : 'Pending approval'}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <button onClick={() => updateOrderStatus(order.id, 'Confirmed')} className="w-full rounded-3xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white hover:bg-sky-500 transition">Confirm Order</button>
                    <button onClick={() => updateOrderStatus(order.id, 'Processing')} className="w-full rounded-3xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-500 transition">Start Processing</button>
                    <button onClick={() => updateOrderStatus(order.id, 'Packed')} className="w-full rounded-3xl bg-orange-600 px-4 py-3 text-sm font-semibold text-white hover:bg-orange-500 transition">Mark Packed</button>
                    <button onClick={() => updateOrderStatus(order.id, 'Shipped')} className="w-full rounded-3xl bg-cyan-600 px-4 py-3 text-sm font-semibold text-white hover:bg-cyan-500 transition">Mark Shipped</button>
                    <button onClick={() => updateOrderStatus(order.id, 'Out For Delivery')} className="w-full rounded-3xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500 transition">Out For Delivery</button>
                    <button onClick={() => updateOrderStatus(order.id, 'Delivered')} className="w-full rounded-3xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-500 transition">Mark Delivered</button>
                    <button onClick={() => updateOrderStatus(order.id, 'Cancelled')} className="w-full rounded-3xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white hover:bg-rose-500 transition">Cancel Order</button>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <Link to={`/admin/orders/${order.id}`} className="inline-flex items-center gap-2 rounded-3xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition">
                  View Order <FiChevronRight size={16} />
                </Link>
                <div className="flex flex-wrap gap-2">
                  {order.items?.slice(0, 3).map((item) => (
                    <span key={`${order.id}-${item.id}`} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">{item.title}</span>
                  ))}
                </div>
              </div>
            </div>
          )))}
      </section>
    </div>
  );
}
