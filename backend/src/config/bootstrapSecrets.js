const { fetchSecrets } = require('../services/keyVault.service');

// Only production fetches from Key Vault; local/dev reads from .env via dotenv.
async function bootstrapSecrets() {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  const secrets = await fetchSecrets([
    'DATABASE-URL',
    'JWT-SECRET',
    'DEEPSEEK-API-KEY',
    'PEER-API-KEY-OUTBOUND',
  ]);

  if (secrets['DATABASE-URL']) process.env.DATABASE_URL = secrets['DATABASE-URL'];
  if (secrets['JWT-SECRET']) process.env.JWT_SECRET = secrets['JWT-SECRET'];
  if (secrets['DEEPSEEK-API-KEY']) process.env.DEEPSEEK_API_KEY = secrets['DEEPSEEK-API-KEY'];
  if (secrets['PEER-API-KEY-OUTBOUND']) process.env.PEER_API_KEY_OUTBOUND = secrets['PEER-API-KEY-OUTBOUND'];
}

module.exports = { bootstrapSecrets };
