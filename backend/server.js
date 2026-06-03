const express = require('express');
const path = require('path');
const fs = require('fs/promises');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const createAdminRoutes = require('./auth/adminRoutes');
const { authenticateAdmin } = require('./auth/middleware');
require('dotenv').config();

const app = express();
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

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
} else {
  console.warn('Supabase credentials not found. Set SUPABASE_URL and SUPABASE_KEY or SUPABASE_SERVICE_ROLE_KEY in .env');
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

async function initProductsDb() {
  if (!supabase) throw new Error('Supabase not initialized');
  await ensureProductsTable();
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
  return (data || []).map((row) => row.data);
}

async function getProductFromDb(id) {
  if (!supabase) throw new Error('Supabase not initialized');
  const { data, error } = await supabase.from('products').select('data').eq('id', id).single();
  if (error && error.code !== 'PGRST116') throw error;
  return data ? data.data : null;
}

async function createProductInDb(product) {
  if (!supabase) throw new Error('Supabase not initialized');
  const { error } = await supabase.from('products').insert([{ id: product.id, data: product }]);
  if (error) throw error;
}

async function updateProductInDb(id, product) {
  if (!supabase) throw new Error('Supabase not initialized');
  const { error } = await supabase.from('products').update({ data: product }).eq('id', id);
  if (error) throw error;
}

async function deleteProductFromDb(id) {
  if (!supabase) throw new Error('Supabase not initialized');
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw error;
}

app.use(cors({ origin: true }));
app.use(express.json({ limit: '15mb' }));
app.use('/api/admin', createAdminRoutes({ supabase, readJson, writeJson, dataDir: DATA_DIR }));

// Serve static files for banners
const BANNERS_PUBLIC_DIR = path.join(__dirname, 'public', 'assets', 'banners');
app.use('/assets/banners', express.static(BANNERS_PUBLIC_DIR));

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

function validateProduct(payload) {
  if (!payload.title || typeof payload.title !== 'string') return 'Product title is required.';
  if (typeof payload.price !== 'number' || Number.isNaN(payload.price)) return 'Product price must be a number.';
  if (!payload.id || typeof payload.id !== 'string') return 'Product id is required.';
  return null;
}

app.get('/api/ping', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/products', asyncHandler(async (req, res) => {
  if (productsDbAvailable) {
    try {
      const products = await getProductsFromDb();
      if (products && products.length > 0) {
        return res.json(products);
      }
      if (productsDbSeedBlockedByRls) {
        console.warn('Products DB is available but empty due to RLS seed block; returning local JSON products.');
      }
    } catch (error) {
      console.warn('Products DB read failed, falling back to local JSON:', error.message || error);
    }
  }
  const products = await readJson(PRODUCTS_FILE, []);
  res.json(products);
}));

app.get('/api/products/:id', asyncHandler(async (req, res) => {
  if (productsDbAvailable) {
    try {
      const product = await getProductFromDb(req.params.id);
      if (product) return res.json(product);
      if (!productsDbSeedBlockedByRls) {
        return res.status(404).json({ error: 'Product not found.' });
      }
      console.warn('Product not found in Supabase, falling back to local JSON.');
    } catch (error) {
      console.warn('Products DB item read failed, falling back to local JSON:', error.message || error);
    }
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

  if (productsDbAvailable) {
    try {
      const existing = await getProductFromDb(payload.id);
      if (existing) return res.status(409).json({ error: 'Product id already exists.' });
      await createProductInDb(payload);
      return res.status(201).json(payload);
    } catch (error) {
      console.warn('Products DB write failed on create, falling back to local JSON:', error.message || error);
    }
  }

  const products = await readJson(PRODUCTS_FILE, []);
  if (products.some((item) => item.id === payload.id)) {
    return res.status(409).json({ error: 'Product id already exists.' });
  }
  products.push(payload);
  await writeJson(PRODUCTS_FILE, products);
  res.status(201).json(payload);
}));

app.put('/api/products/:id', authenticateAdmin, asyncHandler(async (req, res) => {
  let updated = null;
  if (productsDbAvailable) {
    try {
      const existing = await getProductFromDb(req.params.id);
      if (existing) {
        updated = { ...existing, ...req.body, id: req.params.id };
        const validationError = validateProduct(updated);
        if (validationError) return res.status(400).json({ error: validationError });
        await updateProductInDb(req.params.id, updated);
        return res.json(updated);
      }
      if (!productsDbSeedBlockedByRls) {
        return res.status(404).json({ error: 'Product not found.' });
      }
      console.warn('Product not found in Supabase, falling back to local JSON.');
    } catch (error) {
      console.warn('Products DB write failed on update, falling back to local JSON:', error.message || error);
    }
  }

  const products = await readJson(PRODUCTS_FILE, []);
  const index = products.findIndex((item) => item.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Product not found.' });
  updated = { ...products[index], ...req.body, id: req.params.id };
  const validationError = validateProduct(updated);
  if (validationError) return res.status(400).json({ error: validationError });
  products[index] = updated;
  await writeJson(PRODUCTS_FILE, products);
  res.json(updated);
}));

app.delete('/api/products/:id', authenticateAdmin, asyncHandler(async (req, res) => {
  let existing = null;
  if (productsDbAvailable) {
    try {
      existing = await getProductFromDb(req.params.id);
      if (existing) {
        await deleteProductFromDb(req.params.id);
        return res.status(204).end();
      }
      if (!productsDbSeedBlockedByRls) {
        return res.status(404).json({ error: 'Product not found.' });
      }
      console.warn('Product not found in Supabase, falling back to local JSON.');
    } catch (error) {
      console.warn('Products DB write failed on delete, falling back to local JSON:', error.message || error);
    }
  }

  const products = await readJson(PRODUCTS_FILE, []);
  const next = products.filter((item) => item.id !== req.params.id);
  if (next.length === products.length) return res.status(404).json({ error: 'Product not found.' });
  await writeJson(PRODUCTS_FILE, next);
  res.status(204).end();
}));

app.get('/api/orders', async (req, res) => {
  const orders = await readJson(ORDERS_FILE, []);
  res.json(orders);
});

app.post('/api/orders', async (req, res) => {
  const orders = await readJson(ORDERS_FILE, []);
  const payload = { ...req.body, id: req.body.id || `ORD-${Date.now()}`, date: req.body.date || new Date().toISOString(), status: req.body.status || 'Placed' };
  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    return res.status(400).json({ error: 'Order must include at least one item.' });
  }
  orders.push(payload);
  await writeJson(ORDERS_FILE, orders);
  res.status(201).json(payload);
});

app.put('/api/orders/:id/status', authenticateAdmin, async (req, res) => {
  const orders = await readJson(ORDERS_FILE, []);
  const index = orders.findIndex((item) => item.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Order not found.' });
  orders[index] = { ...orders[index], status: req.body.status || orders[index].status };
  await writeJson(ORDERS_FILE, orders);
  res.json(orders[index]);
});

app.get('/api/user/profile', async (req, res) => {
  const user = await readJson(USER_FILE, { profile: {}, addresses: [], settings: {} });
  res.json(user);
});

app.put('/api/user/profile', async (req, res) => {
  const user = await readJson(USER_FILE, { profile: {}, addresses: [], settings: {} });
  user.profile = { ...user.profile, ...req.body };
  await writeJson(USER_FILE, user);
  res.json(user.profile);
});

app.get('/api/user/settings', async (req, res) => {
  const user = await readJson(USER_FILE, { profile: {}, addresses: [], settings: {} });
  res.json(user.settings || {});
});

app.put('/api/user/settings', async (req, res) => {
  const user = await readJson(USER_FILE, { profile: {}, addresses: [], settings: {} });
  user.settings = { ...user.settings, ...req.body };
  await writeJson(USER_FILE, user);
  res.json(user.settings);
});

app.get('/api/user/addresses', async (req, res) => {
  const user = await readJson(USER_FILE, { profile: {}, addresses: [], settings: {} });
  res.json(user.addresses || []);
});

app.post('/api/user/addresses', async (req, res) => {
  const user = await readJson(USER_FILE, { profile: {}, addresses: [], settings: {} });
  const address = { id: `A-${Date.now()}`, ...req.body };
  user.addresses = [...(user.addresses || []), address];
  await writeJson(USER_FILE, user);
  res.status(201).json(address);
});

app.delete('/api/user/addresses/:addressId', async (req, res) => {
  const user = await readJson(USER_FILE, { profile: {}, addresses: [], settings: {}, cart: [] });
  const next = (user.addresses || []).filter((a) => a.id !== req.params.addressId);
  user.addresses = next;
  await writeJson(USER_FILE, user);
  res.status(204).end();
});

app.get('/api/user/cart', async (req, res) => {
  const user = await readJson(USER_FILE, { profile: {}, addresses: [], settings: {}, cart: [] });
  res.json(user.cart || []);
});

app.put('/api/user/cart', async (req, res) => {
  const user = await readJson(USER_FILE, { profile: {}, addresses: [], settings: {}, cart: [] });
  if (!Array.isArray(req.body)) {
    return res.status(400).json({ error: 'Cart payload must be an array.' });
  }
  user.cart = req.body;
  await writeJson(USER_FILE, user);
  res.json(user.cart);
});

app.delete('/api/user/cart', async (req, res) => {
  const user = await readJson(USER_FILE, { profile: {}, addresses: [], settings: {}, cart: [] });
  user.cart = [];
  await writeJson(USER_FILE, user);
  res.status(204).end();
});

// Banner endpoints
app.get('/api/banners', async (req, res) => {
  let banners = await readJson(BANNERS_FILE, []);
  if (!Array.isArray(banners) || banners.length === 0) {
    const defaults = [
      { id: 1, title: 'Default Banner 1', subtitle: 'Shop our collection', image: '/assets/banners/hero1.jpg' },
      { id: 2, title: 'Default Banner 2', subtitle: 'New arrivals', image: '/assets/banners/hero2.jpg' },
    ];
    // Persist defaults so admin can edit/replace them later
    await writeJson(BANNERS_FILE, defaults);
    banners = defaults;
  }
  res.json(banners);
});

app.post('/api/banners', authenticateAdmin, async (req, res) => {
  const banners = await readJson(BANNERS_FILE, []);
  const payload = { ...req.body, id: req.body.id || Math.max(...banners.map(b => b.id), 0) + 1 };
  if (!payload.title || typeof payload.title !== 'string') {
    return res.status(400).json({ error: 'Banner title is required.' });
  }
  if (!payload.image || typeof payload.image !== 'string') {
    return res.status(400).json({ error: 'Banner image is required.' });
  }
  banners.push(payload);
  await writeJson(BANNERS_FILE, banners);
  res.status(201).json(payload);
});

app.put('/api/banners/:id', authenticateAdmin, async (req, res) => {
  const banners = await readJson(BANNERS_FILE, []);
  const index = banners.findIndex((b) => b.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ error: 'Banner not found.' });
  const updated = { ...banners[index], ...req.body, id: parseInt(req.params.id) };
  if (!updated.title || typeof updated.title !== 'string') {
    return res.status(400).json({ error: 'Banner title is required.' });
  }
  if (!updated.image || typeof updated.image !== 'string') {
    return res.status(400).json({ error: 'Banner image is required.' });
  }
  banners[index] = updated;
  await writeJson(BANNERS_FILE, banners);
  res.json(updated);
});

app.delete('/api/banners/:id', authenticateAdmin, async (req, res) => {
  const banners = await readJson(BANNERS_FILE, []);
  const next = banners.filter((b) => b.id !== parseInt(req.params.id));
  if (next.length === banners.length) return res.status(404).json({ error: 'Banner not found.' });
  await writeJson(BANNERS_FILE, next);
  res.status(204).end();
});

// Upload banner image (base64 payload)
app.post('/api/banners/upload', authenticateAdmin, async (req, res) => {
  try {
    const { filename, data } = req.body || {};
    if (!filename || !data) return res.status(400).json({ error: 'filename and data are required.' });

    // Store in backend public directory, not frontend
    const targetDir = BANNERS_PUBLIC_DIR;
    await fs.mkdir(targetDir, { recursive: true });

    // Strip data URL prefix if present
    const base64 = typeof data === 'string' && data.indexOf('base64,') !== -1 ? data.split('base64,')[1] : data;
    const buffer = Buffer.from(base64, 'base64');
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '-');
    const dest = path.join(targetDir, safeName);
    await fs.writeFile(dest, buffer);

    // Return public path for frontend usage (goes through Vite proxy to backend)
    const publicPath = `/assets/banners/${safeName}`;
    res.json({ path: publicPath });
  } catch (err) {
    console.error('banner upload error', err);
    res.status(500).json({ error: 'Failed to upload image.' });
  }
});

// Reorder banners (accepts array of banner ids in new order or full banners array)
app.post('/api/banners/reorder', authenticateAdmin, async (req, res) => {
  try {
    const payload = req.body;
    let banners = await readJson(BANNERS_FILE, []);
    if (Array.isArray(payload)) {
      // payload may be array of ids or full banner objects
      if (payload.length === 0) return res.json(banners);
      if (typeof payload[0] === 'number' || typeof payload[0] === 'string') {
        // array of ids
        const idOrder = payload.map((v) => parseInt(v));
        const map = Object.fromEntries(banners.map((b) => [b.id, b]));
        banners = idOrder.map((id) => map[id]).filter(Boolean);
      } else if (typeof payload[0] === 'object') {
        banners = payload;
      }
      await writeJson(BANNERS_FILE, banners);
      return res.json(banners);
    }
    return res.status(400).json({ error: 'Invalid payload, expected array.' });
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

app.listen(PORT, async () => {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await initProductsDb();
    console.log('Products DB initialized and connected.');
  } catch (err) {
    productsDbAvailable = false;
    console.warn('Products DB not available, falling back to JSON storage:', err && err.message ? err.message : err);
  }
  console.log(`Backend running on http://localhost:${PORT}`);
});
