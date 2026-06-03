import { useMemo } from 'react';

// Simple search hook that filters a product list by query (case‑insensitive)
// Returns the filtered array.
export default function useSearch(products, query) {
  const lower = query.trim().toLowerCase();
  return useMemo(() => {
    if (!lower) return products;
    return products.filter(p =>
      p.title?.toLowerCase().includes(lower) ||
      p.name?.toLowerCase().includes(lower) ||
      p.productCode?.toLowerCase().includes(lower)
    );
  }, [products, lower]);
}
