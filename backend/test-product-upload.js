require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');

// Create a small valid PNG base64 (1x1 red pixel)
const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';
const dataUrl = `data:image/png;base64,${pngBase64}`;

const product = {
  id: `TEST-PROD-${Date.now()}`,
  title: 'Test Product with Image',
  description: 'Testing Supabase Storage image persistence',
  price: 29.99,
  category: 'Test',
  stock: 10,
  image: dataUrl,
  images: [dataUrl],
};

console.log('Test Product ID:', product.id);
console.log('Image field: Base64 PNG (1x1 pixel)');

const postData = JSON.stringify(product);

const opts = {
  hostname: 'localhost',
  port: 4000,
  path: '/api/products',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer public-access-token',
    'Content-Length': Buffer.byteLength(postData),
  },
};

const req = http.request(opts, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('\n--- CREATE PRODUCT RESPONSE ---');
    console.log('Status:', res.statusCode);
    try {
      const resp = JSON.parse(data);
      console.log('Response:', JSON.stringify(resp, null, 2));
      if (resp.image) {
        console.log('\n--- IMAGE PATH ANALYSIS ---');
        console.log('Stored image field:', resp.image);
        const isSupabaseUrl = resp.image.includes('.supabase.co') || resp.image.includes('supabase');
        const isLocalPath = resp.image.startsWith('/assets/products');
        console.log('Is Supabase URL:', isSupabaseUrl);
        console.log('Is Local path:', isLocalPath);
        
        if (isSupabaseUrl) {
          console.log('\n✓ SUCCESS: Image stored as permanent Supabase URL');
        } else if (isLocalPath) {
          console.log('\n⚠ WARNING: Image stored as local path (fallback mode)');
        }
      }
    } catch (e) {
      console.log('Response (raw):', data);
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e);
});

req.write(postData);
req.end();
