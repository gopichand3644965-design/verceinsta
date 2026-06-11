require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('SUPABASE_URL present:', !!url);
console.log('SERVICE_ROLE_KEY present:', !!key);

const sb = createClient(url, key);

(async () => {
  try {
    // List buckets
    const { data: buckets, error: err } = await sb.storage.listBuckets();
    if (err) {
      console.log('ERROR listing buckets:', err.message);
      return;
    }
    console.log('BUCKETS:', buckets.map(b => b.name).join(', '));

    // Check products bucket
    const { data: prod, error: prodErr } = await sb.storage.from('products').list('', { limit: 1 });
    if (prodErr) {
      console.log('BUCKET products ERROR:', prodErr.message);
    } else {
      console.log('BUCKET products EXISTS and is accessible');
      console.log('Sample files:', prod.slice(0, 3).map(f => f.name).join(', ') || '(empty)');
    }
  } catch (e) {
    console.log('EXCEPTION:', e.message);
  }
})();
