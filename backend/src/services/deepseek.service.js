const axios = require('axios');
const config = require('../config');

async function summarizeSymptoms(symptoms) {
  if (!config.deepseekApiKey) {
    return null;
  }

  const response = await axios.post(
    config.deepseekApiUrl,
    {
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: 'Summarize patient-reported symptoms in one concise clinical sentence for a doctor.' },
        { role: 'user', content: symptoms },
      ],
    },
    { headers: { Authorization: `Bearer ${config.deepseekApiKey}` } },
  );

  return response.data.choices?.[0]?.message?.content ?? null;
}

module.exports = { summarizeSymptoms };
