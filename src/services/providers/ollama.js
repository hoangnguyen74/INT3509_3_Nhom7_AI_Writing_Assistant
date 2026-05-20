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
    if (!res.ok) {
      if (res.status === 403) {
        return { running: false, error: `CORS blocked (403). Run Ollama with: OLLAMA_ORIGINS=${window.location.origin} ollama serve` };
      }
      return { running: false, error: `Ollama responded with status ${res.status}` };
    }

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
  } catch (e) {
    const isRemoteOrigin = !window.location.origin.includes('localhost') && !window.location.origin.includes('127.0.0.1');
    if (isRemoteOrigin) {
      return { running: false, error: `Cannot reach Ollama from ${window.location.origin}. Ollama runs locally — use localhost or set OLLAMA_ORIGINS=* ollama serve` };
    }
    return { running: false, error: `Cannot connect to Ollama at ${baseUrl}. Make sure Ollama is running (ollama serve)` };
  }
}

export async function fetchOllamaModels(baseUrl) {
  const url = baseUrl || config.defaultBaseUrl;
  try {
    const res = await fetch(`${url}/api/tags`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.models || []).map(m => ({
      id: m.name,
      name: `${m.name} (${formatSize(m.size)})`,
    }));
  } catch {
    return [];
  }
}

function formatSize(bytes) {
  if (!bytes) return '';
  const gb = bytes / (1024 ** 3);
  return gb >= 1 ? `${gb.toFixed(1)}GB` : `${(bytes / (1024 ** 2)).toFixed(0)}MB`;
}
