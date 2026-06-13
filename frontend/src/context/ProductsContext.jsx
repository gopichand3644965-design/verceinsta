/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  saveProducts as saveProductsStorage,
} from '../utils/products';
import { getProductsApi, createProductApi, updateProductApi, deleteProductApi } from '../api';

const ProductsContext = createContext(null);

export function ProductsProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch products from the API (single source of truth)
  const fetchProducts = useCallback(async () => {
    setError(null);
    try {
      const fetched = await getProductsApi();
      if (Array.isArray(fetched)) {
        console.log(`[ProductsContext] Loaded ${fetched.length} products from API`);
        setProducts(fetched);
        // Cache in localStorage for offline fallback, but ONLY if we got real data
        saveProductsStorage(fetched);
      } else {
        console.warn('[ProductsContext] API returned non-array:', fetched);
        // Don't update state or localStorage with garbage data
      }
    } catch (err) {
      console.error('[ProductsContext] Error loading products:', err);
      setError(err.message || 'Failed to load products');
      // On error, DON'T overwrite state — keep whatever we had
      // DON'T write to localStorage either — preserve any cached data
    } finally {
      setLoading(false);
    }
  }, []);

  // Load products once on mount
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const saveProduct = async (product) => {
    // Validate that the product has an ID before attempting to save
    if (!product.id) {
      throw new Error('Cannot save product without an ID. This is a frontend bug.');
    }

    const hasExisting = products.some((item) => item.id === product.id);
    
    // Save to backend API (the real database)
    // Let errors propagate to the caller so they can show feedback
    const saved = hasExisting
      ? await updateProductApi(product.id, product)
      : await createProductApi(product);
    
    // After successful save, refresh the full list from the database
    // This ensures we have the server-assigned ID and processed images
    try {
      const refreshed = await getProductsApi();
      if (Array.isArray(refreshed) && refreshed.length > 0) {
        setProducts(refreshed);
        saveProductsStorage(refreshed);
      } else {
        // Refresh returned empty/invalid — use the saved product directly
        // This handles the edge case where the GET succeeds but returns stale data
        const current = [...products];
        const savedProduct = saved || product;
        const idx = current.findIndex(p => p.id === savedProduct.id);
        if (idx >= 0) {
          current[idx] = savedProduct;
        } else {
          current.push(savedProduct);
        }
        setProducts(current);
        saveProductsStorage(current);
      }
    } catch (refreshErr) {
      console.warn('[ProductsContext] Refresh after save failed, using save response:', refreshErr.message);
      // Save succeeded but refresh failed — use the saved data
      const current = [...products];
      const savedProduct = saved || product;
      const idx = current.findIndex(p => p.id === savedProduct.id);
      if (idx >= 0) {
        current[idx] = savedProduct;
      } else {
        current.push(savedProduct);
      }
      setProducts(current);
      saveProductsStorage(current);
    }
    
    return saved;
  };

  const deleteProduct = async (id) => {
    // Let errors propagate to the caller
    await deleteProductApi(id);
    
    // After successful delete, refresh from DB
    try {
      const refreshed = await getProductsApi();
      if (Array.isArray(refreshed)) {
        setProducts(refreshed);
        saveProductsStorage(refreshed);
      } else {
        // Refresh failed — manually remove from current state
        const updated = products.filter(p => p.id !== id);
        setProducts(updated);
        saveProductsStorage(updated);
      }
    } catch (refreshErr) {
      console.warn('[ProductsContext] Refresh after delete failed:', refreshErr.message);
      const updated = products.filter(p => p.id !== id);
      setProducts(updated);
      saveProductsStorage(updated);
    }
  };

  const refreshProducts = useCallback(async () => {
    await fetchProducts();
  }, [fetchProducts]);

  return (
    <ProductsContext.Provider value={{ products, loading, error, saveProduct, deleteProduct, refreshProducts }}>
      {children}
    </ProductsContext.Provider>
  );
}

export function useProductsContext() {
  const context = useContext(ProductsContext);
  if (!context) {
    throw new Error('useProductsContext must be used within ProductsProvider');
  }
  return context;
}
