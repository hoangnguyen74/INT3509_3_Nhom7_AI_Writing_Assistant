// ========================================
// OpenAI-Compatible Streaming — Shared by Groq & Ollama
// ========================================

export async function openaiCompatGenerate(baseUrl, apiKey, systemPrompt, userPrompt, onChunk, options = {}) {
  const {
    model,
    temperature = 0.7,
    maxTokens = 4096,
    stream = true,
    signal,
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

  const headers = { 'Content-Type': 'application/json' };
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const response = await fetch(baseUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream,
    }),
    signal,
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

  try {
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
          } catch { /* skip malformed SSE line */ }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return fullResponse;
}
