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
  const [products, setProducts] = useState([]);

  useEffect(() => {
    let mounted = true;

    async function loadProducts() {
      try {
        const fetched = await getProductsApi();
        if (mounted) {
          setProducts(fetched);
          saveProductsStorage(fetched);
        }
      } catch {
        setProducts(getProductsStorage());
      }
    }

    loadProducts();

    const refresh = () => setProducts(getProductsStorage());
    window.addEventListener('products_updated', refresh);
    const storageHandler = (e) => {
      if (e.key === 'products') refresh();
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
      setProducts(refreshed);
      saveProductsStorage(refreshed);
      return saved;
    } catch {
      const saved = saveProductStorage(product);
      setProducts(getProductsStorage());
      return saved;
    }
  };

  const deleteProduct = async (id) => {
    try {
      await deleteProductApi(id);
      const refreshed = await getProductsApi();
      setProducts(refreshed);
      saveProductsStorage(refreshed);
    } catch {
      deleteProductStorage(id);
      setProducts(getProductsStorage());
    }
  };

  const refreshProducts = async () => {
    try {
      const refreshed = await getProductsApi();
      setProducts(refreshed);
      saveProductsStorage(refreshed);
    } catch {
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
