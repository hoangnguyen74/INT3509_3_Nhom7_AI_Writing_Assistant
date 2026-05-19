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
    description: 'Free tier with Gemini & Gemma models',
    icon: '🔮',
    requiresApiKey: true,
    apiKeyPlaceholder: 'AI...',
    apiKeyUrl: 'https://aistudio.google.com/apikey',
    apiKeyLabel: 'Google AI Studio',
    models: [
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', default: true },
      { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
      { id: 'gemma-3-27b-it', name: 'Gemma 3 27B' },
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
