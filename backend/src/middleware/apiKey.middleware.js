const config = require('../config');

function requireApiKey(req, res, next) {
  const key = req.headers['x-api-key'];
  if (!key || !config.peerApiKeysInbound.includes(key)) {
    return res.status(401).json({ error: 'Invalid or missing API key' });
  }
  next();
}

module.exports = { requireApiKey };
