const { issueSessionCookie, safeEqual } = require('./_auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { password } = req.body || {};
  if (!password || !process.env.ADMIN_SECRET || !safeEqual(password, process.env.ADMIN_SECRET)) {
    return res.status(401).json({ error: 'Incorrect password' });
  }

  res.setHeader('Set-Cookie', issueSessionCookie());
  return res.status(200).json({ ok: true });
};
