/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react';
import {
  getProducts as getProductsStorage,
  saveProduct as saveProductStorage,
  saveProducts as saveProductsStorage,
  deleteProduct as deleteProductStorage,
} from '../utils/products';
import { getProductsApi, createProductApi, updateProductApi, deleteProductApi } from '../api';

const ProductsContext = createContext(null);

export function ProductsProvider({ children }) {
  const [products, setProducts] = useState(() => {
    const stored = getProductsStorage();
    // Ensure we never initialize with an empty array if we have cached data
    return (Array.isArray(stored) && stored.length > 0) ? stored : [];
  });

  useEffect(() => {
    let mounted = true;

    async function loadProducts() {
      try {
        const fetched = await getProductsApi();
        if (mounted) {
          // Only update if we got valid data with products
          if (Array.isArray(fetched) && fetched.length > 0) {
            console.log(`[ProductsContext] Loaded ${fetched.length} products from API`);
            setProducts(fetched);
            saveProductsStorage(fetched);
          } else if (!Array.isArray(fetched)) {
            console.warn('[ProductsContext] API returned invalid product data');
          }
          // If fetched is empty array, keep existing products (don't clear them)
        }
      } catch (err) {
        console.error('[ProductsContext] Error loading products:', err);
        // Fallback is already handled by state initialization, but let's make sure it doesn't clear it
        if (mounted) {
          const fallback = getProductsStorage();
          if (Array.isArray(fallback) && fallback.length > 0) {
            setProducts(fallback);
          }
        }
      }
    }

    loadProducts();

    const refresh = () => setProducts(prev => {
      const updated = getProductsStorage();
      return (Array.isArray(updated) && updated.length > 0) ? updated : prev;
    });
    window.addEventListener('products_updated', refresh);
    const storageHandler = (e) => {
      if (e.key === 'products') {
        const updated = getProductsStorage();
        setProducts(prev => (Array.isArray(updated) && updated.length > 0) ? updated : prev);
      }
    };
    window.addEventListener('storage', storageHandler);

    return () => {
      mounted = false;
      window.removeEventListener('products_updated', refresh);
      window.removeEventListener('storage', storageHandler);
    };
  }, []);

  const saveProduct = async (product) => {
    const hasExisting = products.some((item) => item.id === product.id);
    try {
      const saved = hasExisting
        ? await updateProductApi(product.id, product)
        : await createProductApi(product);
      const refreshed = await getProductsApi();
      // Only update if we got valid data (not empty or null)
      if (Array.isArray(refreshed) && refreshed.length > 0) {
        setProducts(refreshed);
        saveProductsStorage(refreshed);
      } else if (Array.isArray(refreshed)) {
        // If API returns empty array, keep current products and add the new one
        const current = [...products];
        const idx = current.findIndex(p => p.id === product.id);
        if (idx >= 0) {
          current[idx] = product;
        } else {
          current.push(product);
        }
        setProducts(current);
        saveProductsStorage(current);
      }
      return saved;
    } catch (err) {
      console.error('Error saving product:', err);
      const saved = saveProductStorage(product);
      setProducts(getProductsStorage());
      return saved;
    }
  };

  const deleteProduct = async (id) => {
    try {
      await deleteProductApi(id);
      const refreshed = await getProductsApi();
      // Only update if we got valid data (ensure we're not accidentally clearing products)
      if (Array.isArray(refreshed)) {
        setProducts(refreshed);
        saveProductsStorage(refreshed);
      }
    } catch (err) {
      console.error('Error deleting product:', err);
      deleteProductStorage(id);
      setProducts(getProductsStorage());
    }
  };

  const refreshProducts = async () => {
    try {
      const refreshed = await getProductsApi();
      // Only update if we got valid data (ensure we never clear products with empty array)
      if (Array.isArray(refreshed) && refreshed.length > 0) {
        setProducts(refreshed);
        saveProductsStorage(refreshed);
      }
    } catch (err) {
      console.error('Error refreshing products:', err);
      // Keep current products, don't clear them
      setProducts(getProductsStorage());
    }
  };

  return (
    <ProductsContext.Provider value={{ products, saveProduct, deleteProduct, refreshProducts }}>
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
