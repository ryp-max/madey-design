let blobModule;
try { blobModule = require('@vercel/blob'); } catch { blobModule = null; }

// Public store URLs are deterministic for a fixed pathname (addRandomSuffix: false),
// so we construct the URL directly from the store id rather than calling list(),
// whose index lags behind writes (unlike direct object reads/writes by pathname).
function storeHost() {
  const token = process.env.BLOB_READ_WRITE_TOKEN || '';
  const match = /^vercel_blob_rw_([a-zA-Z0-9]+)_/.exec(token);
  return match ? `${match[1].toLowerCase()}.public.blob.vercel-storage.com` : null;
}

function blobUrl(pathname) {
  const host = storeHost();
  return host ? `https://${host}/${pathname}` : null;
}

async function findBlobUrl(pathname) {
  if (!blobModule) return null;
  const url = blobUrl(pathname);
  if (url) {
    const head = await fetch(url, { method: 'HEAD' }).catch(() => null);
    return head && head.status === 404 ? null : url;
  }
  // Fallback for older token formats: list-based lookup (eventually consistent).
  const { blobs } = await blobModule.list({ prefix: pathname });
  const match = blobs.find(b => b.pathname === pathname);
  return match ? match.url : null;
}

module.exports = { blobModule, findBlobUrl, blobUrl };
