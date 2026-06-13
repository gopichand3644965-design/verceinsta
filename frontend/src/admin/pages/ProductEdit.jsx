import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useProductsContext } from '../../context/ProductsContext';
import useProducts from '../../hooks/useProducts';
import { getProductApi } from '../../api';

export default function ProductEdit() {
  const navigate = useNavigate();
  const { id } = useParams();
  const products = useProducts();
  const existingProduct = id ? products.find((p) => p.id === id) || {} : {};
  const inputRef = useRef(null);

  const [form, setForm] = useState({
    title: existingProduct.title || '',
    productCode: existingProduct.productCode || '',
    link: existingProduct.link || existingProduct.url || '',
    price: existingProduct.price || 0,
    rating: existingProduct.rating || 0,
    stock: existingProduct.stock || 0,
    sizes: existingProduct.sizes?.join(',') || '',
    colors: existingProduct.colors?.join(',') || '',
    images: existingProduct.images || (existingProduct.image_url ? [existingProduct.image_url] : []),
    image_url: existingProduct.image_url || '',
    reviews: existingProduct.reviews || [],
    description: existingProduct.description || '',
    category: existingProduct.category || 'Plain',
    discount: existingProduct.discount || 0,
    isTrending: existingProduct.isTrending || false,
    isNewArrival: existingProduct.isNewArrival || false,
    reviewAuthor: '',
    reviewRating: 5,
    reviewComment: '',
    _newImageURL: '',
  });

  const { saveProduct } = useProductsContext();

  useEffect(() => {
    async function loadProduct() {
      if (!id) return;
      if (existingProduct.id) return;

      try {
        const product = await getProductApi(id);
        setForm({
          title: product.title || '',
          productCode: product.productCode || '',
          link: product.link || product.url || '',
          price: product.price || 0,
          rating: product.rating || 0,
          stock: product.stock || 0,
          sizes: product.sizes?.join(',') || '',
          colors: product.colors?.join(',') || '',
          images: product.images || (product.image_url ? [product.image_url] : []),
          image_url: product.image_url || '',
          reviews: product.reviews || [],
          description: product.description || '',
          category: product.category || 'Plain',
          discount: product.discount || 0,
          isTrending: product.isTrending || false,
          isNewArrival: product.isNewArrival || false,
          _newImageURL: '',
        });
      } catch {
        // fallback to existing local state if API not available
      }
    }

    loadProduct();
  }, [id, existingProduct.id]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const readers = files.map((file) => {
      return new Promise((res) => {
        const r = new FileReader();
        r.onload = (ev) => res(ev.target.result);
        r.readAsDataURL(file);
      });
    });
    Promise.all(readers).then((results) => {
      setForm((s) => ({ ...s, images: [...(s.images || []), ...results] }));
    });
  };

  const handleRemoveImage = (idx) => {
    setForm((s) => ({ ...s, images: s.images.filter((_, i) => i !== idx) }));
  };

  const handleSetMain = (idx) => {
    setForm((s) => {
      const imgs = s.images.slice();
      const [item] = imgs.splice(idx, 1);
      imgs.unshift(item);
      return { ...s, images: imgs };
    });
  };

  const handleAddReview = () => {
    const author = form.reviewAuthor.trim();
    const comment = form.reviewComment.trim();
    if (!author && !comment) {
      alert('Please enter a review author or comment.');
      return;
    }
    const nextReview = {
      id: `R-${Date.now()}`,
      reviewer: author || 'Admin',
      rating: Number(form.reviewRating),
      comment,
    };
    setForm((s) => ({
      ...s,
      reviews: [...(s.reviews || []), nextReview],
      reviewAuthor: '',
      reviewRating: 5,
      reviewComment: '',
    }));
  };

  const handleRemoveReview = (idx) => {
    setForm((s) => ({ ...s, reviews: (s.reviews || []).filter((_, i) => i !== idx) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      title: form.title,
      productCode: form.productCode,
      link: form.link || '',
      price: Number(form.price),
      stock: Number(form.stock),
      sizes: form.sizes ? form.sizes.split(',').map((s) => s.trim()) : [],
      colors: form.colors ? form.colors.split(',').map((c) => c.trim()) : [],
      images: form.images || (form.image_url ? [form.image_url] : []),
      image_url: (form.images && form.images[0]) || form.image_url || '/assets/products/default.jpg',
      reviews: form.reviews || [],
      description: form.description,
      category: form.category,
      discount: Number(form.discount),
      isTrending: form.isTrending,
      isNewArrival: form.isNewArrival,
      rating: Number(form.rating || 0),
    };

    // Always ensure the product has an ID
    if (id) {
      payload.id = id;
    } else {
      payload.id = `P-${Date.now()}`;
    }

    try {
      await saveProduct(payload);
      alert('Product saved successfully!');
      navigate('/admin/products');
    } catch (err) {
      console.error('Failed to save product:', err);
      alert(`Failed to save product: ${err.message || 'Unknown error'}. Please check your connection and try again.`);
    }
  };

  return (
    <div className="w-full max-w-2xl">
      <h2 className="text-xl font-semibold mb-4">{id ? 'Edit product' : 'Add product'}</h2>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-gray-800 p-4 rounded-xl border">
        <label className="block break-words">
          <span className="text-sm">Title</span>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full mt-1 rounded-md border px-3 py-2" />
        </label>
        <label className="block break-words">
          <span className="text-sm">SKU</span>
          <input value={form.productCode} onChange={(e) => setForm({ ...form, productCode: e.target.value })} className="w-full mt-1 rounded-md border px-3 py-2" />
        </label>
        <label className="block break-words">
          <span className="text-sm">Product Link</span>
          <input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} className="w-full mt-1 rounded-md border px-3 py-2" placeholder="https://buy-here.example.com" />
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm">Price</span>
            <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className="w-full mt-1 rounded-md border px-3 py-2" />
          </label>
          <label className="block">
            <span className="text-sm">Stock</span>
            <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} className="w-full mt-1 rounded-md border px-3 py-2" />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm">Rating</span>
            <input type="number" min="0" max="5" step="0.1" value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })} className="w-full mt-1 rounded-md border px-3 py-2" />
          </label>
          <label className="block">
            <span className="text-sm">Discount (%)</span>
            <input type="number" min="0" max="100" value={form.discount} onChange={(e) => setForm({ ...form, discount: Number(e.target.value) })} className="w-full mt-1 rounded-md border px-3 py-2" />
          </label>
        </div>
        <label className="block break-words">
          <span className="text-sm">Sizes (comma separated)</span>
          <input value={form.sizes} onChange={(e) => setForm({ ...form, sizes: e.target.value })} className="w-full mt-1 rounded-md border px-3 py-2" />
        </label>
        <label className="block break-words">
          <span className="text-sm">Colors (comma separated)</span>
          <input value={form.colors} onChange={(e) => setForm({ ...form, colors: e.target.value })} className="w-full mt-1 rounded-md border px-3 py-2" />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm">Category</span>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full mt-1 rounded-md border px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              {['Plain', 'Polo', 'Graphic', 'Striped'].map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </label>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-3 text-sm text-slate-500">
            Use the toggles below to mark this product as trending or a new arrival. Save to update product details.
          </div>
        </div>

        <label className="block break-words">
          <span className="text-sm">Description</span>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="w-full mt-1 rounded-md border px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            placeholder="Enter product description..."
          />
        </label>

        <div className="flex items-center gap-6 py-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isTrending}
              onChange={(e) => setForm({ ...form, isTrending: e.target.checked })}
              className="rounded text-primary focus:ring-primary w-4 h-4"
            />
            <span className="text-sm select-none">Trending Product</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isNewArrival}
              onChange={(e) => setForm({ ...form, isNewArrival: e.target.checked })}
              className="rounded text-primary focus:ring-primary w-4 h-4"
            />
            <span className="text-sm select-none">New Arrival</span>
          </label>
        </div>


        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
          <div className="sm:col-span-2">
            <label className="block">
              <span className="text-sm">Images (main + references)</span>
              <input ref={inputRef} type="file" accept="image/*" multiple onChange={handleFileChange} className="w-full mt-1" />
            </label>
            <p className="text-xs text-gray-500 mt-1">Upload multiple images; drag & drop not supported. First image is used as main.</p>
            <label className="block mt-2">
              <span className="text-sm">Or paste image URL (one at a time)</span>
              <div className="flex gap-2 mt-1">
                <input value={form._newImageURL || ''} onChange={(e) => setForm({ ...form, _newImageURL: e.target.value })} placeholder="https://..." className="w-full rounded-md border px-3 py-2" />
                <button type="button" onClick={() => {
                  if (!form._newImageURL) return;
                  setForm((s) => ({ ...s, images: [...(s.images || []), s._newImageURL], _newImageURL: '' }));
                }} className="px-3 py-2 rounded-md border">Add</button>
              </div>
            </label>
            {form.images && form.images.length > 0 && (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {form.images.map((src, idx) => (
                  <div key={idx} className="relative">
                    <img src={src} alt={`img-${idx}`} className={`w-full h-20 object-cover rounded ${idx === 0 ? 'ring-2 ring-primary' : ''}`} />
                    <div className="flex gap-1 mt-1">
                      <button type="button" onClick={() => handleSetMain(idx)} className="text-xs px-2 py-1 bg-gray-100 rounded">Set main</button>
                      <button type="button" onClick={() => handleRemoveImage(idx)} className="text-xs px-2 py-1 text-red-600 rounded">Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-sm">Main Preview</span>
            <div className="w-28 h-28 bg-gray-100 dark:bg-gray-800 rounded overflow-hidden flex items-center justify-center">
              {form.images && form.images.length > 0 ? (
                <img src={form.images[0]} alt="main preview" className="object-cover w-full h-full" />
              ) : (
                <div className="text-xs text-gray-500">No image</div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-3">Product Reviews</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <label className="block">
              <span className="text-sm">Reviewer</span>
              <input value={form.reviewAuthor} onChange={(e) => setForm({ ...form, reviewAuthor: e.target.value })} className="w-full mt-1 rounded-md border px-3 py-2" placeholder="Admin or customer name" />
            </label>
            <label className="block">
              <span className="text-sm">Rating</span>
              <select value={form.reviewRating} onChange={(e) => setForm({ ...form, reviewRating: e.target.value })} className="w-full mt-1 rounded-md border px-3 py-2">
                {[5, 4, 3, 2, 1].map((rating) => (
                  <option key={rating} value={rating}>{rating} star{rating > 1 ? 's' : ''}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-sm">Comment</span>
              <input value={form.reviewComment} onChange={(e) => setForm({ ...form, reviewComment: e.target.value })} className="w-full mt-1 rounded-md border px-3 py-2" placeholder="Add a product review comment" />
            </label>
          </div>
          <div className="mt-3">
            <button type="button" onClick={handleAddReview} className="bg-primary text-white px-4 py-2 rounded-md">Add review</button>
          </div>

          {form.reviews && form.reviews.length > 0 && (
            <div className="mt-4 space-y-3">
              {form.reviews.map((review, idx) => (
                <div key={review.id || idx} className="p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{review.reviewer}</p>
                      <p className="text-xs text-gray-500">Rating: {review.rating} / 5</p>
                    </div>
                    <button type="button" onClick={() => handleRemoveReview(idx)} className="text-red-600 text-sm">Remove</button>
                  </div>
                  {review.comment && <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">{review.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button className="bg-primary text-white px-4 py-2 rounded-md">Save</button>
          <button type="button" onClick={() => navigate('/admin/products')} className="px-4 py-2 rounded-md border">Cancel</button>
        </div>
      </form>
    </div>
  );
}
