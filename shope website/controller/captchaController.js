// controllers/captchaController.js
const crypto = require('crypto');

function generateCaptcha(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

exports.newCaptcha = (req, res) => {
  const code = generateCaptcha(6);
  const hash = crypto.createHash('sha256').update(code).digest('hex');
  req.session.captchaHash = hash;
  req.session.captchaCreatedAt = Date.now();
  // optionally return the code as plain text (for dev) or render as image in production
  res.json({ code }); // client displays this string (or image). in prod generate image on server.
};

exports.verifyCaptcha = (req, res) => {
  const input = req.body.captcha;
  if (!input) return res.status(400).json({ ok: false, error: 'No captcha provided' });

  const now = Date.now();
  const created = req.session.captchaCreatedAt || 0;
  if (now - created > (3 * 60 * 1000)) { // expire 3 minutes
    delete req.session.captchaHash;
    return res.status(400).json({ ok: false, error: 'Captcha expired' });
  }

  const hash = crypto.createHash('sha256').update(String(input)).digest('hex');
  if (hash === req.session.captchaHash) {
    // success - clear it
    delete req.session.captchaHash;
    delete req.session.captchaCreatedAt;
    return res.json({ ok: true });
  } else {
    return res.status(400).json({ ok: false, error: 'Invalid captcha' });
  }
};
