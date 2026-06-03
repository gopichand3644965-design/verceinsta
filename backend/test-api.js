const http = require('http');

const send = (opts, data) => new Promise((resolve, reject) => {
  const req = http.request(opts, (res) => {
    const chunks = [];
    res.on('data', (chunk) => chunks.push(chunk));
    res.on('end', () => {
      const body = Buffer.concat(chunks).toString();
      resolve({ status: res.statusCode, body, headers: res.headers });
    });
  });
  req.on('error', reject);
  if (data) req.write(data);
  req.end();
});

(async () => {
  try {
    console.log('POST /api/products');
    const newProduct = {
      title: 'Test Fallback Product',
      description: 'Automatically created for API test',
      price: 9.99,
      image: '/test.jpg',
      category: 'test',
      variants: [],
      inventory: 5,
    };

    const post = await send(
      {
        hostname: 'localhost',
        port: 4000,
        path: '/api/products',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      JSON.stringify(newProduct)
    );

    console.log(post.status, post.body);
    const created = JSON.parse(post.body || '{}');
    const id = created.id || (created.data && created.data.id) || null;
    if (!id) {
      console.error('No id returned');
      return;
    }
    console.log('created id', id);

    console.log('GET /api/products/' + id);
    const get = await send({ hostname: 'localhost', port: 4000, path: '/api/products/' + id, method: 'GET' });
    console.log(get.status, get.body);

    console.log('PUT /api/products/' + id);
    const put = await send(
      {
        hostname: 'localhost',
        port: 4000,
        path: '/api/products/' + id,
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      },
      JSON.stringify({ price: 15.99 })
    );
    console.log(put.status, put.body);

    console.log('DELETE /api/products/' + id);
    const del = await send({ hostname: 'localhost', port: 4000, path: '/api/products/' + id, method: 'DELETE' });
    console.log(del.status, del.body);
  } catch (err) {
    console.error(err);
  }
})();
