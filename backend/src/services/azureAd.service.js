// MVP stub: real version validates the MSAL/OIDC id_token against the University
// tenant's JWKS instead of trusting the token's claims unverified.
async function validateAdToken(adToken) {
  if (!adToken) {
    throw Object.assign(new Error('Missing Azure AD token'), { status: 401 });
  }

  const payload = JSON.parse(Buffer.from(adToken.split('.')[1] || '', 'base64').toString('utf8') || '{}');

  if (!payload.email && !payload.preferred_username) {
    throw Object.assign(new Error('Azure AD token missing email claim'), { status: 401 });
  }

  return {
    adId: payload.oid || payload.sub,
    email: payload.email || payload.preferred_username,
    name: payload.name || payload.email,
  };
}

module.exports = { validateAdToken };
