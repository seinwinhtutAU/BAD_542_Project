const OpenAI = require('openai');
const config = require('../config');

const MAX_SYMPTOMS_LENGTH = 4000;

function getClient() {
  if (!config.deepseekApiKey) {
    throw Object.assign(new Error('DeepSeek API key is not configured'), { code: 'DEEPSEEK_NOT_CONFIGURED' });
  }

  return new OpenAI({
    apiKey: config.deepseekApiKey,
    baseURL: config.deepseekApiBaseUrl,
    timeout: 15000,
    maxRetries: 1,
  });
}

function validateSymptoms(symptoms) {
  if (typeof symptoms !== 'string' || !symptoms.trim()) {
    throw Object.assign(new Error('Symptoms must be a non-empty text value'), { status: 400 });
  }
  if (symptoms.length > MAX_SYMPTOMS_LENGTH) {
    throw Object.assign(new Error(`Symptoms must be ${MAX_SYMPTOMS_LENGTH} characters or fewer`), { status: 400 });
  }
  return symptoms.trim();
}

function validateAnalysis(analysis) {
  const fields = ['summary', 'urgency', 'suggestedSpecialty', 'safetyNote'];
  if (!analysis || typeof analysis !== 'object' || fields.some((field) => typeof analysis[field] !== 'string')) {
    throw new Error('DeepSeek returned an invalid analysis shape');
  }
  return fields.reduce((result, field) => ({ ...result, [field]: analysis[field].trim() }), {});
}

async function summarizeSymptoms(symptoms) {
  const input = validateSymptoms(symptoms);
  let response;

  try {
    response = await getClient().chat.completions.create({
      model: 'deepseek-chat',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: [
            'You support a university clinic doctor by organizing patient-reported symptoms.',
            'Do not diagnose, prescribe, or invent facts. Return only valid JSON with exactly these string fields:',
            'summary, urgency, suggestedSpecialty, safetyNote.',
            'urgency must be one of: routine, soon, urgent, emergency.',
            'For emergency symptoms, safetyNote must advise contacting local emergency services immediately.',
          ].join(' '),
        },
        { role: 'user', content: input },
      ],
    });

    const content = response.choices?.[0]?.message?.content;
    return validateAnalysis(JSON.parse(content || '{}'));
  } catch (err) {
    console.error('DeepSeek symptom analysis failed:', {
      code: err.code,
      status: err.status,
      message: err.message,
    });

    throw Object.assign(
      new Error('DeepSeek symptom analysis is temporarily unavailable. Please try again.'),
      { status: 503, code: 'DEEPSEEK_UNAVAILABLE' },
    );
  }
}

module.exports = { summarizeSymptoms };
