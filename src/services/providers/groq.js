// ========================================
// Groq Provider — OpenAI-compatible API
// ========================================
import { openaiCompatGenerate } from './openai-compat';
import { PROVIDER_CONFIG, getDefaultModel } from './models';

const config = PROVIDER_CONFIG.groq;

export async function groqGenerate(systemPrompt, userPrompt, onChunk, options = {}) {
  const { apiKey, model, ...rest } = options;
  if (!apiKey) throw new Error('Please set your Groq API key in Settings.');

  return openaiCompatGenerate(
    config.baseUrl,
    apiKey,
    systemPrompt,
    userPrompt,
    onChunk,
    { model: model || getDefaultModel('groq'), ...rest }
  );
}

export async function checkGroqStatus(providerSettings = {}) {
  const { apiKey, model } = providerSettings;
  if (!apiKey) return { running: false, error: 'No API key configured' };

  try {
    const res = await fetch(config.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: model || getDefaultModel('groq'),
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 5,
      }),
    });
    if (res.ok) return { running: true, model: model || getDefaultModel('groq') };
    const err = await res.json();
    return { running: false, error: err.error?.message || 'Invalid API key' };
  } catch {
    return { running: false, error: 'Network error or CORS issue' };
  }
}
