module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, interest, message } = req.body || {};

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // If you add an email provider (Resend, SendGrid, etc.), wire it in here.
  // For now, log and return success so the form works on deploy.
  console.log('[contact]', { name, email, interest, message });

  return res.status(200).json({ ok: true });
};
