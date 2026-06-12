
const { createClient } = require('@supabase/supabase-js');

const url = 'https://rnjmgwnaciklrkowxnuo.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJuam1nd25hY2lrbHJrb3d4bnVvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTA0NzIyOCwiZXhwIjoyMDk2NjIzMjI4fQ.FhadzBJSuUJbz-9xGzoSY6zD2lVhU0HXstbZqQhis84';
const sb = createClient(url, key);

(async () => {
  try {
    console.log('Checking buckets...');
    const { data: buckets, error: listError } = await sb.storage.listBuckets();
    if (listError) throw listError;

    const exists = buckets.find(b => b.name === 'products');
    if (!exists) {
      console.log('Creating "products" storage bucket...');
      const { data, error } = await sb.storage.createBucket('products', {
        public: true,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      });
      if (error) {
        console.log('ERROR:', error.message);
      } else {
        console.log('✓ Bucket "products" created successfully');
      }
    } else {
      console.log('✓ Bucket "products" already exists and is public:', exists.public);
      if (!exists.public) {
        console.log('Bucket is private! Updating to public...');
        await sb.storage.updateBucket('products', { public: true });
        console.log('Bucket updated to public.');
      }
    }

    const { data: bucketsAfter } = await sb.storage.listBuckets();
    console.log('\nAvailable buckets:', bucketsAfter.map(b => `${b.name} (public: ${b.public})`).join(', '));
  } catch (e) {
    console.log('Exception:', e.message);
  }
})();
