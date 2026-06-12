require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpload() {
  const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
  const safeName = `test-${Date.now()}.png`;
  const { data, error } = await supabase.storage.from('products').upload(safeName, buffer, {
    contentType: 'image/png',
    upsert: false,
  });
  if (error) {
    console.error('Upload Error:', error);
  } else {
    console.log('Upload Success:', data);
  }

  const { data: dbData, error: dbError } = await supabase.from('products').insert([{ id: `test-${Date.now()}`, data: {} }]);
  if (dbError) {
    console.error('DB Insert Error:', dbError);
  } else {
    console.log('DB Insert Success', dbData);
  }
}
testUpload();
