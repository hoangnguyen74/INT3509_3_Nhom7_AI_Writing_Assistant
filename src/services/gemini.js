// ========================================
// Google Gemini API Service — WriteAI
// ========================================

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_MODEL = 'gemini-2.0-flash';

/**
 * Get API key from localStorage
 */
export function getApiKey() {
  return localStorage.getItem('writeai-gemini-key') || '';
}

/**
 * Save API key to localStorage
 */
export function setApiKey(key) {
  localStorage.setItem('writeai-gemini-key', key);
}

/**
 * Check if API key is configured and valid
 */
export async function checkGeminiStatus() {
  const apiKey = getApiKey();
  if (!apiKey) {
    return { running: false, error: 'No API key configured' };
  }
  try {
    const res = await fetch(
      `${GEMINI_API_BASE}/${DEFAULT_MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Hi' }] }],
          generationConfig: { maxOutputTokens: 5 },
        }),
      }
    );
    if (res.ok) {
      return { running: true, model: DEFAULT_MODEL };
    }
    const err = await res.json();
    return { running: false, error: err.error?.message || 'Invalid API key' };
  } catch {
    return { running: false, error: 'Network error' };
  }
}

/**
 * Call Gemini API with streaming
 */
async function geminiGenerate(prompt, onChunk, model = DEFAULT_MODEL) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('Please set your Gemini API key in Settings.');
  }

  const response = await fetch(
    `${GEMINI_API_BASE}/${model}:streamGenerateContent?alt=sse&key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4096,
        },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    if (response.status === 429) {
      throw new Error('Rate limit exceeded. Please wait a moment and try again.');
    }
    throw new Error(err.error?.message || `Gemini API error: ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullResponse = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const jsonStr = line.slice(6);
        if (jsonStr === '[DONE]') continue;
        try {
          const json = JSON.parse(jsonStr);
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            fullResponse += text;
            onChunk?.(fullResponse);
          }
        } catch {
          // skip malformed lines
        }
      }
    }
  }

  return fullResponse;
}

/**
 * Summarize text
 */
export async function summarize(text, onChunk) {
  const prompt = `You are a professional text summarizer. Summarize the following text concisely while preserving the key points and main ideas. If the text is in Vietnamese, respond in Vietnamese. If in English, respond in English.

Text to summarize:
"""
${text}
"""

Provide a clear, well-structured summary:`;

  return geminiGenerate(prompt, onChunk);
}

/**
 * Check grammar and provide corrections
 */
export async function checkGrammar(text, onChunk) {
  const prompt = `You are an expert grammar checker and writing assistant. Analyze the following text for grammatical errors, spelling mistakes, punctuation issues, and style improvements.

For each issue found:
1. Quote the original text
2. Explain the issue
3. Suggest a correction

If the text is in Vietnamese, check Vietnamese grammar and respond in Vietnamese.
If the text is in English, check English grammar and respond in English.

If no errors are found, say the text is correct and well-written.

Text to check:
"""
${text}
"""

Analysis:`;

  return geminiGenerate(prompt, onChunk);
}

/**
 * Change the tone of the text
 */
export async function changeTone(text, tone, onChunk) {
  const toneDescriptions = {
    formal: 'formal and professional, suitable for business communications, academic writing, or official documents. Use proper vocabulary, complete sentences, and a respectful tone.',
    friendly: 'friendly and casual, as if writing to a close colleague or friend. Use a warm, approachable tone while still being clear and coherent.',
    professional: 'professional yet approachable, suitable for workplace communications. Balance formality with readability, using clear and confident language.',
  };

  const prompt = `You are an expert writing assistant. Rewrite the following text in a ${tone} tone. The rewritten text should be ${toneDescriptions[tone] || toneDescriptions.professional}

Maintain the original meaning and key information. If the text is in Vietnamese, respond in Vietnamese. If in English, respond in English.

Original text:
"""
${text}
"""

Rewritten text in ${tone} tone:`;

  return geminiGenerate(prompt, onChunk);
}
