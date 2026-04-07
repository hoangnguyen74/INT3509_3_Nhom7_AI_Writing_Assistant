// ========================================
// Writing Tools — 7 AI writing tools
// ========================================
import { useState, useCallback } from 'react';
import {
  FileText, SpellCheck, Palette, RefreshCw, Maximize2,
  Minimize2, Lightbulb, Copy, Check, Replace, Loader2,
  AlertCircle
} from 'lucide-react';
import {
  summarize, checkGrammar, changeTone, paraphrase,
  expandText, shortenText, improveReadability
} from '../../services/groq';

const TOOLS = [
  { id: 'summarize', label: 'Summarize', icon: FileText, desc: 'Create a concise summary' },
  { id: 'grammar', label: 'Grammar', icon: SpellCheck, desc: 'Check grammar & spelling' },
  { id: 'tone', label: 'Tone', icon: Palette, desc: 'Change writing tone' },
  { id: 'paraphrase', label: 'Paraphrase', icon: RefreshCw, desc: 'Rewrite with different words' },
  { id: 'expand', label: 'Expand', icon: Maximize2, desc: 'Add more detail & depth' },
  { id: 'shorten', label: 'Shorten', icon: Minimize2, desc: 'Make it more concise' },
  { id: 'readability', label: 'Readability', icon: Lightbulb, desc: 'Improve clarity & flow' },
];

const TONES = [
  { id: 'formal', label: '🎩 Formal' },
  { id: 'friendly', label: '😊 Friendly' },
  { id: 'professional', label: '💼 Professional' },
  { id: 'academic', label: '🎓 Academic' },
  { id: 'creative', label: '🎨 Creative' },
  { id: 'simple', label: '📖 Simple' },
];

export default function WritingTools({ editor, isReady }) {
  const [activeTool, setActiveTool] = useState(null);
  const [selectedTone, setSelectedTone] = useState('professional');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const getText = useCallback(() => {
    if (!editor) return '';
    const { from, to } = editor.state.selection;
    if (from !== to) return editor.state.doc.textBetween(from, to, ' ');
    return editor.state.doc.textContent;
  }, [editor]);

  const handleToolClick = useCallback(async (toolId) => {
    const text = getText();
    if (!text.trim()) {
      setError('Write or select some text first.');
      setActiveTool(toolId);
      return;
    }

    setActiveTool(toolId);
    setLoading(true);
    setResult('');
    setError('');

    try {
      const onChunk = (partial) => setResult(partial);
      switch (toolId) {
        case 'summarize': await summarize(text, onChunk); break;
        case 'grammar': await checkGrammar(text, onChunk); break;
        case 'tone': await changeTone(text, selectedTone, onChunk); break;
        case 'paraphrase': await paraphrase(text, onChunk); break;
        case 'expand': await expandText(text, onChunk); break;
        case 'shorten': await shortenText(text, onChunk); break;
        case 'readability': await improveReadability(text, onChunk); break;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getText, selectedTone]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [result]);

  const handleApply = useCallback(() => {
    if (!editor || !result) return;
    const { from, to } = editor.state.selection;
    if (from !== to) {
      editor.chain().focus().deleteSelection().insertContent(result).run();
    } else {
      editor.commands.setContent(`<p>${result.replace(/\n/g, '</p><p>')}</p>`);
    }
  }, [editor, result]);

  return (
    <div className="writing-tools">
      {/* Tool Grid */}
      <div className="wt-grid">
        {TOOLS.map(tool => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              className={`wt-tool-btn ${activeTool === tool.id ? 'wt-tool-btn--active' : ''}`}
              onClick={() => handleToolClick(tool.id)}
              disabled={loading || !isReady}
              title={tool.desc}
            >
              <Icon size={16} />
              <span>{tool.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tone selector - show when tone tool is active or clicked */}
      {activeTool === 'tone' && (
        <div className="wt-tone-selector">
          <label className="wt-label">Select Tone:</label>
          <div className="wt-tone-grid">
            {TONES.map(tone => (
              <button
                key={tone.id}
                className={`wt-tone-btn ${selectedTone === tone.id ? 'wt-tone-btn--active' : ''}`}
                onClick={() => {
                  setSelectedTone(tone.id);
                  if (getText().trim()) handleToolClick('tone');
                }}
              >
                {tone.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && !result && (
        <div className="wt-loading">
          <Loader2 size={18} className="wt-spinner" />
          <span>AI is processing...</span>
        </div>
      )}

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
            <span className="wt-result__label">
              {activeTool === 'grammar' ? '✅ Analysis' : '✨ Result'}
            </span>
            <div className="wt-result__actions">
              <button className="wt-action-btn" onClick={handleCopy}>
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
              {activeTool !== 'grammar' && (
                <button className="wt-action-btn wt-action-btn--primary" onClick={handleApply}>
                  <Replace size={13} />
                  Apply
                </button>
              )}
            </div>
          </div>
          <div className="wt-result__text">{result}</div>
        </div>
      )}

      {/* Usage hint */}
      {!loading && !result && !error && (
        <p className="wt-hint">
          💡 Select text in the editor, then click a tool above. If no text is selected, the entire document will be used.
        </p>
      )}
    </div>
  );
}
