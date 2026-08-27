module.exports = {
  port: process.env.PORT || 4000,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  peerApiBaseUrl: process.env.PEER_API_BASE_URL,
  peerApiKeyOutbound: process.env.PEER_API_KEY_OUTBOUND,
  peerApiKeysInbound: (process.env.PEER_API_KEYS_INBOUND || '')
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean),
  deepseekApiKey: process.env.DEEPSEEK_API_KEY,
  deepseekApiUrl: process.env.DEEPSEEK_API_URL,
};
