// ========================================
// Ollama API Service — WriteAI
// ========================================

const OLLAMA_BASE_URL = 'http://localhost:11434';
const DEFAULT_MODEL = 'llama3';

/**
 * Call Ollama API with streaming support
 */
async function ollamaGenerate(prompt, onChunk, model = DEFAULT_MODEL) {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      stream: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.status} ${response.statusText}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullResponse = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n').filter(Boolean);

    for (const line of lines) {
      try {
        const json = JSON.parse(line);
        if (json.response) {
          fullResponse += json.response;
          onChunk?.(fullResponse);
        }
      } catch {
        // skip malformed lines
      }
    }
  }

  return fullResponse;
}

/**
 * Check if Ollama is running
 */
export async function checkOllamaStatus() {
  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`, { method: 'GET' });
    if (res.ok) {
      const data = await res.json();
      return {
        running: true,
        models: data.models?.map(m => m.name) || [],
      };
    }
    return { running: false, models: [] };
  } catch {
    return { running: false, models: [] };
  }
}

/**
 * Summarize text
 */
export async function summarize(text, onChunk, model = DEFAULT_MODEL) {
  const prompt = `You are a professional text summarizer. Summarize the following text concisely while preserving the key points and main ideas. If the text is in Vietnamese, respond in Vietnamese. If in English, respond in English.

Text to summarize:
"""
${text}
"""

Provide a clear, well-structured summary:`;

  return ollamaGenerate(prompt, onChunk, model);
}

/**
 * Check grammar and provide corrections
 */
export async function checkGrammar(text, onChunk, model = DEFAULT_MODEL) {
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

  return ollamaGenerate(prompt, onChunk, model);
}

/**
 * Change the tone of the text
 */
export async function changeTone(text, tone, onChunk, model = DEFAULT_MODEL) {
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

  return ollamaGenerate(prompt, onChunk, model);
}
