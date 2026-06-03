import { useEffect, useState, useRef } from 'react';
import { getBannersApi, createBannerApi, updateBannerApi, deleteBannerApi, uploadBannerImageApi, reorderBannersApi } from '../../api';
import { FiPlus, FiTrash2, FiUpload, FiEdit } from 'react-icons/fi';

export default function Banners() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [file, setFile] = useState(null);
  const [editing, setEditing] = useState(null);
  const inputRef = useRef();

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await getBannersApi();
      setBanners(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = reject;
      fr.readAsDataURL(file);
    });
  }

  async function handleUploadAndCreate() {
    if (!title.trim()) return alert('Please enter a title');
    if (!file) return alert('Please select an image file');
    setLoading(true);
    try {
      const dataUrl = await readFileAsDataURL(file);
      const filename = `${Date.now()}-${file.name}`;
      const uploadRes = await uploadBannerImageApi(filename, dataUrl);
      const payload = { title: title.trim(), subtitle: subtitle.trim(), image: uploadRes.path };
      await createBannerApi(payload);
      setTitle(''); setSubtitle(''); setFile(null); if (inputRef.current) inputRef.current.value = '';
      await load();
    } catch (err) {
      console.error(err);
      alert('Failed to upload banner');
    } finally { setLoading(false); }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this banner?')) return;
    setLoading(true);
    try {
      await deleteBannerApi(id);
      await load();
    } catch (err) { console.error(err); alert('Failed to delete'); }
    finally { setLoading(false); }
  }

  async function handleEdit(b) {
    setEditing(b);
    setTitle(b.title || '');
    setSubtitle(b.subtitle || '');
  }

  async function handleSaveEdit() {
    if (!editing) return;
    setLoading(true);
    try {
      let imagePath = editing.image;
      if (file) {
        const dataUrl = await readFileAsDataURL(file);
        const filename = `${Date.now()}-${file.name}`;
        const uploadRes = await uploadBannerImageApi(filename, dataUrl);
        imagePath = uploadRes.path;
      }
      await updateBannerApi(editing.id, { title: title.trim(), subtitle: subtitle.trim(), image: imagePath });
      setEditing(null); setTitle(''); setSubtitle(''); setFile(null); if (inputRef.current) inputRef.current.value = '';
      await load();
    } catch (err) { console.error(err); alert('Failed to update'); }
    finally { setLoading(false); }
  }

  // Drag and drop ordering
  const dragIndexRef = useRef(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  function handleDragStart(e, index) {
    dragIndexRef.current = index;
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(e, index) {
    e.preventDefault();
    setDragOverIndex(index);
    e.dataTransfer.dropEffect = 'move';
  }

  async function handleDrop(e, index) {
    e.preventDefault();
    const from = dragIndexRef.current;
    const to = index;
    if (from == null || to == null || from === to) {
      setDragOverIndex(null);
      dragIndexRef.current = null;
      return;
    }
    const next = [...banners];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setBanners(next);
    setDragOverIndex(null);
    dragIndexRef.current = null;
    // send reorder to server (array of ids)
    try {
      await reorderBannersApi(next.map((b) => b.id));
    } catch (err) {
      console.error('Failed to reorder', err);
      // reload to sync
      await load();
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Banners & Homepage</h2>
        <div className="text-sm text-gray-500">Manage hero banners shown on home page</div>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <div className="md:col-span-2">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border">
            <h3 className="font-semibold mb-2">Existing Banners</h3>
            {loading && <div className="text-sm text-gray-500">Loading...</div>}
            {!loading && banners.length === 0 && <div className="text-sm text-gray-500">No banners yet.</div>}
            <div className="space-y-3 mt-3">
              {banners.map((b, idx) => (
                <div key={b.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, idx)}
                  onDragOver={(e) => handleDragOver(e, idx)}
                  onDrop={(e) => handleDrop(e, idx)}
                  className={`flex items-center gap-3 p-3 rounded-lg border ${dragOverIndex === idx ? 'bg-gray-50 dark:bg-gray-700' : ''}`}
                >
                  <div className="w-32 h-16 bg-gray-100 overflow-hidden rounded">
                    <img src={b.image} alt={b.title} className="w-full h-full object-cover object-center" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{b.title}</div>
                    <div className="text-sm text-gray-500 line-clamp-2">{b.subtitle}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button title="Edit" onClick={() => handleEdit(b)} className="p-2 rounded hover:bg-gray-100">
                      <FiEdit />
                    </button>
                    <button title="Delete" onClick={() => handleDelete(b.id)} className="p-2 rounded hover:bg-red-50 text-red-600">
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border">
            <h3 className="font-semibold mb-2">{editing ? 'Edit Banner' : 'Add New Banner'}</h3>
            <div className="space-y-2">
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="w-full p-2 rounded border bg-transparent" />
              <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="Subtitle" className="w-full p-2 rounded border bg-transparent" />
              <input ref={inputRef} onChange={(e) => setFile(e.target.files?.[0] || null)} type="file" accept="image/*" className="w-full" />
              <div className="flex gap-2 mt-2">
                {editing ? (
                  <>
                    <button onClick={handleSaveEdit} className="px-3 py-1.5 bg-blue-600 text-white rounded flex items-center gap-2"><FiUpload /> Save</button>
                    <button onClick={() => { setEditing(null); setTitle(''); setSubtitle(''); setFile(null); if (inputRef.current) inputRef.current.value = '' }} className="px-3 py-1.5 border rounded">Cancel</button>
                  </>
                ) : (
                  <button onClick={handleUploadAndCreate} className="px-3 py-1.5 bg-green-600 text-white rounded flex items-center gap-2"><FiPlus /> Add Banner</button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
