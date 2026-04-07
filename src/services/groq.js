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

// ==================== Chat Function (multi-turn) ====================

export async function chat(messages, onChunk, editorContext = '') {
  const systemPrompt = `You are WriteAI, an intelligent writing assistant. You help users with writing, editing, brainstorming, and answering questions about their content.
${editorContext ? `\nThe user is currently working on the following text:\n"""\n${editorContext}\n"""` : ''}
Be helpful, concise, and professional. Format your responses with markdown when appropriate. If the user writes in Vietnamese, respond in Vietnamese. If in English, respond in English.`;

  return groqGenerate(systemPrompt, messages, onChunk);
}

// ==================== Writing Tools ====================

export async function summarize(text, onChunk) {
  return groqGenerate(
    'You are a professional text summarizer. Preserve key points and main ideas. Match the language of the input.',
    `Summarize the following text concisely:\n\n"""\n${text}\n"""\n\nSummary:`,
    onChunk
  );
}

export async function checkGrammar(text, onChunk) {
  return groqGenerate(
    'You are an expert grammar checker. For each issue: quote the original, explain the problem, suggest a correction. If no errors, confirm the text is well-written. Match the language of the input.',
    `Analyze this text for grammar, spelling, punctuation, and style:\n\n"""\n${text}\n"""\n\nAnalysis:`,
    onChunk
  );
}

export async function changeTone(text, tone, onChunk) {
  const toneDescriptions = {
    formal: 'formal and professional, suitable for business or academic writing',
    friendly: 'friendly and casual, warm and approachable',
    professional: 'professional yet approachable, clear and confident',
    academic: 'scholarly and precise, using academic language and conventions',
    creative: 'creative and expressive, using vivid language and imagery',
    simple: 'simple and easy to understand, avoiding complex vocabulary',
  };
  return groqGenerate(
    `You are a writing assistant specializing in tone adjustment. Rewrite text in a ${tone} tone: ${toneDescriptions[tone] || toneDescriptions.professional}. Maintain original meaning. Match the language.`,
    `Rewrite this text in a ${tone} tone:\n\n"""\n${text}\n"""\n\nRewritten:`,
    onChunk
  );
}

export async function paraphrase(text, onChunk) {
  return groqGenerate(
    'You are a paraphrasing expert. Rewrite the text using different words and sentence structures while keeping the same meaning. Match the language.',
    `Paraphrase the following text:\n\n"""\n${text}\n"""\n\nParaphrased:`,
    onChunk
  );
}

export async function expandText(text, onChunk) {
  return groqGenerate(
    'You are a writing expander. Elaborate on the text with more details, examples, and explanations while maintaining the original message. Match the language.',
    `Expand and elaborate on this text:\n\n"""\n${text}\n"""\n\nExpanded version:`,
    onChunk
  );
}

export async function shortenText(text, onChunk) {
  return groqGenerate(
    'You are a text condenser. Make the text shorter and more concise while keeping all essential information. Match the language.',
    `Shorten this text while keeping the key information:\n\n"""\n${text}\n"""\n\nShortened:`,
    onChunk
  );
}

export async function improveReadability(text, onChunk) {
  return groqGenerate(
    'You are a readability expert. Improve the text by: simplifying complex sentences, using active voice, improving flow, and making it more engaging. Match the language.',
    `Improve the readability of this text:\n\n"""\n${text}\n"""\n\nImproved version:`,
    onChunk
  );
}

// ==================== Compose ====================

export async function compose(prompt, contentType, tone, language, onChunk) {
  const typeInstructions = {
    email: 'Write a professional email',
    blog: 'Write a blog post',
    essay: 'Write an essay',
    report: 'Write a report',
    letter: 'Write a letter',
    social: 'Write a social media post',
    story: 'Write a short story',
    poem: 'Write a poem',
    review: 'Write a review',
  };

  const langInstruction = language === 'vi' ? 'Write in Vietnamese.' : language === 'en' ? 'Write in English.' : 'Match the language of the prompt.';
  const toneInstruction = tone ? `Use a ${tone} tone.` : '';

  return groqGenerate(
    `You are a creative writing assistant. ${typeInstructions[contentType] || 'Write content'} based on the user's prompt. ${toneInstruction} ${langInstruction} Be creative, well-structured, and engaging.`,
    prompt,
    onChunk
  );
}

export async function continueWriting(text, onChunk) {
  return groqGenerate(
    'You are a writing assistant. Continue writing from where the text left off. Maintain the same style, tone, and context. Match the language. Write 2-4 paragraphs.',
    `Continue writing from here:\n\n"""\n${text}\n"""\n\nContinuation:`,
    onChunk
  );
}

export async function generateOutline(topic, contentType, onChunk) {
  return groqGenerate(
    'You are a content planner. Generate a detailed outline with main sections and sub-points. Use markdown formatting with headers and bullet points. Match the language of the topic.',
    `Generate a detailed outline for a ${contentType || 'document'} about:\n\n"${topic}"\n\nOutline:`,
    onChunk
  );
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
