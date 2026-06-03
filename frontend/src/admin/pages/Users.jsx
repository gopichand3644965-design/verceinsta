import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { formatPrice } from '../../utils/formatPrice';

const getCustomerKey = (shipping, orderId) => shipping?.email || orderId;

export default function Users() {
  const { state } = useStore();
  const orders = state.orders || [];
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const customers = useMemo(() => {
    const groups = {};

    orders.forEach((order) => {
      const key = getCustomerKey(order.shipping, order.id);
      if (!groups[key]) {
        groups[key] = {
          key,
          shipping: order.shipping || {
            firstName: 'Guest',
            lastName: 'User',
            email: 'N/A',
            phone: 'N/A',
            address: 'N/A',
            city: 'N/A',
            country: 'N/A',
          },
          orders: [],
        };
      }
      groups[key].orders.push(order);
    });

    return Object.values(groups).map((group) => {
      const totalOrders = group.orders.length;
      const totalItems = group.orders.reduce((sum, order) => sum + (order.items?.reduce((count, item) => count + (item.quantity || 0), 0) || 0), 0);
      const lastOrder = [...group.orders].sort((a, b) => new Date(b.date) - new Date(a.date))[0];
      const active = group.orders.some((order) => ['Delivered', 'Shipped', 'Out for delivery', 'Confirmed'].includes(order.status));
      return {
        ...group,
        displayName: `${group.shipping.firstName} ${group.shipping.lastName}`,
        status: active ? 'Active' : 'Blocked',
        totalOrders,
        totalItems,
        lastOrderDate: lastOrder?.date,
      };
    });
  }, [orders]);

  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const search = query.trim().toLowerCase();
      const matchQuery = !search || [customer.displayName, customer.shipping.email, customer.shipping.city].some((value) => value?.toLowerCase().includes(search));
      const matchStatus = statusFilter === 'all' || customer.status.toLowerCase() === statusFilter;
      return matchQuery && matchStatus;
    });
  }, [customers, query, statusFilter]);

  const exportCsv = () => {
    const lines = ['Name,Email,City,Orders,Products,Status,Last Order Date'];
    filteredCustomers.forEach((customer) => {
      lines.push([
        customer.displayName,
        customer.shipping.email,
        customer.shipping.city,
        customer.totalOrders,
        customer.totalItems,
        customer.status,
        customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString() : 'N/A',
      ].join(','));
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'customers-export.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Customers & Orders Management</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">Customers</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={exportCsv} className="rounded-3xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition">Export customers</button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-[1.8fr_0.9fr]">
        <div className="rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 shadow-xl">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[220px]">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">Search customers</label>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name, email or city"
                className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-slate-400 dark:focus:ring-slate-800"
              />
            </div>
            <div className="min-w-[170px]">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">Filter status</label>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-slate-400 dark:focus:ring-slate-800"
              >
                <option value="all">All customers</option>
                <option value="active">Active</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 p-5">
              <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Customers</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">{customers.length}</p>
            </div>
            <div className="rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 p-5">
              <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Active</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">{customers.filter((customer) => customer.status === 'Active').length}</p>
            </div>
            <div className="rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 p-5">
              <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Blocked</p>
              <p className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">{customers.filter((customer) => customer.status === 'Blocked').length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 shadow-xl">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Quick customer metrics</h2>
          <div className="mt-6 space-y-4">
            <div className="rounded-3xl bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-700">
              <p className="text-sm text-slate-500 dark:text-slate-400">Most orders</p>
              <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">{customers.sort((a, b) => b.totalOrders - a.totalOrders)[0]?.displayName || 'No data'}</p>
            </div>
            <div className="rounded-3xl bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-700">
              <p className="text-sm text-slate-500 dark:text-slate-400">Top city</p>
              <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">{customers.sort((a, b) => (a.shipping.city || '').localeCompare(b.shipping.city || ''))[0]?.shipping?.city || 'No data'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredCustomers.length === 0 ? (
          <div className="rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-8 text-center text-slate-500 dark:text-slate-300">
            No matching customers were found.
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {filteredCustomers.map((customer) => (
              <div key={customer.key} className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-xl transition hover:-translate-y-1 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600">
                <div className="flex items-start gap-4">
                  <div className="grid h-16 w-16 place-items-center rounded-3xl bg-slate-950 text-xl font-bold text-white">{customer.displayName?.[0] || 'C'}</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{customer.displayName}</h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{customer.shipping.email}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{customer.shipping.city}, {customer.shipping.country}</p>
                  </div>
                  <span className={`rounded-full px-3 py-2 text-xs font-semibold ${customer.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{customer.status}</span>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-3xl bg-slate-50 p-4 dark:bg-slate-950">
                    <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Orders</p>
                    <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">{customer.totalOrders}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-4 dark:bg-slate-950">
                    <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Products</p>
                    <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">{customer.totalItems}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-4 dark:bg-slate-950">
                    <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Last order</p>
                    <p className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">{customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Link to={`/admin/customers/${encodeURIComponent(customer.key)}`} className="rounded-3xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition">View profile</Link>
                  <Link to={`/admin/orders/${customer.orders?.[0]?.id ?? ''}`} className="rounded-3xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:border-slate-400 hover:bg-slate-50 transition dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800">Latest order</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
