require('dotenv').config();
const { bootstrapSecrets } = require('./src/config/bootstrapSecrets');

(async () => {
  await bootstrapSecrets();

  const app = require('./src/app');
  const config = require('./src/config');

  app.listen(config.port, () => {
    console.log(`Campus Health API listening on port ${config.port}`);
  });
})();
