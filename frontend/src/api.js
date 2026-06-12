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
  return localStorage.getItem('adminToken') || 'public-access-token';
}

const inFlightRequests = new Map();

async function requestWithRetry(url, options, retries = 3, delay = 1000) {
  const timeoutMs = options.timeout || 10000; // default 10s
  
  for (let i = 0; i < retries; i++) {
    const controller = new AbortController();
    
    let slowTimer = null;
    if (options.onSlow) {
      slowTimer = setTimeout(() => {
        options.onSlow();
      }, 3000); // Trigger callback if request takes > 3s
    }

    const id = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(id);
      if (slowTimer) clearTimeout(slowTimer);
      
      const text = await response.text();
      let data = null;
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          // not JSON
        }
      }

      if (!response.ok) {
        const error = new Error(data?.error || `Request failed: ${response.status} ${response.statusText}`);
        error.status = response.status;
        throw error;
      }
      return data;
    } catch (err) {
      clearTimeout(id);
      if (slowTimer) clearTimeout(slowTimer);

      const isTimeout = err.name === 'AbortError';
      const isLastRetry = i === retries - 1;

      // If we got an explicit HTTP error with status in 400-499 range (like 401 Unauthorized, 403 Forbidden, 400 Bad Request),
      // we must NOT retry since these are deterministic client failures. Retrying will only trigger rate-limiters.
      if (err.status && err.status >= 400 && err.status < 500) {
        throw err;
      }

      if (isLastRetry) {
        if (isTimeout) {
          const timeoutErr = new Error('Request timed out. Please check your connection.');
          timeoutErr.status = 408;
          throw timeoutErr;
        }
        throw err;
      }
      // Wait with backoff before retrying
      await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)));
    }
  }
}

async function request(path, options = {}) {
  const { method = 'GET', body, timeout, onSlow } = options;
  const token = getAuthToken();
  const custToken = getCustomerToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(custToken ? { 'X-Customer-Token': custToken } : {}),
    ...options.headers,
  };

  const url = `${BASE_URL}${path}`;
  const requestKey = `${method}:${url}:${body ? JSON.stringify(body) : ''}`;

  if (method === 'GET') {
    // If request is already in flight, return the same promise to prevent duplicate network calls
    if (inFlightRequests.has(requestKey)) {
      return inFlightRequests.get(requestKey);
    }
  }

  const promise = requestWithRetry(url, {
    ...options,
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    timeout,
    onSlow
  }).finally(() => {
    inFlightRequests.delete(requestKey);
  });

  if (method === 'GET') {
    inFlightRequests.set(requestKey, promise);
  }

  return promise;
}

export function adminLoginApi(email, password, options = {}) {
  return request('/admin/login', {
    method: 'POST',
    body: { email, password },
    ...options
  });
}

export function adminVerifyApi(options = {}) {
  return request('/admin/verify', {
    method: 'GET',
    ...options
  });
}

export function getProductsApi() {
  return request(`/products?t=${Date.now()}`);
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
