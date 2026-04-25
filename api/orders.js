// Admin-only endpoint to view all orders
// Visit: /api/orders?secret=YOUR_ADMIN_SECRET
const { get } = require('@vercel/blob');

const ORDERS_KEY = 'madey-orders/orders.json';

module.exports = async (req, res) => {
  if (req.query.secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const blob = await get(ORDERS_KEY);
    if (!blob) return res.status(200).json([]);
    const text = await fetch(blob.url).then(r => r.text());
    const orders = JSON.parse(text);
    // Return newest first
    return res.status(200).json(orders.reverse());
  } catch {
    return res.status(200).json([]);
  }
};
