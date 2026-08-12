const { blobModule, blobUrl } = require('./_blob');

// Each product is its own blob (madey-products/items/<id>.json) rather than one
// shared JSON file. A shared file requires read-modify-write on every change,
// and two writes close together can race: the second write can read a copy of
// the file from before the first write finished and silently overwrite it,
// undoing the first change. One blob per product means add/edit/delete never
// depend on the current state of anything else, so that race can't happen.
const ITEMS_PREFIX = 'madey-products/items/';

const DEFAULT_PRODUCTS = [
  { id: 'bowl', name: 'Maple & Walnut Statement Bowl', category: 'Turned Wood', image: '/images/product-bowl.jpg', description: 'Hand-turned from solid maple and walnut. The wavy inlay is carved, not glued. Each one is unrepeatable. Food-safe oil finish. Approximately 10–12" diameter.', wb: false, sold: true, order: 0 },
  { id: 'bubble-bowl', name: 'Bubble Bowl', category: 'Turned Wood', image: '/images/product-bubble-bowl.jpg', description: 'A sculptural bowl with a rounded, organic form. Turned from walnut and maple, finished with food-safe oil. The shape is meant to sit naturally in the hand.', wb: true, sold: true, order: 1 },
  { id: 'bubble-stack', name: 'Bubble Bowl — Stacked', category: 'Turned Wood', image: '/images/product-bubble-stack.jpg', description: 'Three bubble bowls stacked into a single sculptural object. Each bowl is individually turned, then nested together. Works as a display piece or separated for use.', wb: true, sold: true, order: 2 },
  { id: 'paddle-board', name: 'Paddle Board', category: 'Functional Wood', image: '/images/product-paddle-board.jpg', description: 'A walnut and maple serving board with a paddle handle. Hand-shaped and finished with food-safe oil. Makes a beautiful everyday object.', wb: true, sold: true, order: 3 },
  { id: 'wave-board', name: 'Wave Board', category: 'Functional Wood', image: '/images/product-wave-board.jpg', description: 'A large serving board with a flowing wave inlay in contrasting walnut and maple. The inlay is carved by hand. No two are identical. Food-safe finish.', wb: true, sold: true, order: 4 },
  { id: 'side-table', name: 'Stacked Side Table', category: 'Furniture', image: '/images/product-totem.jpg', description: 'Turned from multiple wood species, each layer shaped separately, then stacked and balanced. Functions as a side table or display pedestal.', wb: false, sold: true, order: 5 },
  { id: 'candle-holders', name: 'Candle Holders', category: 'Turned Wood', image: '/images/product-bud-vase.jpg', description: 'A set of turned candle holders in varying heights. Each one is shaped individually on the lathe from walnut and maple scraps.', wb: false, sold: true, order: 6 },
  { id: 'bud-vases', name: 'Bud Vases', category: 'Turned Wood', image: '/images/bud-vases-collection.jpg', description: 'A collection of small bud vases, each turned from scrap wood. No two share the same proportions. Meant to be grouped together or displayed alone.', wb: false, sold: true, order: 7 },
  { id: 'checkered-plate', name: 'Checkered Plate', category: 'Turned Wood', image: '/images/checkered-plate.jpg', description: 'A wide, low torus form turned from alternating walnut and maple segments. The checkerboard pattern comes from the segmented construction, each piece cut, glued, and turned as one. Food-safe oil finish.', wb: false, sold: true, order: 8 },
];

function itemKey(id) {
  return `${ITEMS_PREFIX}${id}.json`;
}

async function loadProducts() {
  if (!blobModule || !process.env.BLOB_READ_WRITE_TOKEN) return DEFAULT_PRODUCTS;
  try {
    const { blobs } = await blobModule.list({ prefix: ITEMS_PREFIX });
    if (!blobs.length) {
      await Promise.all(DEFAULT_PRODUCTS.map(saveProduct));
      return DEFAULT_PRODUCTS;
    }
    const items = await Promise.all(
      blobs.map(b => fetch(b.url).then(r => r.json()).catch(() => null))
    );
    return items
      .filter(Boolean)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  } catch {
    return DEFAULT_PRODUCTS;
  }
}

async function saveProduct(product) {
  if (!blobModule || !process.env.BLOB_READ_WRITE_TOKEN) return;
  await blobModule.put(itemKey(product.id), JSON.stringify(product, null, 2), {
    access: 'public',
    addRandomSuffix: false,
    contentType: 'application/json',
    cacheControlMaxAge: 0,
  });
}

async function deleteProductBlob(id) {
  if (!blobModule || !process.env.BLOB_READ_WRITE_TOKEN) return;
  const url = blobUrl(itemKey(id));
  if (url) await blobModule.del(url).catch(() => {});
}

async function getProduct(id) {
  if (!blobModule || !process.env.BLOB_READ_WRITE_TOKEN) {
    return DEFAULT_PRODUCTS.find(p => p.id === id) || null;
  }
  const url = blobUrl(itemKey(id));
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

module.exports = { loadProducts, saveProduct, deleteProductBlob, getProduct, DEFAULT_PRODUCTS };
