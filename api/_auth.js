const crypto = require('crypto');

const COOKIE_NAME = 'madey_admin';
const SESSION_MS = 1000 * 60 * 60 * 12; // 12 hours

function sign(payload) {
  return crypto.createHmac('sha256', process.env.ADMIN_SECRET).update(payload).digest('hex');
}

function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function issueSessionCookie() {
  const expires = Date.now() + SESSION_MS;
  const payload = String(expires);
  const token = Buffer.from(`${payload}.${sign(payload)}`).toString('base64');
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_MS / 1000}`;
}

function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

function isAuthorized(req) {
  if (!process.env.ADMIN_SECRET) return false;
  const cookieHeader = req.headers.cookie || '';
  const match = cookieHeader.split(';').map(c => c.trim()).find(c => c.startsWith(`${COOKIE_NAME}=`));
  if (!match) return false;
  try {
    const token = Buffer.from(match.slice(COOKIE_NAME.length + 1), 'base64').toString('utf8');
    const dot = token.lastIndexOf('.');
    if (dot === -1) return false;
    const payload = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    if (!safeEqual(sign(payload), sig)) return false;
    return Number(payload) > Date.now();
  } catch {
    return false;
  }
}

module.exports = { COOKIE_NAME, issueSessionCookie, clearSessionCookie, isAuthorized, safeEqual };
