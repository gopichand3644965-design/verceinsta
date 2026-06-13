// utils/products.js — localStorage cache for products
// IMPORTANT: Never use hardcoded JSON as a fallback. The API is the single source of truth.

const STORAGE_KEY = 'products';

export function getProducts() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

export function getProduct(id) {
  return getProducts().find((p) => p.id === id);
}

export function saveProducts(arr) {
  if (!Array.isArray(arr)) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  try {
    window.dispatchEvent(new Event('products_updated'));
  } catch {
    // ignore
  }
}

export function saveProduct(product) {
  const list = getProducts().slice();
  const idx = list.findIndex((p) => p.id === product.id);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...product };
  } else {
    list.push(product);
  }
  saveProducts(list);
  return product;
}

export function deleteProduct(id) {
  const list = getProducts().filter((p) => p.id !== id);
  saveProducts(list);
}
