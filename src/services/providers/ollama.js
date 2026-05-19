// ========================================
// Ollama Provider — Local OpenAI-compatible API
// ========================================
import { openaiCompatGenerate } from './openai-compat';
import { PROVIDER_CONFIG } from './models';

const config = PROVIDER_CONFIG.ollama;

function getBaseUrl(providerSettings = {}) {
  const base = providerSettings.baseUrl || config.defaultBaseUrl;
  return `${base}/v1/chat/completions`;
}

export async function ollamaGenerate(systemPrompt, userPrompt, onChunk, options = {}) {
  const { model, baseUrl, ...rest } = options;
  if (!model) throw new Error('Please select an Ollama model in Settings.');

  return openaiCompatGenerate(
    baseUrl ? `${baseUrl}/v1/chat/completions` : getBaseUrl(),
    null,
    systemPrompt,
    userPrompt,
    onChunk,
    { model, ...rest }
  );
}

export async function checkOllamaStatus(providerSettings = {}) {
  const baseUrl = providerSettings.baseUrl || config.defaultBaseUrl;
  const model = providerSettings.model;

  try {
    const res = await fetch(`${baseUrl}/api/tags`);
    if (!res.ok) return { running: false, error: 'Ollama is not running' };

    const data = await res.json();
    const models = (data.models || []).map(m => ({
      id: m.name,
      name: m.name,
    }));

    if (models.length === 0) {
      return { running: true, error: 'No models installed. Run: ollama pull llama3.2', models };
    }

    if (model && !models.find(m => m.id === model)) {
      return { running: true, error: `Model "${model}" not found locally`, models };
    }

    return { running: true, model: model || models[0]?.id, models };
  } catch {
    return { running: false, error: 'Cannot connect to Ollama. Make sure it is running on ' + baseUrl };
  }
}

export async function fetchOllamaModels(baseUrl) {
  const url = baseUrl || config.defaultBaseUrl;
  try {
    const res = await fetch(`${url}/api/tags`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.models || []).map(m => ({ id: m.name, name: m.name }));
  } catch {
    return [];
  }
}
