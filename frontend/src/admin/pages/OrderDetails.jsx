import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';
import { formatPrice } from '../../utils/formatPrice';

const statusSteps = [
  'Order Placed',
  'Order Confirmed',
  'Packed',
  'Shipped',
  'Out for delivery',
  'Delivered',
];

const statusMap = {
  Placed: 'Order Placed',
  Confirmed: 'Order Confirmed',
  Packed: 'Packed',
  Shipped: 'Shipped',
  'Out for delivery': 'Out for delivery',
  Delivered: 'Delivered',
  Rejected: 'Order Placed',
  Cancelled: 'Order Placed',
};

export default function OrderDetails() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { state, updateOrderStatus } = useStore();
  const orders = useMemo(() => state.orders || [], [state.orders]);
  const [trackingId, setTrackingId] = useState('');

  const order = useMemo(() => orders.find((item) => item.id === orderId), [orders, orderId]);

  const orderDate = order ? new Date(order.date) : null;
  const products = order?.items || [];
  const totalQuantity = products.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const shippingCharge = order?.shippingCharge ?? 12;
  const discount = order?.discount ?? 0;
  const grandTotal = (order?.total || 0) + shippingCharge - discount;
  const activeStep = statusSteps.indexOf(statusMap[order?.status] || 'Order Placed');
  const timeline = orderDate
    ? statusSteps.map((label, index) => ({
        label,
        date: new Date(orderDate.getTime() + index * 90 * 60 * 1000),
      }))
    : [];

  const handleStatusUpdate = (status) => {
    updateOrderStatus(orderId, status);
  };

  const handleInvoiceDownload = () => {
    if (!order) return;
    const lines = [
      `Order ID: ${order.id}`,
      `Date: ${new Date(order.date).toLocaleString()}`,
      `Customer: ${order.shipping?.firstName || 'Guest'} ${order.shipping?.lastName || ''}`,
      `Email: ${order.shipping?.email || 'N/A'}`,
      '',
      'Items:',
      ...products.map((item) => `- ${item.title} (${item.productCode || item.id}) x${item.quantity || 1} = ${formatPrice(item.totalPrice || item.unitPrice)}`),
      '',
      `Subtotal: ${formatPrice(order.total)}`,
      `Shipping: ${formatPrice(shippingCharge)}`,
      `Discount: -${formatPrice(discount)}`,
      `Grand Total: ${formatPrice(grandTotal)}`,
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${order.id}-invoice.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (!order) {
    return (
      <div className="space-y-4">
        <button onClick={() => navigate(-1)} className="text-sm font-medium text-slate-700 dark:text-slate-200">← Back</button>
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Order not found</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">The requested order ID does not exist in the current data set.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">Customers & Orders Management</p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">Order Details</h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => navigate(-1)} className="rounded-3xl border border-slate-300 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200 transition dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">Back</button>
          <button onClick={handleInvoiceDownload} className="rounded-3xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition">Download Invoice</button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_0.9fr]">
        <div className="space-y-6">
          <div className="rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 shadow-xl">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Order summary</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{order.id}</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{new Date(order.date).toLocaleDateString()} · {new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <span className="inline-flex rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">{order.status}</span>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-slate-50 dark:bg-slate-950 p-5 border border-slate-200 dark:border-slate-700">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Customer</p>
                <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">{order.shipping?.firstName} {order.shipping?.lastName}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{order.shipping?.email}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 dark:bg-slate-950 p-5 border border-slate-200 dark:border-slate-700">
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Delivery address</p>
                <p className="mt-2 text-base font-semibold text-slate-900 dark:text-white">{order.shipping?.address}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{order.shipping?.city}, {order.shipping?.country}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Products in this order</h2>
            <div className="mt-6 space-y-4">
              {products.map((item) => (
                <div key={item.id + item.title} className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-950 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-20 w-20 overflow-hidden rounded-3xl bg-slate-200 dark:bg-slate-800">
                      {item.image ? <img src={item.image} alt={item.title} className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center text-slate-500">No image</div>}
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{item.productCode || item.id}</p>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{item.title}</h3>
                      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Qty: {item.quantity || 1} · {formatPrice(item.unitPrice || item.totalPrice)}</p>
                    </div>
                  </div>
                  <div className="grid gap-2 text-right">
                    <span className="text-sm text-slate-500 dark:text-slate-400">Item total</span>
                    <span className="text-lg font-semibold text-slate-900 dark:text-white">{formatPrice(item.totalPrice || (item.unitPrice * (item.quantity || 1)))}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Shipment timeline</h2>
            <div className="mt-6 space-y-4">
              {timeline.map((step, index) => {
                const active = index <= activeStep;
                return (
                  <div key={step.label} className="flex items-start gap-4">
                    <div className={`mt-1 h-3.5 w-3.5 rounded-full ${active ? 'bg-slate-900' : 'bg-slate-300 dark:bg-slate-700'}`} />
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{step.label}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{step.date.toLocaleString()}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Order details</p>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Summary</h2>
              </div>
              <span className="rounded-3xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">{order.status}</span>
            </div>
            <div className="mt-6 space-y-4">
              <div className="rounded-3xl bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-500 dark:text-slate-400">Total item quantity</p>
                <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">{totalQuantity}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-500 dark:text-slate-400">Subtotal</p>
                <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">{formatPrice(order.total)}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-500 dark:text-slate-400">Shipping</p>
                <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">{formatPrice(shippingCharge)}</p>
              </div>
              <div className="rounded-3xl bg-slate-50 dark:bg-slate-950 p-4 border border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-500 dark:text-slate-400">Discount</p>
                <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">-{formatPrice(discount)}</p>
              </div>
              <div className="rounded-3xl bg-slate-950 p-4 text-white border border-slate-800">
                <p className="text-sm uppercase tracking-[0.35em] text-slate-400">Grand total</p>
                <p className="mt-2 text-2xl font-semibold">{formatPrice(grandTotal)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Admin actions</h2>
            <div className="mt-6 grid gap-3">
              <button onClick={() => handleStatusUpdate('Confirmed')} className="rounded-3xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition">Confirm Order</button>
              <button onClick={() => handleStatusUpdate('Packed')} className="rounded-3xl bg-slate-700 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-600 transition">Mark Packed</button>
              <button onClick={() => handleStatusUpdate('Shipped')} className="rounded-3xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white hover:bg-sky-500 transition">Mark Shipped</button>
              <button onClick={() => handleStatusUpdate('Delivered')} className="rounded-3xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-500 transition">Mark Delivered</button>
              <div className="grid gap-3 sm:grid-cols-2">
                <button onClick={() => setTrackingId(`TRK-${order.id.slice(-8)}`)} className="rounded-3xl border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Add Tracking ID</button>
                <button onClick={() => handleStatusUpdate('Rejected')} className="rounded-3xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white hover:bg-rose-500 transition">Cancel Order</button>
              </div>
              {trackingId ? <p className="rounded-3xl bg-slate-50 p-4 text-sm text-slate-700 dark:bg-slate-950 dark:text-slate-300">Tracking ID: <span className="font-semibold">{trackingId}</span></p> : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
