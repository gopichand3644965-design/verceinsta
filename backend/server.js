const express = require('express');
const path = require('path');
const fs = require('fs/promises');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const createAdminRoutes = require('./auth/adminRoutes');
const { authenticateAdmin } = require('./auth/middleware');
const { verifyAdminToken } = require('./auth/token');
const compression = require('compression');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.use(compression());
const PORT = process.env.PORT || 4000;
const DATA_DIR = path.join(__dirname, 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const USER_FILE = path.join(DATA_DIR, 'user.json');
const BANNERS_FILE = path.join(DATA_DIR, 'banners.json');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

let supabase = null;
let productsDbAvailable = false;
let productsDbSeedBlockedByRls = false;

const isSupabaseConfigured = !!(supabaseUrl && supabaseKey);

if (isSupabaseConfigured) {
  supabase = createClient(supabaseUrl, supabaseKey);
} else {
  console.warn('Supabase credentials not found. Set SUPABASE_URL and SUPABASE_KEY or SUPABASE_SERVICE_ROLE_KEY in .env');
}

// Serving assets
const PRODUCTS_PUBLIC_DIR = path.join(__dirname, 'public', 'assets', 'products');

// Products and Banners In-Memory Cache (Disabled for serverless consistency)

function clearProductsCache() {}
function clearBannersCache() {}

// Helper to extract base64 image data and save it to public/assets/products
async function processBase64Image(dataString, productId, prefix = 'img') {
  if (typeof dataString !== 'string') return dataString;
  if (!dataString.startsWith('data:image/')) return dataString;

  // Extract content type and base64 data
  const matches = dataString.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) return dataString;

  const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
  const base64Data = matches[2];
  const buffer = Buffer.from(base64Data, 'base64');
  // If Supabase is configured, upload to Supabase Storage and return a permanent public URL.
  if (isSupabaseConfigured && supabase) {
    try {
      const safeName = `${productId}-${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;
      const bucket = 'products';
      // Attempt upload to Supabase Storage. Use the buffer directly.
      const { data: uploadData, error: uploadError } = await supabase.storage.from(bucket).upload(safeName, buffer, {
        contentType: `image/${ext}`,
        upsert: false,
      });
      if (uploadError) {
        throw new Error(`Supabase storage upload failed: ${uploadError.message || uploadError}`);
      }
      
      // Get public URL for uploaded file
      const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(safeName);
      if (publicData && publicData.publicUrl) {
        return publicData.publicUrl;
      }
      throw new Error('Supabase returned no public URL');
    } catch (err) {
      console.error('[processBase64Image] Supabase storage error:', err.message || err);
      throw err; // DO NOT FALLBACK IN PRODUCTION
    }
  }

  // Fallback: write file to local public assets (used in local/dev environments)
  await fs.mkdir(PRODUCTS_PUBLIC_DIR, { recursive: true });
  const filename = `${productId}-${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;
  const filePath = path.join(PRODUCTS_PUBLIC_DIR, filename);
  await fs.writeFile(filePath, buffer);

  return `/assets/products/${filename}`;
}

// Cleanup Base64 blobs for a product's main image and images array
async function cleanProductImageBlobs(product) {
  let modified = false;
  const prodId = product.id || `P-${Date.now()}`;
  
  if (product.image_url && product.image_url.startsWith('data:image/')) {
    product.image_url = await processBase64Image(product.image_url, prodId, 'main');
    modified = true;
  }
  // For backwards compatibility during migration
  if (product.image && product.image.startsWith('data:image/')) {
    product.image_url = await processBase64Image(product.image, prodId, 'main');
    delete product.image;
    modified = true;
  } else if (product.image) {
    product.image_url = product.image;
    delete product.image;
    modified = true;
  }
  
  if (Array.isArray(product.images)) {
    const validImages = [];
    for (let i = 0; i < product.images.length; i++) {
      if (product.images[i] && typeof product.images[i] === 'string' && product.images[i].startsWith('data:image/')) {
        const url = await processBase64Image(product.images[i], prodId, `ref-${i}`);
        if (url) validImages.push(url);
        modified = true;
      } else if (product.images[i] && typeof product.images[i] === 'string' && product.images[i].startsWith('http')) {
        validImages.push(product.images[i]);
      }
    }
    product.images = validImages;
  }
  return modified;
}

// Migrate Base64 product blobs from local JSON and Supabase DB
async function migrateBase64Products() {
  console.log('Starting Base64 product image migration scan...');
  
  // 1. Migrate products.json
  try {
    const products = await readJson(PRODUCTS_FILE, []);
    let localModified = false;
    for (const p of products) {
      if (await cleanProductImageBlobs(p)) {
        localModified = true;
      }
    }
    if (localModified) {
      await writeJson(PRODUCTS_FILE, products);
      console.log('Successfully migrated Base64 images in products.json and saved files locally.');
    }
  } catch (err) {
    console.error('Failed migrating local products.json:', err.message);
  }

  // 2. Migrate Supabase DB
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from('products').select('id, data');
      if (error) throw error;
      
      let dbModifiedCount = 0;
      for (const row of (data || [])) {
        const product = row.data;
        if (await cleanProductImageBlobs(product)) {
          // Update in Supabase
          const { error: updateError } = await supabase
            .from('products')
            .update({ data: product })
            .eq('id', row.id);
          if (updateError) throw updateError;
          dbModifiedCount++;
        }
      }
      if (dbModifiedCount > 0) {
        console.log(`Successfully migrated ${dbModifiedCount} product Base64 blobs in Supabase.`);
        clearProductsCache();
      }
    } catch (err) {
      console.error('Failed migrating Supabase products table:', err.message);
    }
  }
}

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function isRlsError(message) {
  return String(message || '').toLowerCase().includes('row-level security') || String(message || '').toLowerCase().includes('violates row-level security');
}

async function ensureProductsTable() {
  if (!supabase) throw new Error('Supabase not initialized');
  // Supabase table should be created via dashboard, but we check if it exists
  const { error } = await supabase.from('products').select('id').limit(1);
  if (error) {
    const msg = String(error.message || '').toLowerCase();
    const missingTableError =
      error.code === 'PGRST116' ||
      msg.includes('does not exist') ||
      msg.includes('schema cache') ||
      (msg.includes('relation') && msg.includes('does not exist')) ||
      (msg.includes('table') && msg.includes('not found'));

    if (missingTableError) {
      throw new Error(
        'Products table does not exist or is inaccessible in Supabase. Create a table named `products` with columns `id TEXT PRIMARY KEY` and `data JSONB` in the Supabase dashboard.'
      );
    }
    throw error;
  }
}

async function seedProductsFromFileIfEmpty() {
  if (!supabase) return;
  const { data, error } = await supabase.from('products').select('id').limit(1);

  if (error) {
    throw new Error(`Products table check failed: ${error.message}`);
  }

  if (!data || data.length === 0) {
    const products = await readJson(PRODUCTS_FILE, []);
    if (Array.isArray(products) && products.length > 0) {
      const { error: insertError } = await supabase.from('products').insert(
        products.map((p) => ({ id: p.id, data: p }))
      );
      if (insertError) {
        if (isRlsError(insertError.message)) {
          console.warn('Supabase insert blocked by row-level security; skipping initial seed.');
          productsDbSeedBlockedByRls = true;
          return;
        }
        throw new Error(`Could not seed products: ${insertError.message}`);
      }
      console.log('Seeded products from JSON file to Supabase');
    }
  }
}

async function ensureStorageBucket() {
  if (!supabase) return;
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    if (error) {
      console.warn('Could not list buckets. Check permissions:', error.message);
      return;
    }
    const exists = buckets.find(b => b.name === 'products');
    if (!exists) {
      console.log('Creating "products" storage bucket...');
      await supabase.storage.createBucket('products', {
        public: true,
        fileSizeLimit: 52428800,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      });
    }
  } catch (err) {
    console.error('Failed to ensure bucket:', err.message);
  }
}

async function initProductsDb() {
  if (!supabase) throw new Error('Supabase not initialized');
  await ensureProductsTable();
  await ensureStorageBucket();
  try {
    await seedProductsFromFileIfEmpty();
  } catch (err) {
    const message = String(err.message || '').toLowerCase();
    if (message.includes('row-level security') || message.includes('violates row-level security')) {
      console.warn('Supabase seed skipped due to row-level security, but the database is available for queries.');
    } else {
      throw err;
    }
  }
  productsDbAvailable = true;
}

async function getProductsFromDb() {
  if (!supabase) throw new Error('Supabase not initialized');
  const { data, error } = await supabase.from('products').select('data');
  if (error) throw error;
  const list = (data || []).map((row) => row.data);
  return list;
}

async function getProductFromDb(id) {
  if (!supabase) throw new Error('Supabase not initialized');
  const { data, error } = await supabase.from('products').select('data').eq('id', id).single();
  if (error && error.code !== 'PGRST116') throw error;
  return data ? data.data : null;
}

async function createProductInDb(product) {
  if (!supabase) throw new Error('Supabase not initialized');
  await cleanProductImageBlobs(product);
  const { error } = await supabase.from('products').insert([{ id: product.id, data: product }]);
  if (error) {
    if (isRlsError(error.message)) {
      throw new Error('Supabase write operation blocked by Row-Level Security. Please verify that the SUPABASE_SERVICE_ROLE_KEY environment variable is correctly configured on the backend.');
    }
    throw error;
  }
}

async function updateProductInDb(id, product) {
  if (!supabase) throw new Error('Supabase not initialized');
  await cleanProductImageBlobs(product);
  const { error } = await supabase.from('products').update({ data: product }).eq('id', id);
  if (error) {
    if (isRlsError(error.message)) {
      throw new Error('Supabase write operation blocked by Row-Level Security. Please verify that the SUPABASE_SERVICE_ROLE_KEY environment variable is correctly configured on the backend.');
    }
    throw error;
  }
}

async function deleteProductFromDb(id) {
  if (!supabase) throw new Error('Supabase not initialized');
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) {
    if (isRlsError(error.message)) {
      throw new Error('Supabase write operation blocked by Row-Level Security. Please verify that the SUPABASE_SERVICE_ROLE_KEY environment variable is correctly configured on the backend.');
    }
    throw error;
  }
}

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : [];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or server-to-server)
    if (!origin) return callback(null, true);

    // If ALLOWED_ORIGINS contains '*', allow all
    if (allowedOrigins.includes('*')) {
      return callback(null, true);
    }

    // Check if origin is in ALLOWED_ORIGINS
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Check if FRONTEND_URL matches
    if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) {
      return callback(null, true);
    }

    // Always allow localhost in development/testing
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return callback(null, true);
    }

    // Allow Vercel preview deployments (e.g. *.vercel.app)
    if (origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }

    // Default fallback: if no environment variables are set to restrict origins,
    // allow the request origin (same as origin: true) for backwards compatibility
    if (allowedOrigins.length === 0 && !process.env.FRONTEND_URL) {
      return callback(null, true);
    }

    console.warn(`[cors-rejection] Request rejected. Origin: ${origin}`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Customer-Token', 'X-Requested-With', 'Accept', 'Accept-Version', 'Content-Length', 'Content-MD5', 'Date', 'X-Api-Version']
}));
app.use(express.json({ limit: '15mb' }));
app.use('/api/admin', createAdminRoutes({ supabase, readJson, writeJson, dataDir: DATA_DIR }));

// Serve static files for banners & products
const BANNERS_PUBLIC_DIR = path.join(__dirname, 'public', 'assets', 'banners');
app.use('/assets/banners', express.static(BANNERS_PUBLIC_DIR));
app.use('/assets/products', express.static(PRODUCTS_PUBLIC_DIR));

async function readJson(filePath, fallback = null) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    return fallback;
  }
}

async function writeJson(filePath, data) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

async function loadUserData(customerToken) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('customers')
      .select('profile, addresses, settings, cart, wishlist')
      .eq('customer_token', customerToken)
      .single();
    if (error) {
      if (error.code === 'PGRST116') {
        const defaultData = {
          customer_token: customerToken,
          profile: {},
          addresses: [],
          settings: { newsletter: true, notifications: true },
          cart: [],
          wishlist: []
        };
        await supabase.from('customers').insert([defaultData]);
        return {
          profile: defaultData.profile,
          addresses: defaultData.addresses,
          settings: defaultData.settings,
          cart: defaultData.cart,
          wishlist: defaultData.wishlist
        };
      }
      throw error;
    }
    return {
      profile: data.profile || {},
      addresses: Array.isArray(data.addresses) ? data.addresses : [],
      settings: data.settings || {},
      cart: Array.isArray(data.cart) ? data.cart : [],
      wishlist: Array.isArray(data.wishlist) ? data.wishlist : [],
    };
  }

  const user = await readJson(USER_FILE, { profile: {}, addresses: [], settings: {}, cart: [], wishlist: [] });
  return {
    profile: user.profile || {},
    addresses: Array.isArray(user.addresses) ? user.addresses : [],
    settings: user.settings || {},
    cart: Array.isArray(user.cart) ? user.cart : [],
    wishlist: Array.isArray(user.wishlist) ? user.wishlist : [],
  };
}

async function saveUserData(customerToken, userData) {
  if (isSupabaseConfigured) {
    const { error } = await supabase
      .from('customers')
      .upsert({
        customer_token: customerToken,
        profile: userData.profile || {},
        addresses: Array.isArray(userData.addresses) ? userData.addresses : [],
        settings: userData.settings || {},
        cart: Array.isArray(userData.cart) ? userData.cart : [],
        wishlist: Array.isArray(userData.wishlist) ? userData.wishlist : [],
        updated_at: new Date().toISOString()
      });
    if (error) throw error;
    return;
  }

  await writeJson(USER_FILE, {
    profile: userData.profile || {},
    addresses: Array.isArray(userData.addresses) ? userData.addresses : [],
    settings: userData.settings || {},
    cart: Array.isArray(userData.cart) ? userData.cart : [],
    wishlist: Array.isArray(userData.wishlist) ? userData.wishlist : [],
  });
}

function validateProduct(payload) {
  if (!payload.title || typeof payload.title !== 'string') return 'Product title is required.';
  if (typeof payload.price !== 'number' || Number.isNaN(payload.price)) return 'Product price must be a number.';
  if (!payload.id || typeof payload.id !== 'string') return 'Product id is required.';
  return null;
}

app.get('/', (req, res) => {
  res.json({ message: 'Backend is running successfully!', status: 'ok' });
});

app.get('/api/ping', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/products', asyncHandler(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  if (isSupabaseConfigured) {
    const products = await getProductsFromDb();
    return res.json(products);
  }
  const products = await readJson(PRODUCTS_FILE, []);
  res.json(products);
}));

app.get('/api/products/:id', asyncHandler(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  if (isSupabaseConfigured) {
    const product = await getProductFromDb(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found.' });
    return res.json(product);
  }
  const products = await readJson(PRODUCTS_FILE, []);
  const product = products.find((item) => item.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found.' });
  res.json(product);
}));

app.post('/api/products', authenticateAdmin, asyncHandler(async (req, res) => {
  const payload = { ...req.body };
  if (!payload.id) payload.id = `P-${Date.now()}`;
  const validationError = validateProduct(payload);
  if (validationError) return res.status(400).json({ error: validationError });

  if (isSupabaseConfigured) {
    const existing = await getProductFromDb(payload.id);
    if (existing) return res.status(409).json({ error: 'Product id already exists.' });
    await createProductInDb(payload);
    return res.status(201).json(payload);
  }

  const products = await readJson(PRODUCTS_FILE, []);
  if (products.some((item) => item.id === payload.id)) {
    return res.status(409).json({ error: 'Product id already exists.' });
  }
  await cleanProductImageBlobs(payload);
  products.push(payload);
  await writeJson(PRODUCTS_FILE, products);
  clearProductsCache();
  console.log(`[product-create] Product created successfully: ${payload.id}`);
  res.status(201).json(payload);
}));

app.put('/api/products/:id', authenticateAdmin, asyncHandler(async (req, res) => {
  let updated = null;
  if (isSupabaseConfigured) {
    const existing = await getProductFromDb(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Product not found.' });
    updated = { ...existing, ...req.body, id: req.params.id };
    const validationError = validateProduct(updated);
    if (validationError) return res.status(400).json({ error: validationError });
    await updateProductInDb(req.params.id, updated);
    return res.json(updated);
  }

  const products = await readJson(PRODUCTS_FILE, []);
  const index = products.findIndex((item) => item.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Product not found.' });
  updated = { ...products[index], ...req.body, id: req.params.id };
  const validationError = validateProduct(updated);
  if (validationError) return res.status(400).json({ error: validationError });
  await cleanProductImageBlobs(updated);
  products[index] = updated;
  await writeJson(PRODUCTS_FILE, products);
  clearProductsCache();
  console.log(`[product-update] Product updated successfully: ${req.params.id}`);
  res.json(updated);
}));

app.delete('/api/products/:id', authenticateAdmin, asyncHandler(async (req, res) => {
  if (isSupabaseConfigured) {
    const existing = await getProductFromDb(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Product not found.' });
    await deleteProductFromDb(req.params.id);
    return res.status(204).end();
  }

  const products = await readJson(PRODUCTS_FILE, []);
  const next = products.filter((item) => item.id !== req.params.id);
  if (next.length === products.length) return res.status(404).json({ error: 'Product not found.' });
  await writeJson(PRODUCTS_FILE, next);
  clearProductsCache();
  res.status(204).end();
}));

app.get('/api/orders', async (req, res) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization || '';
    let isAdmin = false;
    if (authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice(7).trim();
      try {
        verifyAdminToken(token);
        isAdmin = true;
      } catch (err) {
        // Treat as guest if admin verify fails
      }
    }

    if (isSupabaseConfigured) {
      let query = supabase.from('orders').select('id, customer_token, date, status, shipping, items, total');
      if (!isAdmin) {
        const customerToken = req.headers['x-customer-token'] || 'default-guest';
        query = query.eq('customer_token', customerToken);
      }
      const { data, error } = await query.order('date', { ascending: false });
      if (error) throw error;
      return res.json(data || []);
    }

    const orders = await readJson(ORDERS_FILE, []);
    res.json(orders);
  } catch (err) {
    console.error('Failed to fetch orders:', err);
    res.status(500).json({ error: 'Failed to fetch orders.' });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const customerToken = req.headers['x-customer-token'] || 'default-guest';
    const payload = {
      ...req.body,
      id: req.body.id || `ORD-${Date.now()}`,
      date: req.body.date || new Date().toISOString(),
      status: req.body.status || 'Placed'
    };
    if (!Array.isArray(payload.items) || payload.items.length === 0) {
      return res.status(400).json({ error: 'Order must include at least one item.' });
    }

    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('orders')
        .insert([{
          id: payload.id,
          customer_token: customerToken,
          date: payload.date,
          status: payload.status,
          shipping: payload.shipping || {},
          items: payload.items,
          total: Number(payload.total || 0)
        }]);
      if (error) throw error;
      return res.status(201).json(payload);
    }

    const orders = await readJson(ORDERS_FILE, []);
    orders.push(payload);
    await writeJson(ORDERS_FILE, orders);
    res.status(201).json(payload);
  } catch (err) {
    console.error('Failed to create order:', err);
    res.status(500).json({ error: 'Failed to create order.' });
  }
});

app.put('/api/orders/:id/status', authenticateAdmin, async (req, res) => {
  try {
    const orderId = req.params.id;
    const status = req.body.status;
    if (!status) return res.status(400).json({ error: 'Status is required.' });

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)
        .select()
        .single();
      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: 'Order not found.' });
        }
        throw error;
      }
      return res.json(data);
    }

    const orders = await readJson(ORDERS_FILE, []);
    const index = orders.findIndex((item) => item.id === orderId);
    if (index === -1) return res.status(404).json({ error: 'Order not found.' });
    orders[index] = { ...orders[index], status };
    await writeJson(ORDERS_FILE, orders);
    res.json(orders[index]);
  } catch (err) {
    console.error('Failed to update order status:', err);
    res.status(500).json({ error: 'Failed to update order status.' });
  }
});

app.get('/api/user/profile', async (req, res) => {
  try {
    const customerToken = req.headers['x-customer-token'] || 'default-guest';
    const user = await loadUserData(customerToken);
    res.json(user);
  } catch (err) {
    console.error('Failed to load user profile:', err);
    res.status(500).json({ error: 'Failed to load user profile.' });
  }
});

app.put('/api/user/profile', async (req, res) => {
  try {
    const customerToken = req.headers['x-customer-token'] || 'default-guest';
    const user = await loadUserData(customerToken);
    user.profile = { ...user.profile, ...req.body };
    await saveUserData(customerToken, user);
    res.json(user.profile);
  } catch (err) {
    console.error('Failed to update user profile:', err);
    res.status(500).json({ error: 'Failed to update user profile.' });
  }
});

app.get('/api/user/settings', async (req, res) => {
  try {
    const customerToken = req.headers['x-customer-token'] || 'default-guest';
    const user = await loadUserData(customerToken);
    res.json(user.settings);
  } catch (err) {
    console.error('Failed to load user settings:', err);
    res.status(500).json({ error: 'Failed to load user settings.' });
  }
});

app.put('/api/user/settings', async (req, res) => {
  try {
    const customerToken = req.headers['x-customer-token'] || 'default-guest';
    const user = await loadUserData(customerToken);
    user.settings = { ...user.settings, ...req.body };
    await saveUserData(customerToken, user);
    res.json(user.settings);
  } catch (err) {
    console.error('Failed to update user settings:', err);
    res.status(500).json({ error: 'Failed to update user settings.' });
  }
});

app.get('/api/user/addresses', async (req, res) => {
  try {
    const customerToken = req.headers['x-customer-token'] || 'default-guest';
    const user = await loadUserData(customerToken);
    res.json(user.addresses);
  } catch (err) {
    console.error('Failed to load user addresses:', err);
    res.status(500).json({ error: 'Failed to load user addresses.' });
  }
});

app.post('/api/user/addresses', async (req, res) => {
  try {
    const customerToken = req.headers['x-customer-token'] || 'default-guest';
    const user = await loadUserData(customerToken);
    const address = { id: `A-${Date.now()}`, ...req.body };
    user.addresses = [...user.addresses, address];
    await saveUserData(customerToken, user);
    res.status(201).json(address);
  } catch (err) {
    console.error('Failed to add user address:', err);
    res.status(500).json({ error: 'Failed to add user address.' });
  }
});

app.delete('/api/user/addresses/:addressId', async (req, res) => {
  try {
    const customerToken = req.headers['x-customer-token'] || 'default-guest';
    const user = await loadUserData(customerToken);
    user.addresses = user.addresses.filter((a) => a.id !== req.params.addressId);
    await saveUserData(customerToken, user);
    res.status(204).end();
  } catch (err) {
    console.error('Failed to delete user address:', err);
    res.status(500).json({ error: 'Failed to delete user address.' });
  }
});

app.get('/api/user/cart', async (req, res) => {
  try {
    const customerToken = req.headers['x-customer-token'] || 'default-guest';
    const user = await loadUserData(customerToken);
    res.json(user.cart);
  } catch (err) {
    console.error('Failed to load user cart:', err);
    res.status(500).json({ error: 'Failed to load user cart.' });
  }
});

app.put('/api/user/cart', async (req, res) => {
  try {
    if (!Array.isArray(req.body)) {
      return res.status(400).json({ error: 'Cart payload must be an array.' });
    }
    const customerToken = req.headers['x-customer-token'] || 'default-guest';
    const user = await loadUserData(customerToken);
    user.cart = req.body;
    await saveUserData(customerToken, user);
    res.json(user.cart);
  } catch (err) {
    console.error('Failed to update user cart:', err);
    res.status(500).json({ error: 'Failed to update user cart.' });
  }
});

app.delete('/api/user/cart', async (req, res) => {
  try {
    const customerToken = req.headers['x-customer-token'] || 'default-guest';
    const user = await loadUserData(customerToken);
    user.cart = [];
    await saveUserData(customerToken, user);
    res.status(204).end();
  } catch (err) {
    console.error('Failed to clear user cart:', err);
    res.status(500).json({ error: 'Failed to clear user cart.' });
  }
});

app.get('/api/user/wishlist', async (req, res) => {
  try {
    const customerToken = req.headers['x-customer-token'] || 'default-guest';
    const user = await loadUserData(customerToken);
    res.json(user.wishlist);
  } catch (err) {
    console.error('Failed to load user wishlist:', err);
    res.status(500).json({ error: 'Failed to load user wishlist.' });
  }
});

app.put('/api/user/wishlist', async (req, res) => {
  try {
    if (!Array.isArray(req.body)) {
      return res.status(400).json({ error: 'Wishlist payload must be an array.' });
    }
    const customerToken = req.headers['x-customer-token'] || 'default-guest';
    const user = await loadUserData(customerToken);
    user.wishlist = Array.from(new Set(req.body.map(String)));
    await saveUserData(customerToken, user);
    res.json(user.wishlist);
  } catch (err) {
    console.error('Failed to update user wishlist:', err);
    res.status(500).json({ error: 'Failed to update user wishlist.' });
  }
});

// Banner endpoints
app.get('/api/banners', async (req, res) => {
  try {
    if (isSupabaseConfigured) {
      if (bannersCache) return res.json(bannersCache);
      const { data, error } = await supabase
        .from('banners')
        .select('id, title, subtitle, image, display_order')
        .order('display_order', { ascending: true })
        .order('id', { ascending: true });
      if (error) throw error;

      if (!data || data.length === 0) {
        const defaults = [
          { title: 'Default Banner 1', subtitle: 'Shop our collection', image: '/assets/banners/hero1.jpg', display_order: 1 },
          { title: 'Default Banner 2', subtitle: 'New arrivals', image: '/assets/banners/hero2.jpg', display_order: 2 },
        ];
        const { data: seeded, error: seedError } = await supabase.from('banners').insert(defaults).select('id, title, subtitle, image, display_order');
        if (seedError) throw seedError;
        bannersCache = seeded;
        return res.json(seeded || []);
      }
      bannersCache = data;
      return res.json(data);
    }

    let banners = await readJson(BANNERS_FILE, []);
    if (!Array.isArray(banners) || banners.length === 0) {
      const defaults = [
        { id: 1, title: 'Default Banner 1', subtitle: 'Shop our collection', image: '/assets/banners/hero1.jpg' },
        { id: 2, title: 'Default Banner 2', subtitle: 'New arrivals', image: '/assets/banners/hero2.jpg' },
      ];
      await writeJson(BANNERS_FILE, defaults);
      banners = defaults;
    }
    res.json(banners);
  } catch (err) {
    console.error('Failed to fetch banners:', err);
    res.status(500).json({ error: 'Failed to fetch banners.' });
  }
});

app.post('/api/banners', authenticateAdmin, async (req, res) => {
  try {
    const payload = { ...req.body };
    if (!payload.title || typeof payload.title !== 'string') {
      return res.status(400).json({ error: 'Banner title is required.' });
    }
    if (!payload.image || typeof payload.image !== 'string') {
      return res.status(400).json({ error: 'Banner image is required.' });
    }

    if (isSupabaseConfigured) {
      const { data: maxOrderData } = await supabase
        .from('banners')
        .select('display_order')
        .order('display_order', { ascending: false })
        .limit(1);
      const maxOrder = maxOrderData?.[0]?.display_order || 0;

      const { data, error } = await supabase
        .from('banners')
        .insert([{
          title: payload.title,
          subtitle: payload.subtitle || '',
          image: payload.image,
          display_order: maxOrder + 1
        }])
        .select()
        .single();
      if (error) throw error;
      clearBannersCache();
      return res.status(201).json(data);
    }

    const banners = await readJson(BANNERS_FILE, []);
    const newBanner = { ...payload, id: Math.max(...banners.map(b => b.id), 0) + 1 };
    banners.push(newBanner);
    await writeJson(BANNERS_FILE, banners);
    clearBannersCache();
    res.status(201).json(newBanner);
  } catch (err) {
    console.error('Failed to create banner:', err);
    res.status(500).json({ error: 'Failed to create banner.' });
  }
});

app.put('/api/banners/:id', authenticateAdmin, async (req, res) => {
  try {
    const bannerId = parseInt(req.params.id);
    const payload = req.body;
    if (!payload.title || typeof payload.title !== 'string') {
      return res.status(400).json({ error: 'Banner title is required.' });
    }
    if (!payload.image || typeof payload.image !== 'string') {
      return res.status(400).json({ error: 'Banner image is required.' });
    }

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('banners')
        .update({
          title: payload.title,
          subtitle: payload.subtitle || '',
          image: payload.image
        })
        .eq('id', bannerId)
        .select()
        .single();
      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({ error: 'Banner not found.' });
        }
        throw error;
      }
      clearBannersCache();
      return res.json(data);
    }

    const banners = await readJson(BANNERS_FILE, []);
    const index = banners.findIndex((b) => b.id === bannerId);
    if (index === -1) return res.status(404).json({ error: 'Banner not found.' });
    banners[index] = { ...banners[index], ...payload, id: bannerId };
    await writeJson(BANNERS_FILE, banners);
    clearBannersCache();
    res.json(banners[index]);
  } catch (err) {
    console.error('Failed to update banner:', err);
    res.status(500).json({ error: 'Failed to update banner.' });
  }
});

app.delete('/api/banners/:id', authenticateAdmin, async (req, res) => {
  try {
    const bannerId = parseInt(req.params.id);
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('banners')
        .delete()
        .eq('id', bannerId);
      if (error) throw error;
      clearBannersCache();
      return res.status(204).end();
    }

    const banners = await readJson(BANNERS_FILE, []);
    const next = banners.filter((b) => b.id !== bannerId);
    if (next.length === banners.length) return res.status(404).json({ error: 'Banner not found.' });
    await writeJson(BANNERS_FILE, next);
    clearBannersCache();
    res.status(204).end();
  } catch (err) {
    console.error('Failed to delete banner:', err);
    res.status(500).json({ error: 'Failed to delete banner.' });
  }
});

app.post('/api/banners/upload', authenticateAdmin, async (req, res) => {
  try {
    const { filename, data } = req.body || {};
    if (!filename || !data) return res.status(400).json({ error: 'filename and data are required.' });

    const targetDir = BANNERS_PUBLIC_DIR;
    await fs.mkdir(targetDir, { recursive: true });

    const base64 = typeof data === 'string' && data.indexOf('base64,') !== -1 ? data.split('base64,')[1] : data;
    const buffer = Buffer.from(base64, 'base64');
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '-');
    const dest = path.join(targetDir, safeName);
    await fs.writeFile(dest, buffer);

    const publicPath = `/assets/banners/${safeName}`;
    res.json({ path: publicPath });
  } catch (err) {
    console.error('banner upload error', err);
    res.status(500).json({ error: 'Failed to upload image.' });
  }
});

app.post('/api/banners/reorder', authenticateAdmin, async (req, res) => {
  try {
    const payload = req.body;
    if (!Array.isArray(payload)) {
      return res.status(400).json({ error: 'Invalid payload, expected array.' });
    }

    if (isSupabaseConfigured) {
      if (payload.length === 0) {
        const { data } = await supabase.from('banners').select('id, title, subtitle, image, display_order').order('display_order', { ascending: true });
        return res.json(data || []);
      }

      const promises = [];
      for (let index = 0; index < payload.length; index++) {
        const item = payload[index];
        const id = typeof item === 'object' ? item.id : parseInt(item);
        if (id) {
          promises.push(
            supabase.from('banners').update({ display_order: index }).eq('id', id)
          );
        }
      }
      await Promise.all(promises);
      clearBannersCache();

      const { data, error } = await supabase
        .from('banners')
        .select('id, title, subtitle, image, display_order')
        .order('display_order', { ascending: true });
      if (error) throw error;
      return res.json(data || []);
    }

    let banners = await readJson(BANNERS_FILE, []);
    if (payload.length > 0) {
      if (typeof payload[0] === 'number' || typeof payload[0] === 'string') {
        const idOrder = payload.map((v) => parseInt(v));
        const map = Object.fromEntries(banners.map((b) => [b.id, b]));
        banners = idOrder.map((id) => map[id]).filter(Boolean);
      } else if (typeof payload[0] === 'object') {
        banners = payload;
      }
      await writeJson(BANNERS_FILE, banners);
      clearBannersCache();
    }
    res.json(banners);
  } catch (err) {
    console.error('reorder error', err);
    res.status(500).json({ error: 'Failed to reorder banners.' });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found.' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  if (res.headersSent) {
    return next(err);
  }
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal Server Error' });
});

// Sync admin password hashes from local admins.json into Supabase on startup.
// This ensures that any password corrections deployed via git propagate to the DB.
async function syncAdminHashes() {
  if (!supabase) return;
  try {
    const ADMINS_FILE = path.join(DATA_DIR, 'admins.json');
    const localAdmins = JSON.parse(await fs.readFile(ADMINS_FILE, 'utf8'));
    if (!Array.isArray(localAdmins) || localAdmins.length === 0) return;

    for (const admin of localAdmins) {
      if (!admin.email || !admin.password_hash) continue;
      const { error } = await supabase
        .from('admins')
        .upsert({
          id: admin.id,
          name: admin.name,
          email: admin.email.trim().toLowerCase(),
          password_hash: admin.password_hash,
          role: admin.role,
        }, { onConflict: 'email' });
      if (error) {
        console.warn(`[admin-sync] Failed to sync admin ${admin.email}:`, error.message);
      } else {
        console.log(`[admin-sync] Synced admin hash for: ${admin.email}`);
      }
    }
  } catch (err) {
    console.warn('[admin-sync] Could not sync admin hashes:', err.message);
  }
}

// Initialize database at startup (top-level async IIFE)
(async () => {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (err) {
    // Ignore error if folder creation fails
  }
  if (isSupabaseConfigured) {
    try {
      await initProductsDb();
      console.log('Products DB initialized and connected.');
      // Sync admin password hashes from local file to Supabase
      syncAdminHashes().catch((syncErr) => {
        console.warn('[admin-sync] Startup sync error:', syncErr.message);
      });
      // Run the migration tool to clean up existing base64 product blobs asynchronously
      migrateBase64Products().catch((mErr) => {
        console.error('Migration error:', mErr.message);
      });
    } catch (err) {
      productsDbAvailable = false;
      console.warn('WARNING: Products DB not available on startup:', err && err.message ? err.message : err);
      console.warn('Backend will fall back to local JSON storage for this session.');
    }
  } else {
    console.log('Supabase not configured. Using local JSON fallback storage.');
  }
})();

// Start server locally (if run directly, not required by Vercel)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
  });
}

module.exports = app;

