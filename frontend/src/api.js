const API_BASE = import.meta.env.VITE_API_URL || '';
const BASE_URL = `${API_BASE}/api`;

export function getImageUrl(imagePath) {
  if (!imagePath) return '';
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('data:')) {
    return imagePath;
  }
  return `${API_BASE}${imagePath}`;
}


function getCustomerToken() {
  if (typeof window === 'undefined') return null;
  let token = localStorage.getItem('customerToken');
  if (!token) {
    token = `CUST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('customerToken', token);
  }
  return token;
}

function getAuthToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('adminToken');
}

async function request(path, options = {}) {
  const { method = 'GET', body } = options;
  const token = getAuthToken();
  const custToken = getCustomerToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(custToken ? { 'X-Customer-Token': custToken } : {}),
  };
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.error || `${response.status} ${response.statusText}`);
  }

  return data;
}

export function getProductsApi() {
  return request('/products');
}

export function getProductApi(id) {
  return request(`/products/${id}`);
}

export function createProductApi(payload) {
  return request('/products', { method: 'POST', body: payload });
}

export function updateProductApi(id, payload) {
  return request(`/products/${id}`, { method: 'PUT', body: payload });
}

export function deleteProductApi(id) {
  return request(`/products/${id}`, { method: 'DELETE' });
}

export function getOrdersApi() {
  return request('/orders');
}

export function createOrderApi(payload) {
  return request('/orders', { method: 'POST', body: payload });
}

export function updateOrderStatusApi(id, status) {
  return request(`/orders/${id}/status`, { method: 'PUT', body: { status } });
}

export function getCartApi() {
  return request('/user/cart');
}

export function saveCartApi(cart) {
  return request('/user/cart', { method: 'PUT', body: cart });
}

export function clearCartApi() {
  return request('/user/cart', { method: 'DELETE' });
}

export function getWishlistApi() {
  return request('/user/wishlist');
}

export function saveWishlistApi(wishlist) {
  return request('/user/wishlist', { method: 'PUT', body: wishlist });
}

export function getUserProfileApi() {
  return request('/user/profile');
}

export function saveUserProfileApi(payload) {
  return request('/user/profile', { method: 'PUT', body: payload });
}

export function getUserSettingsApi() {
  return request('/user/settings');
}

export function saveUserSettingsApi(payload) {
  return request('/user/settings', { method: 'PUT', body: payload });
}

export function getUserAddressesApi() {
  return request('/user/addresses');
}

export function addUserAddressApi(payload) {
  return request('/user/addresses', { method: 'POST', body: payload });
}

export function deleteUserAddressApi(id) {
  return request(`/user/addresses/${id}`, { method: 'DELETE' });
}

// Banners
export function getBannersApi() {
  return request('/banners');
}

export function createBannerApi(payload) {
  return request('/banners', { method: 'POST', body: payload });
}

export function updateBannerApi(id, payload) {
  return request(`/banners/${id}`, { method: 'PUT', body: payload });
}

export function deleteBannerApi(id) {
  return request(`/banners/${id}`, { method: 'DELETE' });
}

export async function uploadBannerImageApi(filename, base64Data) {
  const token = getAuthToken();
  const res = await fetch(`${BASE_URL}/banners/upload`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ filename, data: base64Data }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || 'Upload failed');
  }
  return res.json();
}

export function reorderBannersApi(order) {
  // order: array of banner ids or array of banner objects
  return request('/banners/reorder', { method: 'POST', body: order });
}
