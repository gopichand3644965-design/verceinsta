const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/gopic/OneDrive/Desktop/iinstawebs/frontend/src';

function walk(directory) {
  let results = [];
  const list = fs.readdirSync(directory);
  list.forEach(file => {
    file = path.join(directory, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.jsx') || file.endsWith('.js')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(dir);

files.forEach(file => {
  if (file.includes('Banners.jsx')) return; // Skip banners
  
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  content = content.replace(/\bproduct\.image\b/g, 'product.image_url');
  content = content.replace(/\bp\.image\b/g, 'p.image_url');
  content = content.replace(/\bitem\.image\b/g, 'item.image_url');
  content = content.replace(/\bitem\.product\.image\b/g, 'item.product.image_url');
  content = content.replace(/\bexistingProduct\.image\b/g, 'existingProduct.image_url');
  content = content.replace(/\bform\.image\b/g, 'form.image_url');
  content = content.replace(/\.image\b/g, (match, offset, str) => {
    // We already replaced the specific ones. 
    // Are there any other `.image` we missed?
    // In Cart.jsx: image: item.product.image_url -> handled
    return match;
  });

  // Handle specific destructured object keys or exact string matches
  content = content.replace(/image:\s*item\.product\.image_url/g, 'image_url: item.product.image_url');
  content = content.replace(/image:\s*product\.image_url/g, 'image_url: product.image_url');
  content = content.replace(/image:\s*\(form\.images/g, 'image_url: (form.images');
  content = content.replace(/image:\s*existingProduct\.image_url/g, 'image_url: existingProduct.image_url');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated', file);
  }
});
