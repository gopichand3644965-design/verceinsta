import productsJson from '../data/products.json';

const STORAGE_KEY = 'products';

export function getProducts() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // ignore
  }
  return productsJson;
}

export function getProduct(id) {
  return getProducts().find((p) => p.id === id);
}

export function saveProducts(arr) {
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
  // Safety check: don't save if we're removing too many products (indicates a bug)
  const currentList = getProducts();
  if (list.length === 0 && currentList.length > 0) {
    console.warn(`[deleteProduct] Warning: Product deletion would remove all products. Ignoring delete for ${id}`);
    return;
  }
  saveProducts(list);
}
