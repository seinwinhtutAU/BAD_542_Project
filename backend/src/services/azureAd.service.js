const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');
const config = require('../config');

const tenantId = process.env.AZURE_AD_TENANT_ID;
const clientId = process.env.AZURE_AD_CLIENT_ID;

const client = jwksClient({
  jwksUri: `https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`,
});

function getSigningKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    callback(null, key.getPublicKey());
  });
}

async function validateAdToken(adToken) {
  if (!adToken) {
    throw Object.assign(new Error('Missing Azure AD token'), { status: 401 });
  }

  let payload;
  try {
    payload = await new Promise((resolve, reject) => {
      jwt.verify(
        adToken,
        getSigningKey,
        {
          audience: clientId,
          issuer: `https://login.microsoftonline.com/${tenantId}/v2.0`,
        },
        (err, decoded) => (err ? reject(err) : resolve(decoded)),
      );
    });
  } catch (err) {
    throw Object.assign(new Error(`Invalid Azure AD token: ${err.message}`), { status: 401 });
  }

  if (!payload.email && !payload.preferred_username) {
    throw Object.assign(new Error('Azure AD token missing email claim'), { status: 401 });
  }

  const email = (payload.email || payload.preferred_username).toLowerCase();
  const domain = email.split('@').pop();

  if (!config.allowedEmailDomains.includes(domain)) {
    throw Object.assign(
      new Error(`Only university accounts may sign in. ${email} is not on an allowed domain.`),
      { status: 403 },
    );
  }

  return {
    adId: payload.oid || payload.sub,
    email,
    name: payload.name || email,
  };
}

module.exports = { validateAdToken };
