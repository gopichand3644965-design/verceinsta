const fetch = require('node-fetch');

async function testPost() {
  try {
    const res = await fetch('http://localhost:4000/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: "Test Product",
        price: 99.99,
        id: "TEST-PROD-" + Date.now(),
        image_url: "https://via.placeholder.com/150",
        images: ["https://via.placeholder.com/150"]
      })
    });
    
    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Body:', text);
  } catch (err) {
    console.error('Fetch error:', err);
  }
}
testPost();
