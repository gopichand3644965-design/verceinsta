import { useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { formatPrice } from '../../utils/formatPrice';


const orderStatusClass = (status) => {
  if (status === 'Delivered') return 'bg-emerald-100 text-emerald-700';
  if (status === 'Rejected' || status === 'Cancelled') return 'bg-rose-100 text-rose-700';
  if (status === 'Shipped') return 'bg-sky-100 text-sky-700';
  return 'bg-amber-100 text-amber-700';
};

const getCustomerKey = (shipping, orderId) => shipping?.email || orderId;

export default function CustomerProfile() {
  const { customerKey } = useParams();
  const navigate = useNavigate();
  const { state, deleteCustomerOrders } = useStore();
  const orders = useMemo(() => state.orders || [], [state.orders]);
  const [blocked, setBlocked] = useState(false);

  const customerGroup = useMemo(() => {
    const groups = {};
    orders.forEach((order) => {
      const key = getCustomerKey(order.shipping, order.id);
      if (!groups[key]) {
        groups[key] = {
          customer: order.shipping || {
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
    return groups[decodeURIComponent(customerKey)];
  }, [customerKey, orders]);

  if (!customerGroup) {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate(-1)} className="text-sm font-medium text-slate-700 dark:text-slate-200">← Back</button>
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Customer not found</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">We could not locate this customer profile. Please return to the customer list.</p>
        </div>
      </div>
    );
  }

  const customer = customerGroup.customer;
  const sortedOrders = [...customerGroup.orders].sort((a, b) => new Date(b.date) - new Date(a.date));
  const registrationDate = new Date(sortedOrders[sortedOrders.length - 1]?.date || '1970-01-01');
  const lastOrderDate = new Date(sortedOrders[0]?.date || '1970-01-01');
  const totalProducts = sortedOrders.reduce((sum, order) => sum + (order.items?.reduce((qty, item) => qty + (item.quantity || 0), 0) || 0), 0);
  const pendingOrders = sortedOrders.filter((order) => !['Delivered', 'Rejected', 'Cancelled'].includes(order.status)).length;
  const deliveredOrders = sortedOrders.filter((order) => order.status === 'Delivered').length;
  const cancelledOrders = sortedOrders.filter((order) => ['Rejected', 'Cancelled'].includes(order.status)).length;
  const totalOrders = sortedOrders.length;
  const status = blocked ? 'Blocked' : (deliveredOrders > 0 || pendingOrders > 0 ? 'Active' : 'Blocked');
  const customerId = `CUST-${customer.email?.split('@')[0] || '000'}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Customers & Orders Management</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">Customer Profile</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => navigate('/admin/customers')} className="rounded-3xl border border-slate-300 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">Back to customers</button>
          <button onClick={() => navigate(`/admin/orders/${sortedOrders[0]?.id}`)} disabled={!sortedOrders[0]} className="rounded-3xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition disabled:cursor-not-allowed disabled:opacity-50">View Latest Order</button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="grid h-20 w-20 place-items-center rounded-3xl bg-slate-950 text-white text-3xl font-bold">{customer.firstName?.[0] || 'C'}</div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Customer</p>
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">{customer.firstName} {customer.lastName}</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">ID: {customerId}</p>
              </div>
            </div>
            <span className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{status}</span>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 p-5">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Phone</p>
              <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">{customer.phone || 'Not available'}</p>
            </div>
            <div className="rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 p-5">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Email</p>
              <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">{customer.email || 'Not available'}</p>
            </div>
            <div className="rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 p-5">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Registered</p>
              <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">{registrationDate.toLocaleDateString()}</p>
            </div>
            <div className="rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 p-5">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Last order</p>
              <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">{lastOrderDate.toLocaleDateString()}</p>
            </div>
            <div className="rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 p-5">
              <p className="text-xs uppercase tracking-[0.35em] text-slate-400">City</p>
              <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">{customer.city || 'N/A'}</p>
            </div>
          </div>

          <div className="mt-8 rounded-[28px] bg-slate-950/95 p-6 text-white shadow-xl border border-white/10">
            <h3 className="text-lg font-semibold">Analytics</h3>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {[
                { label: 'Total Orders', value: totalOrders },
                { label: 'Products Purchased', value: totalProducts },
                { label: 'Pending Orders', value: pendingOrders },
                { label: 'Delivered Orders', value: deliveredOrders },
                { label: 'Cancelled Orders', value: cancelledOrders },
              ].map((item) => (
                <div key={item.label} className="rounded-3xl bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400">{item.label}</p>
                  <p className="mt-3 text-2xl font-semibold">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 p-5">
              <p className="text-sm text-slate-500 dark:text-slate-400">Full address</p>
              <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">{customer.address}</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{customer.city}, {customer.country}</p>
            </div>
            <div className="rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 p-5">
              <p className="text-sm text-slate-500 dark:text-slate-400">Postal code</p>
              <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">{customer.postalCode || '000000'}</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">State</p>
              <p className="text-base font-semibold text-slate-900 dark:text-white">{customer.state || 'N/A'}</p>
            </div>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <a href={`tel:${customer.phone}`} className={`inline-flex items-center justify-center rounded-3xl px-4 py-3 text-sm font-semibold transition ${customer.phone ? 'bg-slate-900 text-white hover:bg-slate-800' : 'cursor-not-allowed bg-slate-300 text-slate-600'}`}>
              Call Customer
            </a>
            <a href={customer.phone ? `https://wa.me/${customer.phone.replace(/\D/g, '')}` : '#'} target="_blank" rel="noreferrer" className={`inline-flex items-center justify-center rounded-3xl px-4 py-3 text-sm font-semibold transition ${customer.phone ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'cursor-not-allowed bg-slate-300 text-slate-600'}`}>
              WhatsApp Customer
            </a>
            <button onClick={() => setBlocked((value) => !value)} className={`rounded-3xl px-4 py-3 text-sm font-semibold transition ${blocked ? 'bg-rose-600 text-white hover:bg-rose-700' : 'bg-amber-500 text-slate-950 hover:bg-amber-600'}`}>
              {blocked ? 'Unblock Customer' : 'Block Customer'}
            </button>
              <button
                onClick={() => {
                  if (window.confirm('Delete this customer and all related orders? This cannot be undone.')) {
                    deleteCustomerOrders(customerKey);
                    navigate('/admin/customers');
                  }
                }}
                className="rounded-3xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-200 transition dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              >
                Delete Customer
              </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Customer details</p>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Profile snapshot</h2>
              </div>
              <span className="rounded-3xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">{status}</span>
            </div>
            <div className="mt-6 space-y-4">
              <div className="rounded-3xl bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-400">Customer ID</p>
                <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">{customerId}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-400">Registered</p>
                <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">{registrationDate.toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Order history</p>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Complete order history</h2>
              </div>
              <span className="text-sm text-slate-400">{totalOrders} orders</span>
            </div>
            <div className="mt-6 space-y-4">
              {sortedOrders.map((order) => {
                const totalQuantity = order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
                return (
                  <div key={order.id} className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Order ID</p>
                        <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">{order.id}</p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{new Date(order.date).toLocaleDateString()} · {new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-3">
                        <div className="rounded-3xl bg-white dark:bg-slate-900 p-3 text-center border border-slate-200 dark:border-slate-700">
                          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Products</p>
                          <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{order.items?.length || 0}</p>
                        </div>
                        <div className="rounded-3xl bg-white dark:bg-slate-900 p-3 text-center border border-slate-200 dark:border-slate-700">
                          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Total qty</p>
                          <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{totalQuantity}</p>
                        </div>
                        <div className="rounded-3xl bg-white dark:bg-slate-900 p-3 text-center border border-slate-200 dark:border-slate-700">
                          <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Tracking ID</p>
                          <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">TRK-{order.id.slice(-6)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap gap-2">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${orderStatusClass(order.status)}`}>{order.status}</span>
                        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700 dark:bg-slate-800 dark:text-slate-300">{formatPrice(order.total)}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link to={`/admin/orders/${order.id}`} className="rounded-3xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition">View Order</Link>
                        <button onClick={() => window.print()} className="rounded-3xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Download Invoice</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
