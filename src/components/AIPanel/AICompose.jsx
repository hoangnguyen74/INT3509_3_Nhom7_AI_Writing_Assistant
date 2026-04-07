// ========================================
// AI Compose — Generate content from prompts
// ========================================
import { useState, useCallback } from 'react';
import {
  Send, Copy, Check, ArrowDownToLine, Loader2, AlertCircle,
  FileText, ListChecks, ChevronRight
} from 'lucide-react';
import { compose, continueWriting, generateOutline } from '../../services/groq';

const CONTENT_TYPES = [
  { id: 'email', label: '📧 Email' },
  { id: 'blog', label: '📝 Blog Post' },
  { id: 'essay', label: '📄 Essay' },
  { id: 'report', label: '📊 Report' },
  { id: 'letter', label: '✉️ Letter' },
  { id: 'social', label: '📱 Social Media' },
  { id: 'story', label: '📖 Story' },
  { id: 'review', label: '⭐ Review' },
];

const TONES = [
  { id: '', label: 'Auto' },
  { id: 'formal', label: 'Formal' },
  { id: 'friendly', label: 'Friendly' },
  { id: 'professional', label: 'Professional' },
  { id: 'creative', label: 'Creative' },
];

const LANGUAGES = [
  { id: 'auto', label: '🌐 Auto' },
  { id: 'en', label: '🇬🇧 English' },
  { id: 'vi', label: '🇻🇳 Vietnamese' },
];

export default function AICompose({ editor, isReady }) {
  const [prompt, setPrompt] = useState('');
  const [contentType, setContentType] = useState('email');
  const [tone, setTone] = useState('');
  const [language, setLanguage] = useState('auto');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState('compose'); // 'compose' | 'continue' | 'outline'

  const handleGenerate = useCallback(async () => {
    if (mode === 'compose' && !prompt.trim()) {
      setError('Please enter a prompt to generate content.');
      return;
    }

    setLoading(true);
    setResult('');
    setError('');

    try {
      const onChunk = (partial) => setResult(partial);
      if (mode === 'continue') {
        const text = editor?.state.doc.textContent || '';
        if (!text.trim()) {
          setError('Write some text in the editor first to continue from.');
          setLoading(false);
          return;
        }
        await continueWriting(text, onChunk);
      } else if (mode === 'outline') {
        await generateOutline(prompt, contentType, onChunk);
      } else {
        await compose(prompt, contentType, tone, language, onChunk);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [mode, prompt, contentType, tone, language, editor]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [result]);

  const handleInsert = useCallback(() => {
    if (!editor || !result) return;
    editor.chain().focus().insertContent(
      `<p>${result.replace(/\n/g, '</p><p>')}</p>`
    ).run();
  }, [editor, result]);

  return (
    <div className="ai-compose">
      {/* Mode Tabs */}
      <div className="compose-mode-tabs">
        <button
          className={`compose-mode-tab ${mode === 'compose' ? 'compose-mode-tab--active' : ''}`}
          onClick={() => { setMode('compose'); setResult(''); setError(''); }}
        >
          <Send size={14} />
          Compose
        </button>
        <button
          className={`compose-mode-tab ${mode === 'continue' ? 'compose-mode-tab--active' : ''}`}
          onClick={() => { setMode('continue'); setResult(''); setError(''); }}
        >
          <ChevronRight size={14} />
          Continue
        </button>
        <button
          className={`compose-mode-tab ${mode === 'outline' ? 'compose-mode-tab--active' : ''}`}
          onClick={() => { setMode('outline'); setResult(''); setError(''); }}
        >
          <ListChecks size={14} />
          Outline
        </button>
      </div>

      {/* Prompt Input (for compose & outline) */}
      {mode !== 'continue' && (
        <div className="compose-field">
          <label className="compose-label">
            {mode === 'outline' ? 'Topic' : 'Describe what you want to write'}
          </label>
          <textarea
            className="compose-textarea"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={
              mode === 'outline'
                ? 'e.g., Climate change impact on agriculture...'
                : 'e.g., Write a follow-up email to a client about the project deadline...'
            }
            rows={3}
          />
        </div>
      )}

      {/* Content Type */}
      {mode !== 'continue' && (
        <div className="compose-field">
          <label className="compose-label">Content Type</label>
          <div className="compose-type-grid">
            {CONTENT_TYPES.map(type => (
              <button
                key={type.id}
                className={`compose-type-btn ${contentType === type.id ? 'compose-type-btn--active' : ''}`}
                onClick={() => setContentType(type.id)}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tone & Language (compose only) */}
      {mode === 'compose' && (
        <div className="compose-row">
          <div className="compose-field compose-field--half">
            <label className="compose-label">Tone</label>
            <select
              className="compose-select"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
            >
              {TONES.map(t => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
          </div>
          <div className="compose-field compose-field--half">
            <label className="compose-label">Language</label>
            <select
              className="compose-select"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              {LANGUAGES.map(l => (
                <option key={l.id} value={l.id}>{l.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Continue mode info */}
      {mode === 'continue' && (
        <p className="compose-info">
          💡 AI will continue writing from where your text ends. The current editor content will be used as context.
        </p>
      )}

      {/* Generate Button */}
      <button
        className="compose-generate-btn"
        onClick={handleGenerate}
        disabled={loading || !isReady}
      >
        {loading ? (
          <><Loader2 size={16} className="wt-spinner" /> Generating...</>
        ) : (
          <>
            {mode === 'compose' && <><Send size={16} /> Generate</>}
            {mode === 'continue' && <><ChevronRight size={16} /> Continue Writing</>}
            {mode === 'outline' && <><ListChecks size={16} /> Generate Outline</>}
          </>
        )}
      </button>

      {/* Error */}
      {error && (
        <div className="wt-error">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="wt-result fade-in">
          <div className="wt-result__header">
            <span className="wt-result__label">✨ Generated Content</span>
            <div className="wt-result__actions">
              <button className="wt-action-btn" onClick={handleCopy}>
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              <button className="wt-action-btn wt-action-btn--primary" onClick={handleInsert}>
                <ArrowDownToLine size={13} />
                Insert
              </button>
            </div>
          </div>
          <div className="wt-result__text">{result}</div>
        </div>
      )}
    </div>
  );
}
