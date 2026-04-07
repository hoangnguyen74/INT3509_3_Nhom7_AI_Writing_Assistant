// ========================================
// AI Chat — Conversational AI assistant
// ========================================
import { useState, useCallback, useRef, useEffect } from 'react';
import {
  Send, Trash2, ArrowDownToLine, Copy, Check,
  Loader2, ToggleLeft, ToggleRight
} from 'lucide-react';
import { chat } from '../../services/groq';

export default function AIChat({ editor, isReady }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [includeContext, setIncludeContext] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(-1);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    // Build chat history for API
    const chatHistory = newMessages.map(m => ({
      role: m.role,
      content: m.content,
    }));

    // Get editor context if enabled
    const editorContext = includeContext
      ? (editor?.state.doc.textContent || '')
      : '';

    try {
      let aiResponse = '';
      // Add placeholder for streaming
      setMessages(prev => [...prev, { role: 'assistant', content: '...' }]);

      await chat(chatHistory, (partial) => {
        aiResponse = partial;
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: partial };
          return updated;
        });
      }, editorContext);
    } catch (err) {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: 'assistant',
          content: `❌ Error: ${err.message}`,
          isError: true,
        };
        return updated;
      });
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [input, messages, loading, includeContext, editor]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    setInput('');
  };

  const handleCopy = (idx) => {
    navigator.clipboard.writeText(messages[idx].content);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(-1), 2000);
  };

  const handleInsert = (content) => {
    if (!editor) return;
    editor.chain().focus().insertContent(
      `<p>${content.replace(/\n/g, '</p><p>')}</p>`
    ).run();
  };

  return (
    <div className="ai-chat">
      {/* Chat header */}
      <div className="chat-controls">
        <button
          className={`chat-context-toggle ${includeContext ? 'chat-context-toggle--on' : ''}`}
          onClick={() => setIncludeContext(!includeContext)}
          title="Include editor content as context"
        >
          {includeContext ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
          <span>Editor context</span>
        </button>
        {messages.length > 0 && (
          <button className="chat-clear-btn" onClick={handleClearChat} title="Clear chat">
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-empty">
            <span className="chat-empty__icon">💬</span>
            <p>Start a conversation with AI</p>
            <span className="chat-empty__hint">
              Ask questions, brainstorm ideas, or get help with your writing.
            </span>
            <div className="chat-suggestions">
              {[
                'Help me brainstorm ideas for my essay',
                'What\'s a good opening for my blog post?',
                'Explain this concept in simpler terms',
              ].map((suggestion, i) => (
                <button
                  key={i}
                  className="chat-suggestion-btn"
                  onClick={() => { setInput(suggestion); }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`chat-message chat-message--${msg.role} ${msg.isError ? 'chat-message--error' : ''}`}>
            <div className="chat-message__avatar">
              {msg.role === 'user' ? '👤' : '🤖'}
            </div>
            <div className="chat-message__bubble">
              <div className="chat-message__content">{msg.content}</div>
              {msg.role === 'assistant' && !msg.isError && msg.content !== '...' && (
                <div className="chat-message__actions">
                  <button onClick={() => handleCopy(idx)} title="Copy">
                    {copiedIdx === idx ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                  <button onClick={() => handleInsert(msg.content)} title="Insert to editor">
                    <ArrowDownToLine size={12} />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="chat-input-area">
        <textarea
          ref={inputRef}
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask AI anything..."
          rows={1}
          disabled={loading || !isReady}
        />
        <button
          className="chat-send-btn"
          onClick={handleSend}
          disabled={!input.trim() || loading || !isReady}
        >
          {loading ? <Loader2 size={16} className="wt-spinner" /> : <Send size={16} />}
        </button>
      </div>
    </div>
  );
}
