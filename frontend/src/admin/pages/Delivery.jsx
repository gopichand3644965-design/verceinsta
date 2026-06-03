import { useMemo, useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { formatPrice } from '../../utils/formatPrice';

const DELIVERY_STATUSES = ['Placed', 'Shipped', 'Out for delivery', 'Delivered', 'Failed Delivery'];

export default function Delivery() {
  const { state, updateOrderStatus } = useStore();
  const orders = state.orders || [];
  const [statusMap, setStatusMap] = useState({});

  const deliveryOrders = useMemo(
    () => orders.filter((order) => order.status !== 'Delivered' && order.status !== 'Rejected'),
    [orders]
  );

  useEffect(() => {
    const map = {};
    orders.forEach((order) => {
      map[order.id] = order.status;
    });
    setStatusMap(map);
  }, [orders]);

  function handleSelect(orderId, value) {
    setStatusMap((prev) => ({ ...prev, [orderId]: value }));
  }

  async function applyStatus(orderId) {
    const nextStatus = statusMap[orderId];
    if (!nextStatus) return;
    updateOrderStatus(orderId, nextStatus);
  }

  function renderActions(order) {
    if (!order) return null;
    const current = statusMap[order.id] || order.status;
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <select
          className="rounded border bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white"
          value={current}
          onChange={(event) => handleSelect(order.id, event.target.value)}
        >
          {DELIVERY_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <button
          onClick={() => applyStatus(order.id)}
          className="px-3 py-2 bg-slate-600 hover:bg-slate-700 text-white text-xs rounded-md"
        >
          Update Status
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold">Delivery Management</h2>
          <p className="text-sm text-gray-500">Update order delivery statuses from Shipped through Failed Delivery.</p>
        </div>
        <span className="text-xs sm:text-sm text-gray-500 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
          Pending: {deliveryOrders.length}
        </span>
      </div>

      {deliveryOrders.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-center">
          <p className="text-sm text-gray-500">No orders currently in delivery flow.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {deliveryOrders.map((order) => (
            <div key={order.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div>
                  <p className="text-xs text-gray-500">Order ID</p>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{order.id}</h3>
                  <p className="text-xs text-gray-500">
                    {new Date(order.date).toLocaleDateString()} · {order.shipping?.firstName} {order.shipping?.lastName}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                    order.status === 'Delivered' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' :
                    order.status === 'Failed Delivery' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100' :
                    order.status === 'Shipped' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100' :
                    order.status === 'Out for delivery' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100'
                  }`}>{order.status}</span>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Shipping Address</p>
                  <p className="text-sm text-gray-900 dark:text-white">{order.shipping?.address || 'N/A'}</p>
                  <p className="text-sm text-gray-900 dark:text-white">{order.shipping?.city}, {order.shipping?.country}</p>
                  <p className="text-sm text-gray-900 dark:text-white">{order.shipping?.phone}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{formatPrice(order.total)}</p>
                  {renderActions(order)}
                </div>
              </div>

              {order.items?.length > 0 && (
                <div className="mt-4 bg-gray-50 dark:bg-gray-900 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Items</p>
                  <div className="space-y-2">
                    {order.items.map((item, itemIdx) => (
                      <div key={itemIdx} className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-200">
                        <span>{item.title}</span>
                        <span>{item.quantity} × {formatPrice(item.unitPrice)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
