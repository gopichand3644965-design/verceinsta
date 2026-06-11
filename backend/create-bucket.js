require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const sb = createClient(url, key);

(async () => {
  try {
    console.log('Creating storage bucket "products"...');
    
    const { data, error } = await sb.storage.createBucket('products', {
      public: true,
      fileSizeLimit: 52428800, // 50MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    });

    if (error) {
      if (error.message && error.message.includes('already exists')) {
        console.log('✓ Bucket "products" already exists');
      } else {
        console.log('ERROR:', error.message);
      }
    } else {
      console.log('✓ Bucket "products" created successfully');
      console.log('Details:', data);
    }

    // Verify bucket now exists
    const { data: buckets } = await sb.storage.listBuckets();
    console.log('\nAvailable buckets:', buckets.map(b => `${b.name} (public: ${b.public})`).join(', '));
  } catch (e) {
    console.log('Exception:', e.message);
  }
})();
