module.exports = {
  port: process.env.PORT || 4000,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  // Only university accounts may sign in. Pinning the Azure authority to our
  // tenant already blocks other organisations, but a tenant can also contain
  // invited guest accounts on outside domains — this shuts that door too.
  allowedEmailDomains: (process.env.ALLOWED_EMAIL_DOMAINS || 'au.edu')
    .split(',')
    .map((d) => d.trim().toLowerCase())
    .filter(Boolean),
  peerApiBaseUrl: process.env.PEER_API_BASE_URL,
  peerApiKeyOutbound: process.env.PEER_API_KEY_OUTBOUND,
  deepseekApiKey: process.env.DEEPSEEK_API_KEY,
  deepseekApiUrl: process.env.DEEPSEEK_API_URL,
};
