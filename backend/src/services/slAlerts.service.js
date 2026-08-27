const axios = require('axios');
const config = require('../config');

async function getActiveAlerts() {
  if (!config.peerApiBaseUrl) {
    return [];
  }

  const response = await axios.get(`${config.peerApiBaseUrl}/api/alerts`, {
    headers: { 'x-api-key': config.peerApiKeyOutbound },
  });

  return response.data;
}

module.exports = { getActiveAlerts };
