// ========================================
// Google Gemini Provider — Gemini API with SSE streaming
// ========================================
import { getDefaultModel } from './models';

export async function geminiGenerate(systemPrompt, userPrompt, onChunk, options = {}) {
  const {
    apiKey,
    model,
    temperature = 0.7,
    maxTokens = 4096,
    stream = true,
    signal,
  } = options;

  if (!apiKey) throw new Error('Please set your Google Gemini API key in Settings.');

  const modelId = model || getDefaultModel('gemini');

  const contents = [];
  if (typeof userPrompt === 'string') {
    contents.push({ role: 'user', parts: [{ text: userPrompt }] });
  } else if (Array.isArray(userPrompt)) {
    for (const msg of userPrompt) {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      });
    }
  }

  const body = {
    contents,
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
    },
  };

  const isGemmaModel = modelId.startsWith('gemma');
  if (systemPrompt) {
    if (isGemmaModel) {
      // Gemma models don't support systemInstruction — prepend to first user message
      if (contents.length > 0 && contents[0].role === 'user') {
        contents[0].parts[0].text = `${systemPrompt}\n\n${contents[0].parts[0].text}`;
      } else {
        contents.unshift({ role: 'user', parts: [{ text: systemPrompt }] });
      }
    } else {
      body.systemInstruction = { parts: [{ text: systemPrompt }] };
    }
  }

  if (stream) {
    return geminiStream(modelId, apiKey, body, onChunk, signal);
  } else {
    return geminiNonStream(modelId, apiKey, body, onChunk);
  }
}

async function geminiStream(modelId, apiKey, body, onChunk, signal) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:streamGenerateContent?alt=sse&key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = err.error?.message || `Gemini API Error: ${response.status}`;
    throw new Error(msg);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let fullResponse = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      for (const line of chunk.split('\n')) {
        if (line.startsWith('data: ')) {
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;
          try {
            const json = JSON.parse(jsonStr);
            const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              fullResponse += text;
              onChunk?.(fullResponse);
            }
          } catch { /* skip malformed line */ }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return fullResponse;
}

async function geminiNonStream(modelId, apiKey, body, onChunk) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = err.error?.message || `Gemini API Error: ${response.status}`;
    throw new Error(msg);
  }

  const json = await response.json();
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text || '';
  onChunk?.(text);
  return text;
}

export async function checkGeminiStatus(providerSettings = {}) {
  const { apiKey, model } = providerSettings;
  if (!apiKey) return { running: false, error: 'No API key configured' };

  const modelId = model || getDefaultModel('gemini');

  // First try listing models to verify the API key works
  try {
    const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}&pageSize=5`;
    const listRes = await fetch(listUrl);
    if (!listRes.ok) {
      const listErr = await listRes.json().catch(() => ({}));
      return { running: false, error: listErr.error?.message || `API key error (${listRes.status})` };
    }
  } catch {
    return { running: false, error: 'Network error — cannot reach Google AI API' };
  }

  // Then test the specific model
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'Hi' }] }],
        generationConfig: { maxOutputTokens: 5 },
      }),
    });

    if (res.ok) return { running: true, model: modelId };
    const err = await res.json().catch(() => ({}));
    const msg = err.error?.message || `Error ${res.status}`;
    // If this model fails, suggest trying another
    return { running: false, error: `${msg} — Try a different model.` };
  } catch (e) {
    return { running: false, error: `Model test failed: ${e.message}` };
  }
}
