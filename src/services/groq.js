// ========================================
// Groq Cloud API Service — WriteAI
// Full AI feature set (12+ tools)
// ========================================

const GROQ_API_BASE = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

// ==================== API Key Management ====================

export function getApiKey() {
  return localStorage.getItem('writeai-groq-key') || '';
}

export function setApiKey(key) {
  localStorage.setItem('writeai-groq-key', key);
}

export async function checkGroqStatus() {
  const apiKey = getApiKey();
  if (!apiKey) return { running: false, error: 'No API key configured' };
  try {
    const res = await fetch(GROQ_API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: DEFAULT_MODEL, messages: [{ role: 'user', content: 'Hi' }], max_tokens: 5 }),
    });
    if (res.ok) return { running: true, model: DEFAULT_MODEL };
    const err = await res.json();
    return { running: false, error: err.error?.message || 'Invalid API key' };
  } catch {
    return { running: false, error: 'Network error or CORS issue' };
  }
}

// ==================== Core Generate Function ====================

async function groqGenerate(systemPrompt, userPrompt, onChunk, options = {}) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('Please set your Groq API key in Settings.');

  const {
    model = DEFAULT_MODEL,
    temperature = 0.7,
    maxTokens = 4096,
    stream = true,
  } = options;

  const messages = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  if (typeof userPrompt === 'string') {
    messages.push({ role: 'user', content: userPrompt });
  } else if (Array.isArray(userPrompt)) {
    messages.push(...userPrompt);
  }

  const response = await fetch(GROQ_API_BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model, messages, temperature,
      max_tokens: maxTokens,
      stream,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `API Error: ${response.status}`);
  }

  if (!stream) {
    const json = await response.json();
    const text = json.choices?.[0]?.message?.content || '';
    onChunk?.(text);
    return text;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullResponse = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const chunk = decoder.decode(value, { stream: true });
    for (const line of chunk.split('\n')) {
      if (line.startsWith('data: ')) {
        const jsonStr = line.slice(6);
        if (jsonStr.trim() === '[DONE]') continue;
        try {
          const json = JSON.parse(jsonStr);
          const text = json.choices?.[0]?.delta?.content;
          if (text) {
            fullResponse += text;
            onChunk?.(fullResponse);
          }
        } catch { /* skip */ }
      }
    }
  }

  return fullResponse;
}

// ==================== Utilities & Prompts ====================

const PERSONA_PROMPTS = {
  general: 'You are an intelligent, professional writing assistant.',
  it: 'You are a Senior Tech Lead and IT Expert. Use precise, technical, and analytical language suitable for developers and engineers.',
  sales: 'You are an elite Sales & Marketing Manager. Focus on persuasion, engagement, emotional hook, and conversion-oriented copy.',
  academic: 'You are a rigorous Academic Researcher. Maintain a formal, objective, scholarly tone, avoiding colloquialisms.'
};

function buildSystem(task, format = 'Return ONLY the requested output. NO conversational padding. NO "Here is your text".', persona = 'general') {
  const pContext = PERSONA_PROMPTS[persona] || PERSONA_PROMPTS.general;
  return `ROLE: ${pContext}\nTASK: ${task}\nFORMAT RULES: ${format}\nMatch the language of the user's input unless explicitly specified otherwise.`;
}

// ==================== Chat Function (multi-turn) ====================

export async function chat(messages, onChunk, editorContext = '', persona = 'general') {
  const pContext = PERSONA_PROMPTS[persona] || PERSONA_PROMPTS.general;
  const systemPrompt = `ROLE: ${pContext}\nYou help users with writing, editing, brainstorming, and questions.
${editorContext ? `\nCONTEXT: The user is currently working on the following text in their editor:\n"""\n${editorContext}\n"""` : ''}
FORMAT: Be helpful, concise, and professional. Use markdown formatting. Reply in the user's language.`;

  return groqGenerate(systemPrompt, messages, onChunk);
}

// ==================== Writing Tools ====================

export async function summarize(text, onChunk, persona = 'general') {
  const sys = buildSystem('Summarize the input text concisely, preserving key ideas and main points.', undefined, persona);
  return groqGenerate(sys, `Input:\n"""\n${text}\n"""`, onChunk);
}

export async function checkGrammar(text, onChunk, persona = 'general') {
  const sys = buildSystem(
    'Act as an expert proofreader. Check for grammar, spelling, punctuation, and style issues.',
    'Output a brief list of improvements, then output the fully corrected text separated by "---". NEVER say "Here is the result".',
    persona
  );
  return groqGenerate(sys, `Input:\n"""\n${text}\n"""`, onChunk);
}

export async function changeTone(text, tone, onChunk, persona = 'general') {
  const sys = buildSystem(
    `Rewrite the text in a specifically [${tone}] tone. Ensure original meaning is kept but vocabulary and sentence structure reflect the requested tone.`,
    undefined, 
    persona
  );
  return groqGenerate(sys, `Input:\n"""\n${text}\n"""`, onChunk);
}

export async function paraphrase(text, onChunk, persona = 'general') {
  const sys = buildSystem('Rewrite and paraphrase the text using different words and sentence structures while keeping the original meaning intact.', undefined, persona);
  return groqGenerate(sys, `Input:\n"""\n${text}\n"""`, onChunk);
}

export async function expandText(text, onChunk, persona = 'general') {
  const sys = buildSystem('Elaborate and expand on the text. Add relevant details, examples, or logical explanations to add depth.', undefined, persona);
  return groqGenerate(sys, `Input:\n"""\n${text}\n"""`, onChunk);
}

export async function shortenText(text, onChunk, persona = 'general') {
  const sys = buildSystem('Make the text significantly shorter and more concise. Remove fluff while retaining core information.', undefined, persona);
  return groqGenerate(sys, `Input:\n"""\n${text}\n"""`, onChunk);
}

export async function improveReadability(text, onChunk, persona = 'general') {
  const sys = buildSystem('Improve the flow, rhythm, and clarity of the text. Use active voice and eliminate awkward phrasing.', undefined, persona);
  return groqGenerate(sys, `Input:\n"""\n${text}\n"""`, onChunk);
}

// ==================== Compose ====================

export async function compose(prompt, contentType, tone, language, onChunk, persona = 'general') {
  const langStr = language === 'vi' ? 'Vietnamese' : language === 'en' ? 'English' : 'the language of the prompt';
  const sys = buildSystem(
    `Write a creative and engaging ${contentType}. Focus on the user's prompt. Language required: ${langStr}. Required tone: ${tone || 'neutral'}.`,
    undefined,
    persona
  );
  return groqGenerate(sys, prompt, onChunk);
}

export async function continueWriting(text, onChunk, persona = 'general') {
  const sys = buildSystem('Continue writing from where the text left off. Maintain style, context, and logical flow. Produce about 2-3 paragraphs.', undefined, persona);
  return groqGenerate(sys, `Input to continue from:\n"""\n${text}\n"""`, onChunk);
}

export async function generateOutline(topic, contentType, onChunk, persona = 'general') {
  const sys = buildSystem(
    `Generate a detailed structural outline for a ${contentType || 'document'} about the user's topic.`,
    'Use Markdown formatting with Header levels (H1, H2, H3) and bullet points. ONLY return the markdown.',
    persona
  );
  return groqGenerate(sys, `Topic:\n"${topic}"`, onChunk);
}

// ==================== Translate ====================

const LANGUAGE_NAMES = {
  en: 'English', vi: 'Vietnamese', ja: 'Japanese', ko: 'Korean',
  zh: 'Chinese', fr: 'French', es: 'Spanish', de: 'German',
  pt: 'Portuguese', ru: 'Russian', ar: 'Arabic', hi: 'Hindi',
  th: 'Thai', id: 'Indonesian', ms: 'Malay',
};

export async function translate(text, sourceLang, targetLang, onChunk) {
  const sourceLabel = sourceLang === 'auto' ? 'the detected language' : LANGUAGE_NAMES[sourceLang] || sourceLang;
  const targetLabel = LANGUAGE_NAMES[targetLang] || targetLang;

  return groqGenerate(
    `You are a professional translator. Translate accurately from ${sourceLabel} to ${targetLabel}. Preserve formatting, tone, and meaning. Only output the translation, no explanations.`,
    `Translate to ${targetLabel}:\n\n"""\n${text}\n"""`,
    onChunk
  );
}

// ==================== Exported Language Map ====================
export { LANGUAGE_NAMES };
