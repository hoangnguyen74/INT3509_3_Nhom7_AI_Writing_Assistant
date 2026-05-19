// ========================================
// Provider Configuration — Static config for all AI providers
// ========================================

export const PROVIDER_CONFIG = {
  groq: {
    id: 'groq',
    name: 'Groq Cloud',
    description: 'Fast inference with Llama & Mixtral models',
    icon: '⚡',
    requiresApiKey: true,
    apiKeyPlaceholder: 'gsk_...',
    apiKeyUrl: 'https://console.groq.com/keys',
    apiKeyLabel: 'Groq Console',
    baseUrl: 'https://api.groq.com/openai/v1/chat/completions',
    models: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', default: true },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B (Fast)' },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B' },
      { id: 'gemma2-9b-it', name: 'Gemma 2 9B' },
    ],
  },
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    description: 'Free API with Gemma 4 & Gemini models',
    icon: '🔮',
    requiresApiKey: true,
    apiKeyPlaceholder: 'AI...',
    apiKeyUrl: 'https://aistudio.google.com/apikey',
    apiKeyLabel: 'Google AI Studio',
    models: [
      { id: 'gemma-4-31b-it', name: 'Gemma 4 31B (Free)', default: true },
      { id: 'gemma-4-26b-a4b-it', name: 'Gemma 4 26B MoE (Free)' },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
      { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite' },
    ],
  },
  ollama: {
    id: 'ollama',
    name: 'Ollama (Local)',
    description: 'Run models locally — no API key needed',
    icon: '🦙',
    requiresApiKey: false,
    defaultBaseUrl: 'http://localhost:11434',
    models: [],
  },
};

export const PROVIDER_IDS = Object.keys(PROVIDER_CONFIG);

export function getDefaultModel(providerId) {
  const config = PROVIDER_CONFIG[providerId];
  if (!config) return '';
  const defaultModel = config.models.find(m => m.default);
  return defaultModel?.id || config.models[0]?.id || '';
}
