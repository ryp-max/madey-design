const { isAuthorized } = require('./_auth');
const { loadProducts, saveProduct, deleteProductBlob, getProduct } = require('./_products-store');
const { blobModule } = require('./_blob');

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

function slugify(name) {
  return String(name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function uploadImage(dataUrl, idHint) {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(String(dataUrl || '').trim());
  if (!match) throw new Error('Invalid image data');
  const contentType = match[1];
  const ext = contentType.split('/')[1].replace('jpeg', 'jpg');
  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.length > MAX_IMAGE_BYTES) throw new Error('Image too large (max 4MB)');
  if (!blobModule) throw new Error('Image storage is not configured');
  const pathname = `madey-products/images/${idHint}-${Date.now()}.${ext}`;
  const blob = await blobModule.put(pathname, buffer, {
    access: 'public',
    addRandomSuffix: false,
    contentType,
  });
  return blob.url;
}

async function deleteImageIfBlob(imageUrl) {
  if (!blobModule || !imageUrl || !imageUrl.includes('.public.blob.vercel-storage.com/')) return;
  await blobModule.del(imageUrl).catch(() => {});
}

module.exports = async (req, res) => {
  if (!isAuthorized(req)) return res.status(401).json({ error: 'Unauthorized' });

  if (req.method === 'GET') {
    return res.status(200).json(await loadProducts());
  }

  if (req.method === 'POST') {
    const { name, category, description, image, imageData, sold, wb } = req.body || {};
    if (!name || !description) {
      return res.status(400).json({ error: 'Name and description are required' });
    }

    const base = slugify(name);
    if (!base) return res.status(400).json({ error: 'Invalid name' });

    const existing = await loadProducts();
    let id = base;
    let n = 2;
    while (existing.some(p => p.id === id)) {
      id = `${base}-${n++}`;
    }

    let imageUrl = image || '';
    if (imageData) {
      try {
        imageUrl = await uploadImage(imageData, id);
      } catch (e) {
        return res.status(400).json({ error: e.message });
      }
    }
    if (!imageUrl) return res.status(400).json({ error: 'A photo is required' });

    const maxOrder = existing.reduce((m, p) => Math.max(m, p.order ?? 0), -1);
    const product = {
      id,
      name,
      category: category || 'Turned Wood',
      image: imageUrl,
      description,
      wb: !!wb,
      sold: sold !== false,
      order: maxOrder + 1,
    };
    await saveProduct(product);
    return res.status(201).json(product);
  }

  if (req.method === 'PUT') {
    const { id, name, category, description, image, imageData, sold, wb } = req.body || {};
    if (!id) return res.status(400).json({ error: 'Missing id' });
    const existing = await getProduct(id);
    if (!existing) return res.status(404).json({ error: 'Product not found' });

    let imageUrl = image !== undefined ? image : existing.image;
    if (imageData) {
      try {
        imageUrl = await uploadImage(imageData, id);
      } catch (e) {
        return res.status(400).json({ error: e.message });
      }
      if (existing.image !== imageUrl) await deleteImageIfBlob(existing.image);
    }

    const updated = {
      ...existing,
      name: name || existing.name,
      category: category || existing.category,
      description: description || existing.description,
      image: imageUrl,
      wb: wb !== undefined ? !!wb : existing.wb,
      sold: sold !== undefined ? !!sold : existing.sold,
    };
    await saveProduct(updated);
    return res.status(200).json(updated);
  }

  if (req.method === 'DELETE') {
    const id = req.query.id;
    if (!id) return res.status(400).json({ error: 'Missing id' });
    const existing = await getProduct(id);
    if (!existing) return res.status(404).json({ error: 'Product not found' });
    await deleteProductBlob(id);
    await deleteImageIfBlob(existing.image);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
