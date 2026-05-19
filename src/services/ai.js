// ========================================
// AI Service Facade — Multi-provider routing
// All components import from this file
// ========================================
import { groqGenerate, checkGroqStatus } from './providers/groq';
import { geminiGenerate, checkGeminiStatus } from './providers/gemini';
import { ollamaGenerate, checkOllamaStatus, fetchOllamaModels as _fetchOllamaModels } from './providers/ollama';
import { PROVIDER_CONFIG, getDefaultModel } from './providers/models';

// ==================== Settings Management ====================

const SETTINGS_KEY = 'writeai-ai-settings';

const DEFAULT_AI_SETTINGS = {
  activeProvider: 'groq',
  providers: {
    groq:   { apiKey: '', model: 'llama-3.3-70b-versatile' },
    gemini: { apiKey: '', model: 'gemini-2.5-flash' },
    ollama: { baseUrl: 'http://localhost:11434', model: '' },
  },
};

export function getAISettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      // Migrate from old groq-only key
      const oldKey = localStorage.getItem('writeai-groq-key');
      if (oldKey) {
        const settings = { ...DEFAULT_AI_SETTINGS };
        settings.providers = { ...settings.providers, groq: { ...settings.providers.groq, apiKey: oldKey } };
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        return settings;
      }
      return { ...DEFAULT_AI_SETTINGS };
    }
    const parsed = JSON.parse(raw);
    return {
      activeProvider: parsed.activeProvider || DEFAULT_AI_SETTINGS.activeProvider,
      providers: {
        groq: { ...DEFAULT_AI_SETTINGS.providers.groq, ...parsed.providers?.groq },
        gemini: { ...DEFAULT_AI_SETTINGS.providers.gemini, ...parsed.providers?.gemini },
        ollama: { ...DEFAULT_AI_SETTINGS.providers.ollama, ...parsed.providers?.ollama },
      },
    };
  } catch {
    return { ...DEFAULT_AI_SETTINGS };
  }
}

export function updateAISettings(patch) {
  const current = getAISettings();
  const merged = { ...current, ...patch };
  if (patch.providers) {
    merged.providers = {
      groq: { ...current.providers.groq, ...patch.providers.groq },
      gemini: { ...current.providers.gemini, ...patch.providers.gemini },
      ollama: { ...current.providers.ollama, ...patch.providers.ollama },
    };
  }
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(merged));
  // Keep backward-compat with old key for any code that might still read it
  if (merged.providers.groq.apiKey) {
    localStorage.setItem('writeai-groq-key', merged.providers.groq.apiKey);
  }
  return merged;
}

// Convenience: check if the active provider is properly configured
export function isAIConfigured() {
  const settings = getAISettings();
  const provider = settings.activeProvider;
  const config = PROVIDER_CONFIG[provider];
  const providerSettings = settings.providers[provider];

  if (config?.requiresApiKey && !providerSettings?.apiKey) return false;
  if (provider === 'ollama' && !providerSettings?.model) return false;
  return true;
}

export function getActiveProviderInfo() {
  const settings = getAISettings();
  const provider = settings.activeProvider;
  const config = PROVIDER_CONFIG[provider];
  const providerSettings = settings.providers[provider];
  return { provider, config, providerSettings };
}

// ==================== Core Generate (Router) ====================

async function aiGenerate(systemPrompt, userPrompt, onChunk, options = {}) {
  const settings = getAISettings();
  const providerId = options.provider || settings.activeProvider;
  const providerSettings = settings.providers[providerId];

  const mergedOptions = {
    ...options,
    apiKey: providerSettings?.apiKey,
    model: options.model || providerSettings?.model || getDefaultModel(providerId),
    baseUrl: providerSettings?.baseUrl,
  };

  switch (providerId) {
    case 'groq':
      return groqGenerate(systemPrompt, userPrompt, onChunk, mergedOptions);
    case 'gemini':
      return geminiGenerate(systemPrompt, userPrompt, onChunk, mergedOptions);
    case 'ollama':
      return ollamaGenerate(systemPrompt, userPrompt, onChunk, mergedOptions);
    default:
      throw new Error(`Unknown AI provider: ${providerId}`);
  }
}

// ==================== Status Check ====================

export async function checkAIStatus(providerId) {
  const settings = getAISettings();
  const id = providerId || settings.activeProvider;
  const providerSettings = settings.providers[id];

  switch (id) {
    case 'groq':
      return checkGroqStatus(providerSettings);
    case 'gemini':
      return checkGeminiStatus(providerSettings);
    case 'ollama':
      return checkOllamaStatus(providerSettings);
    default:
      return { running: false, error: `Unknown provider: ${id}` };
  }
}

export const fetchOllamaModels = _fetchOllamaModels;

// ==================== Utilities & Prompts ====================

const PERSONA_PROMPTS = {
  general: 'You are an intelligent, professional writing assistant.',
  it: 'You are a Senior Tech Lead and IT Expert. Use precise, technical, and analytical language suitable for developers and engineers.',
  sales: 'You are an elite Sales & Marketing Manager. Focus on persuasion, engagement, emotional hook, and conversion-oriented copy.',
  academic: 'You are a rigorous Academic Researcher. Maintain a formal, objective, scholarly tone, avoiding colloquialisms.',
};

function buildSystem(task, format = 'Return ONLY the final rewritten text. No introductions, no explanations, no "Here is...", no bullet points about changes. Just the text itself.', persona = 'general') {
  const pContext = PERSONA_PROMPTS[persona] || PERSONA_PROMPTS.general;
  return `ROLE: ${pContext}\nTASK: ${task}\nFORMAT RULES: ${format}\nMatch the language of the user's input unless explicitly specified otherwise.`;
}

// ==================== Post-processing ====================

const PREAMBLE_PATTERNS = [
  /^(?:Here(?:'s| is)(?: the| your)?[\s\S]*?:\s*\n)/i,
  /^(?:Sure[,!]?\s*(?:here[\s\S]*?:\s*\n)?)/i,
  /^(?:I've (?:rewritten|revised|corrected|improved|summarized|expanded|shortened|paraphrased)[\s\S]*?:\s*\n)/i,
  /^(?:(?:The|Below is the) (?:corrected|revised|rewritten|improved|summarized)[\s\S]*?:\s*\n)/i,
  /^(?:Certainly[,!]?\s*(?:here[\s\S]*?:\s*\n)?)/i,
  /^(?:Of course[,!]?\s*(?:here[\s\S]*?:\s*\n)?)/i,
];

export function cleanAIOutput(text, mode = 'text-only') {
  if (!text || mode === 'raw') return text || '';
  let cleaned = text.trim();

  // Strip preamble lines
  for (const pattern of PREAMBLE_PATTERNS) {
    cleaned = cleaned.replace(pattern, '');
  }

  if (mode === 'text-only') {
    // Strip markdown code fences wrapping the entire output
    cleaned = cleaned.replace(/^```[\w]*\n([\s\S]*?)\n```$/g, '$1');
    // Strip wrapping triple-quotes or double-quotes around the entire text
    cleaned = cleaned.replace(/^"""\s*([\s\S]*?)\s*"""$/g, '$1');
    if (/^"[^]*"$/.test(cleaned) && cleaned.split('"').length === 3) {
      cleaned = cleaned.slice(1, -1);
    }
    // Strip trailing explanation after --- separator
    const sepIdx = cleaned.lastIndexOf('\n---\n');
    if (sepIdx > 0) cleaned = cleaned.substring(sepIdx + 5).trim() || cleaned.substring(0, sepIdx).trim();
  }

  return cleaned.trim();
}

// ==================== Chat Function (multi-turn) ====================

export async function chat(messages, onChunk, editorContext = '', persona = 'general') {
  const pContext = PERSONA_PROMPTS[persona] || PERSONA_PROMPTS.general;
  const systemPrompt = `ROLE: ${pContext}\nYou help users with writing, editing, brainstorming, and questions.
${editorContext ? `\nCONTEXT: The user is currently working on the following text in their editor:\n"""\n${editorContext}\n"""` : ''}
FORMAT: Be helpful, concise, and professional. Use markdown formatting. Reply in the user's language.`;

  return aiGenerate(systemPrompt, messages, onChunk);
}

// ==================== Writing Tools ====================

export async function summarize(text, onChunk, persona = 'general') {
  const sys = buildSystem('Summarize the input text concisely, preserving key ideas and main points.', undefined, persona);
  return aiGenerate(sys, `Input:\n"""\n${text}\n"""`, onChunk);
}

export async function checkGrammar(text, onChunk, persona = 'general') {
  const sys = buildSystem(
    'Act as an expert proofreader. Fix all grammar, spelling, punctuation, and style issues.',
    'Return ONLY the corrected text. Do not list changes or explain what you fixed. Just output the final corrected version.',
    persona
  );
  return aiGenerate(sys, `Input:\n"""\n${text}\n"""`, onChunk);
}

export async function changeTone(text, tone, onChunk, persona = 'general') {
  const sys = buildSystem(
    `Rewrite the text in a specifically [${tone}] tone. Ensure original meaning is kept but vocabulary and sentence structure reflect the requested tone.`,
    undefined,
    persona
  );
  return aiGenerate(sys, `Input:\n"""\n${text}\n"""`, onChunk);
}

export async function paraphrase(text, onChunk, persona = 'general') {
  const sys = buildSystem('Rewrite and paraphrase the text using different words and sentence structures while keeping the original meaning intact.', undefined, persona);
  return aiGenerate(sys, `Input:\n"""\n${text}\n"""`, onChunk);
}

export async function expandText(text, onChunk, persona = 'general') {
  const sys = buildSystem('Elaborate and expand on the text. Add relevant details, examples, or logical explanations to add depth.', undefined, persona);
  return aiGenerate(sys, `Input:\n"""\n${text}\n"""`, onChunk);
}

export async function shortenText(text, onChunk, persona = 'general') {
  const sys = buildSystem('Make the text significantly shorter and more concise. Remove fluff while retaining core information.', undefined, persona);
  return aiGenerate(sys, `Input:\n"""\n${text}\n"""`, onChunk);
}

export async function improveReadability(text, onChunk, persona = 'general') {
  const sys = buildSystem('Improve the flow, rhythm, and clarity of the text. Use active voice and eliminate awkward phrasing.', undefined, persona);
  return aiGenerate(sys, `Input:\n"""\n${text}\n"""`, onChunk);
}

// ==================== Compose ====================

export async function compose(prompt, contentType, tone, language, onChunk, persona = 'general') {
  const langStr = language === 'vi' ? 'Vietnamese' : language === 'en' ? 'English' : 'the language of the prompt';
  const sys = buildSystem(
    `Write a creative and engaging ${contentType}. Focus on the user's prompt. Language required: ${langStr}. Required tone: ${tone || 'neutral'}.`,
    undefined,
    persona
  );
  return aiGenerate(sys, prompt, onChunk);
}

export async function continueWriting(text, onChunk, persona = 'general') {
  const sys = buildSystem('Continue writing from where the text left off. Maintain style, context, and logical flow. Produce about 2-3 paragraphs.', undefined, persona);
  return aiGenerate(sys, `Input to continue from:\n"""\n${text}\n"""`, onChunk);
}

export async function generateOutline(topic, contentType, onChunk, persona = 'general') {
  const sys = buildSystem(
    `Generate a detailed structural outline for a ${contentType || 'document'} about the user's topic.`,
    'Use Markdown formatting with Header levels (H1, H2, H3) and bullet points. ONLY return the markdown.',
    persona
  );
  return aiGenerate(sys, `Topic:\n"${topic}"`, onChunk);
}

// ==================== Translate ====================

export const LANGUAGE_NAMES = {
  en: 'English', vi: 'Vietnamese', ja: 'Japanese', ko: 'Korean',
  zh: 'Chinese', fr: 'French', es: 'Spanish', de: 'German',
  pt: 'Portuguese', ru: 'Russian', ar: 'Arabic', hi: 'Hindi',
  th: 'Thai', id: 'Indonesian', ms: 'Malay',
};

export async function translate(text, sourceLang, targetLang, onChunk) {
  const sourceLabel = sourceLang === 'auto' ? 'the detected language' : LANGUAGE_NAMES[sourceLang] || sourceLang;
  const targetLabel = LANGUAGE_NAMES[targetLang] || targetLang;

  return aiGenerate(
    `You are a professional translator. Translate accurately from ${sourceLabel} to ${targetLabel}. Preserve formatting, tone, and meaning. Only output the translation, no explanations.`,
    `Translate to ${targetLabel}:\n\n"""\n${text}\n"""`,
    onChunk
  );
}

// ==================== Grammar Inline (for real-time checking) ====================

export async function checkGrammarInline(paragraphText, persona = 'general') {
  const sys = buildSystem(
    'You are a grammar and spelling proofreader. Analyze the following text and find errors.',
    `Return ONLY a valid JSON array of error objects. Each object: {"original":"exact substring from input","replacement":"corrected version","reason":"short explanation under 15 words","type":"grammar|spelling|punctuation|style"}. If no errors, return []. No markdown fences, no extra text.`,
    persona
  );

  const result = await aiGenerate(sys, paragraphText, null, { stream: false, temperature: 0.1 });

  try {
    const parsed = JSON.parse(result.trim());
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    const match = result.match(/\[[\s\S]*\]/);
    if (match) {
      try { return JSON.parse(match[0]); } catch { /* fall through */ }
    }
    return [];
  }
}

// ==================== Re-exports ====================
export { PROVIDER_CONFIG, PROVIDER_IDS, getDefaultModel } from './providers/models';
