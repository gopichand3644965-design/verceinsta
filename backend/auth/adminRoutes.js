const express = require('express');
const bcrypt = require('bcrypt');
const { signAdminToken } = require('./token');
const { authenticateAdmin, loginRateLimiter } = require('./middleware');
const path = require('path');

function normalizeEmail(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function validateLoginInputs(email, password) {
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return 'Please enter a valid email address.';
  }
  if (!password || typeof password !== 'string' || password.length < 8) {
    return 'Password must be at least 8 characters long.';
  }
  return null;
}

function createAdminRouter({ supabase, readJson, writeJson, dataDir }) {
  const router = express.Router();

  async function findAdminByEmail(email) {
    const normalizedEmail = normalizeEmail(email);
    const adminFile = path.join(dataDir, 'admins.json');
    const loadLocalAdmin = async () => {
      const admins = (await readJson(adminFile, [])).filter(Boolean);
      return admins.find((admin) => normalizeEmail(admin.email) === normalizedEmail) || null;
    };

    const isSupabaseConfigured = !!supabase;

    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('admins')
        .select('id,name,email,password_hash,role')
        .eq('email', normalizedEmail)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Supabase admin lookup failed: ${error.message}`);
      }

      return data || null;
    }

    return loadLocalAdmin();
  }

  router.post('/login', loginRateLimiter, async (req, res) => {
    const { email, password } = req.body || {};
    const validationError = validateLoginInputs(email, password);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    console.log('[admin-login] attempt for email:', String(email || '').trim().toLowerCase());
    const admin = await findAdminByEmail(email);
    console.log('[admin-login] admin record found:', !!admin, 'email:', admin ? admin.email : 'n/a');
    if (!admin || !admin.password_hash) {
      console.warn('[admin-login] no admin or missing password_hash for', email);
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Compare password (do not log passwords)
    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(password, admin.password_hash);
    } catch (err) {
      console.error('[admin-login] bcrypt compare error for', email, err && err.message);
      return res.status(500).json({ error: 'Internal server error.' });
    }
    console.log('[admin-login] password match:', !!isMatch, 'for', email);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = signAdminToken(admin);
    return res.json({
      token,
      expiresIn: process.env.JWT_EXPIRES_IN || '2h',
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  });

  router.get('/verify', authenticateAdmin, (req, res) => {
    return res.json({ admin: req.admin });
  });

  router.get('/profile', authenticateAdmin, (req, res) => {
    return res.json({ admin: req.admin });
  });

  return router;
}

module.exports = createAdminRouter;
