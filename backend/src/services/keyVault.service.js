const { SecretClient } = require('@azure/keyvault-secrets');
const { DefaultAzureCredential } = require('@azure/identity');

async function fetchSecrets(secretNames) {
  const vaultUrl = process.env.AZURE_KEY_VAULT_URL;
  if (!vaultUrl) {
    console.warn('AZURE_KEY_VAULT_URL not set; skipping Key Vault fetch.');
    return {};
  }

  const client = new SecretClient(vaultUrl, new DefaultAzureCredential());
  const secrets = {};

  await Promise.all(
    secretNames.map(async (name) => {
      try {
        const secret = await client.getSecret(name);
        secrets[name] = secret.value;
      } catch (err) {
        console.error(`Failed to fetch secret "${name}" from Key Vault:`, err.message);
      }
    }),
  );

  return secrets;
}

module.exports = { fetchSecrets };
