const { createClient } = require('@supabase/supabase-js');

const url = 'https://rnjmgwnaciklrkowxnuo.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJuam1nd25hY2lrbHJrb3d4bnVvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTA0NzIyOCwiZXhwIjoyMDk2NjIzMjI4fQ.FhadzBJSuUJbz-9xGzoSY6zD2lVhU0HXstbZqQhis84';
const sb = createClient(url, key);

(async () => {
  const { data, error } = await sb.from('products').select('data');
  if (error) {
    console.error(error);
  } else {
    data.slice(0, 5).forEach((p, i) => {
      console.log(`Product ${i+1}: ${p.data.title}`);
      console.log(`  image: ${p.data.image}`);
      if (p.data.images) {
        console.log(`  images: ${p.data.images.slice(0,2).join(', ')}`);
      }
    });
  }
})();
