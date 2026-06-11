const https = require('https');

const url = 'https://rnjmgwnaciklrkowxnuo.supabase.co/storage/v1/object/public/products/TEST-PROD-1781184220323-main-1781184221084-tlwch.png';

console.log('Testing public URL accessibility...');
console.log('URL:', url);

https.get(url, (res) => {
  console.log('\nHTTP Status:', res.statusCode);
  console.log('Content-Type:', res.headers['content-type']);
  console.log('Content-Length:', res.headers['content-length']);
  
  if (res.statusCode === 200) {
    console.log('\n✓ SUCCESS: Public URL returns HTTP 200');
    console.log('✓ File is publicly accessible');
  } else {
    console.log('\n⚠ WARNING: Unexpected status code');
  }
}).on('error', (e) => {
  console.error('\nERROR:', e.message);
});
