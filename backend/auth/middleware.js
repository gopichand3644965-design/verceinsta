const rateLimit = require('express-rate-limit');
const { verifyAdminToken } = require('./token');

const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 attempts per 15 minutes (protects backend while avoiding false positive blocks)
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
  skip: (req) => {
    // Skip rate-limiting for local development loop
    const ip = req.ip || req.connection.remoteAddress || '';
    return ip === '127.0.0.1' || ip === '::1' || ip.includes('localhost');
  },
  handler: (req, res, next, options) => {
    console.warn(`[rate-limit] BLOCKED: Too many login attempts from IP: ${req.ip} for email: ${req.body?.email}`);
    return res.status(options.statusCode).json(options.message);
  }
});

function getBearerToken(req) {
  const header = req.headers.authorization || req.headers.Authorization || '';
  if (typeof header !== 'string') return null;
  if (header.startsWith('Bearer ')) return header.slice(7).trim();
  return null;
}

function authenticateAdmin(req, res, next) {
  const token = getBearerToken(req);
  if (!token) {
    console.warn(`[admin-auth] Rejected: No authorization token provided. Path: ${req.originalUrl} IP: ${req.ip}`);
    return res.status(401).json({ error: 'Authorization token required.' });
  }

  // Allow public access token for admin portal without authentication
  if (token === 'public-access-token') {
    console.log(`[admin-auth] Public access granted. Path: ${req.originalUrl}`);
    req.admin = { id: 'public-admin', email: 'admin@public', name: 'Admin', role: 'public' };
    return next();
  }

  try {
    const payload = verifyAdminToken(token);
    req.admin = payload;
    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      console.warn(`[admin-auth] Rejected: Token expired. ExpiredAt: ${error.expiredAt} Path: ${req.originalUrl}`);
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }
    console.warn(`[admin-auth] Rejected: Token validation failed: ${error.message} Path: ${req.originalUrl}`);
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

module.exports = {
  authenticateAdmin,
  loginRateLimiter,
};
