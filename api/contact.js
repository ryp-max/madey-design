let blobModule;
try { blobModule = require('@vercel/blob'); } catch { blobModule = null; }
const { Resend }   = require('resend');

const resend          = new Resend(process.env.RESEND_API_KEY);
const OWNER_EMAIL     = 'rachelyedampark@gmail.com';
const FROM_EMAIL      = 'onboarding@resend.dev';   // temporary until madey.com is verified in Resend
const ORDERS_BLOB_URL = process.env.ORDERS_BLOB_URL; // set after first deploy (see readme)
const ORDERS_KEY      = 'madey-orders/orders.json';

/* ── helpers ── */

async function loadOrders() {
  if (!blobModule || !process.env.BLOB_READ_WRITE_TOKEN) return [];
  try {
    const blob = await blobModule.get(ORDERS_KEY);
    if (!blob) return [];
    const text = await fetch(blob.url).then(r => r.text());
    return JSON.parse(text);
  } catch {
    return [];
  }
}

async function saveOrders(orders) {
  if (!blobModule || !process.env.BLOB_READ_WRITE_TOKEN) return;
  await blobModule.put(ORDERS_KEY, JSON.stringify(orders, null, 2), {
    access: 'public',
    addRandomSuffix: false,
    contentType: 'application/json',
  });
}

function nextOrderNumber(orders) {
  const year = new Date().getFullYear();
  const yearOrders = orders.filter(o => o.orderNumber.includes(`${year}`));
  const seq = String(yearOrders.length + 1).padStart(4, '0');
  return `MDY-${year}-${seq}`;
}

/* ── email templates ── */

function ownerEmailHtml({ orderNumber, name, email, interest, message, timestamp }) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
  body { font-family: Georgia, serif; background: #f7f3ee; margin: 0; padding: 0; }
  .wrap { max-width: 560px; margin: 40px auto; background: #fdfaf7; border-radius: 8px; overflow: hidden; }
  .header { background: #4a2e14; color: #f7f3ee; padding: 32px 36px; }
  .header h1 { margin: 0; font-size: 22px; font-weight: normal; letter-spacing: 0.04em; }
  .header p { margin: 6px 0 0; font-size: 13px; opacity: 0.65; font-family: Arial, sans-serif; }
  .body { padding: 36px; }
  .order-num { font-size: 28px; font-weight: normal; color: #4a2e14; margin: 0 0 28px; }
  table { width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 14px; }
  td { padding: 10px 0; border-bottom: 1px solid #ede8df; vertical-align: top; }
  td:first-child { color: #7a5c3e; width: 130px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; padding-top: 13px; }
  .message-row td:last-child { white-space: pre-wrap; line-height: 1.6; }
  .footer { padding: 20px 36px; background: #ede8df; font-family: Arial, sans-serif; font-size: 12px; color: #7a5c3e; }
  .reply-btn { display: inline-block; margin-top: 20px; background: #4a2e14; color: #f7f3ee !important; text-decoration: none; padding: 12px 24px; border-radius: 4px; font-family: Arial, sans-serif; font-size: 13px; }
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <h1>madey — new inquiry</h1>
    <p>${new Date(timestamp).toLocaleString('en-US', { timeZone: 'America/Los_Angeles', dateStyle: 'full', timeStyle: 'short' })} PT</p>
  </div>
  <div class="body">
    <h2 class="order-num">${orderNumber}</h2>
    <table>
      <tr><td>Name</td><td>${name}</td></tr>
      <tr><td>Email</td><td><a href="mailto:${email}">${email}</a></td></tr>
      <tr><td>Interested in</td><td>${interest || '—'}</td></tr>
      <tr class="message-row"><td>Message</td><td>${message}</td></tr>
    </table>
    <a href="mailto:${email}?subject=Re: Your Madey Design inquiry ${orderNumber}" class="reply-btn">Reply to ${name} →</a>
  </div>
  <div class="footer">madey.com &nbsp;·&nbsp; Order ID: ${orderNumber}</div>
</div>
</body>
</html>`;
}

function customerEmailHtml({ orderNumber, name, interest }) {
  const interestLabel = {
    'cutting-board':   'Cutting Board',
    'serving-tray':    'Serving Tray',
    'end-grain-board': 'End-Grain Board',
    'shelf':           'Floating Shelf',
    'bowl':            'Turned Bowl',
    'custom':          'Custom Order',
    'other':           'General inquiry',
  }[interest] || interest || 'your inquiry';

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
  body { font-family: Georgia, serif; background: #f7f3ee; margin: 0; padding: 0; }
  .wrap { max-width: 560px; margin: 40px auto; background: #fdfaf7; border-radius: 8px; overflow: hidden; }
  .header { background: #4a2e14; color: #f7f3ee; padding: 32px 36px; }
  .header h1 { margin: 0; font-size: 22px; font-weight: normal; letter-spacing: 0.04em; }
  .body { padding: 36px; line-height: 1.75; font-size: 16px; color: #1e160f; }
  .order-tag { display: inline-block; background: #ede8df; color: #7a5c3e; font-family: Arial, sans-serif; font-size: 12px; letter-spacing: 0.1em; padding: 6px 12px; border-radius: 4px; margin-bottom: 24px; }
  .footer { padding: 20px 36px; background: #ede8df; font-family: Arial, sans-serif; font-size: 12px; color: #7a5c3e; }
  a { color: #4a2e14; }
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <h1>madey design</h1>
  </div>
  <div class="body">
    <div class="order-tag">Inquiry ${orderNumber}</div>
    <p>Hi ${name},</p>
    <p>Thanks for reaching out about <em>${interestLabel}</em> — I received your message and will get back to you within 1–2 days.</p>
    <p>Keep this email as your reference. If you need to follow up, just reply here and include your inquiry number above.</p>
    <p style="margin-top:32px;">Talk soon,<br/><em>Madey Design</em></p>
  </div>
  <div class="footer">
    madey.com &nbsp;·&nbsp; <a href="https://www.instagram.com/madeydesign">@madeydesign</a>
  </div>
</div>
</body>
</html>`;
}

/* ── handler ── */

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, interest, message } = req.body || {};

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const timestamp   = new Date().toISOString();
  const orders      = await loadOrders();
  const orderNumber = nextOrderNumber(orders);

  const order = { orderNumber, name, email, interest, message, timestamp };
  orders.push(order);
  await saveOrders(orders);

  // Fire both emails concurrently
  await Promise.allSettled([
    resend.emails.send({
      from: FROM_EMAIL,
      to:   OWNER_EMAIL,
      subject: `[${orderNumber}] New inquiry from ${name}`,
      html: ownerEmailHtml(order),
    }),
    resend.emails.send({
      from: FROM_EMAIL,
      to:   email,
      replyTo: OWNER_EMAIL,
      subject: `Got your message — Madey Design (${orderNumber})`,
      html: customerEmailHtml(order),
    }),
  ]);

  return res.status(200).json({ ok: true, orderNumber });
};
