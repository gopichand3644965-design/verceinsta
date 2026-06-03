import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import { formatPrice } from '../utils/formatPrice';
import { useState, useMemo } from 'react';

export default function Orders() {
  const { state, updateOrderStatus } = useStore();
  const orders = state.orders || [];
  const [filter, setFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showInvoice, setShowInvoice] = useState(false);

  const filters = ['all', 'Placed', 'Processed', 'Shipped', 'Out for delivery', 'Delivered'];

  const filtered = useMemo(() => {
    if (filter === 'all') return orders.slice().reverse();
    return orders.filter((o) => o.status === filter).slice().reverse();
  }, [orders, filter]);

  const canRejectOrder = (order) => {
    if (!order || order.status === 'Rejected') return false;
    const orderTime = new Date(order.date).getTime();
    const now = Date.now();
    const hoursPassed = (now - orderTime) / (1000 * 60 * 60);
    return hoursPassed <= 48;
  };

  const handleReject = (orderId) => {
    updateOrderStatus(orderId, 'Rejected');
  };

  const openInvoice = (order) => {
    setSelectedOrder(order);
    setShowInvoice(true);
  };

  const closeInvoice = () => {
    setSelectedOrder(null);
    setShowInvoice(false);
  };

  const steps = ['Placed', 'Processed', 'Shipped', 'Out for delivery', 'Delivered'];
  const stepIndex = (status) => Math.max(0, steps.indexOf(status));

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Orders</h1>

      <div className="flex items-center gap-2 mb-4 overflow-x-auto hide-scrollbar pb-1 -mx-1 px-1">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-shrink-0 px-3 py-1 rounded-md text-sm ${filter === f ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800'}`}
          >
            {f === 'all' ? 'All' : f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border">
          <p className="text-sm text-gray-500">No orders match this filter.</p>
          <Link to="/" className="text-primary underline mt-2 inline-block">Continue shopping</Link>
        </div>
      ) : (
        <div className="space-y-6">
          {filtered.map((order) => (
            <div key={order.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Order ID</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{order.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Placed on</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{new Date(order.date).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                  <p className="font-semibold text-primary">{order.status}</p>
                </div>
              </div>

              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex gap-4 items-center rounded-xl p-3 bg-gray-50 dark:bg-gray-900">
                    <img src={item.image} alt={item.title} className="w-16 h-16 object-cover rounded-lg" />
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{item.title}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{item.productCode}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Quantity: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 dark:text-gray-100">{formatPrice(item.unitPrice)}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{formatPrice(item.totalPrice)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {order.shipping && (
                <div className="mt-4 rounded-2xl bg-gray-50 dark:bg-gray-900 p-4 border border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Shipping Address</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {order.shipping.firstName} {order.shipping.lastName}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{order.shipping.address}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{order.shipping.city}, {order.shipping.country}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {order.shipping.email}{order.shipping.phone ? ` · ${order.shipping.phone}` : ''}
                  </p>
                </div>
              )}

              <div className="mt-4">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  {steps.map((s, i) => {
                    const idx = stepIndex(order.status);
                    const done = i <= idx;
                    return (
                      <div key={s} className="flex items-center">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${done ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'}`}>{i + 1}</div>
                        <div className="ml-1.5 mr-3 text-xs text-gray-600 dark:text-gray-300">{s}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-gray-200 dark:border-gray-700 pt-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Order total</p>
                  <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">{formatPrice(order.total)}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={() => openInvoice(order)} className="px-4 py-2 rounded-md border text-sm">View invoice</button>
                  {canRejectOrder(order) && (
                    <button onClick={() => handleReject(order.id)} className="px-4 py-2 rounded-md bg-red-50 text-red-700 border">Reject order</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showInvoice && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeInvoice} />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 w-full max-w-2xl z-10 max-h-[90vh] overflow-y-auto mx-2">
            <h3 className="text-lg font-semibold mb-4">Invoice — {selectedOrder.id}</h3>
            <div className="space-y-3">
              {selectedOrder.items.map((it) => (
                <div key={it.id} className="flex justify-between">
                  <div>
                    <p className="font-medium">{it.title}</p>
                    <p className="text-sm text-gray-500">Qty: {it.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p>{formatPrice(it.totalPrice)}</p>
                  </div>
                </div>
              ))}
              <div className="border-t pt-3 flex justify-between">
                <div className="text-sm text-gray-500">Total</div>
                <div className="font-semibold">{formatPrice(selectedOrder.total)}</div>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={closeInvoice} className="px-3 py-1 rounded-md border">Close</button>
              <button onClick={() => window.print()} className="px-3 py-1 rounded-md bg-primary text-white">Print</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
