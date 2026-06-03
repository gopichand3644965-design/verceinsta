import { Link } from 'react-router-dom';
import useProducts from '../../hooks/useProducts';
import { useProductsContext } from '../../context/ProductsContext';
import { formatPrice } from '../../utils/formatPrice';
import { useState } from 'react';

export default function Products() {
  const [query, setQuery] = useState('');
  const items = useProducts();
  const { deleteProduct } = useProductsContext();

  const filtered = items.filter((p) => p.title.toLowerCase().includes(query.toLowerCase()) || p.productCode?.toLowerCase().includes(query.toLowerCase()));

  const handleDelete = (id) => {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    deleteProduct(id);
    alert('Product deleted.');
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h2 className="text-xl font-semibold">Products</h2>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <input 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
            placeholder="Search products..." 
            className="w-full sm:w-64 px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100" 
          />
          <Link to="/admin/products/new" className="bg-primary px-4 py-2 rounded-md text-white font-medium hover:bg-primary-dark transition-colors whitespace-normal">Add product</Link>
        </div>
      </div>

      {/* Desktop Table - Hidden on mobile */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hidden sm:block">
        <table className="w-full text-left table-auto">
          <thead>
            <tr className="text-sm text-gray-500">
              <th className="py-2">Product</th>
              <th>SKU</th>
              <th>Price</th>
              <th>Stock</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="py-3">
                  <div className="flex items-center gap-3">
                    <img src={p.image} alt="" className="w-12 h-12 object-cover rounded" />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-gray-100">{p.title}</div>
                      <div className="text-xs text-gray-500">{p.colors?.join(', ')}</div>
                    </div>
                  </div>
                </td>
                <td className="text-sm text-gray-900 dark:text-gray-100">{p.productCode}</td>
                <td className="text-sm text-gray-900 dark:text-gray-100">{formatPrice(p.price)}</td>
                <td className="text-sm text-gray-900 dark:text-gray-100">{p.stock ?? '—'}</td>
                <td className="text-right">
                  <div className="flex items-center justify-end gap-3">
                    <Link to={`/admin/products/${p.id}/edit`} className="text-primary underline text-sm">Edit</Link>
                    <button onClick={() => handleDelete(p.id)} className="text-red-600 text-sm hover:underline">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View - Shown only on mobile */}
      <div className="space-y-3 sm:hidden">
        {filtered.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center text-gray-500">
            No products found
          </div>
        ) : (
          filtered.map((p) => (
            <div key={p.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex gap-3 mb-3">
                <img src={p.image} alt={p.title} className="w-20 h-20 object-cover rounded" />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">{p.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">{p.productCode}</p>
                  <p className="text-sm text-primary font-semibold mt-2">{formatPrice(p.price)}</p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Stock:</span>
                  <span className="text-gray-900 dark:text-gray-100 font-medium">{p.stock ?? 'N/A'}</span>
                </div>
                <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <Link to={`/admin/products/${p.id}/edit`} className="flex-1 px-3 py-1 bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded text-sm text-center font-medium hover:bg-blue-100 dark:hover:bg-blue-800">Edit</Link>
                  <button onClick={() => handleDelete(p.id)} className="flex-1 px-3 py-1 bg-red-50 dark:bg-red-900 text-red-600 dark:text-red-400 rounded text-sm font-medium hover:bg-red-100 dark:hover:bg-red-800">Delete</button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
