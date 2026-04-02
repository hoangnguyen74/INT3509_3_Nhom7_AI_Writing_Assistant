import { useState, useCallback } from 'react';
import { Sparkles, FileText, SpellCheck, Palette, AlertCircle, Copy, Check, Replace } from 'lucide-react';
import { summarize, checkGrammar, changeTone } from '../../services/ollama';
import './AIPanel.css';

const TABS = [
  { id: 'summarize', label: 'Summarize', icon: <FileText /> },
  { id: 'grammar', label: 'Grammar', icon: <SpellCheck /> },
  { id: 'tone', label: 'Tone', icon: <Palette /> },
];

const TONES = [
  { id: 'formal', label: '🎩 Formal' },
  { id: 'friendly', label: '😊 Friendly' },
  { id: 'professional', label: '💼 Professional' },
];

export default function AIPanel({ editor, ollamaStatus }) {
  const [activeTab, setActiveTab] = useState('summarize');
  const [selectedTone, setSelectedTone] = useState('professional');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const getText = useCallback(() => {
    if (!editor) return '';
    // Use selected text if any, otherwise use full document text
    const { from, to } = editor.state.selection;
    if (from !== to) {
      return editor.state.doc.textBetween(from, to, ' ');
    }
    return editor.state.doc.textContent;
  }, [editor]);

  const handleAction = useCallback(async () => {
    const text = getText();
    if (!text.trim()) {
      setError('Please write or paste some text in the editor first.');
      return;
    }

    setLoading(true);
    setResult('');
    setError('');

    try {
      const onChunk = (partial) => setResult(partial);

      switch (activeTab) {
        case 'summarize':
          await summarize(text, onChunk);
          break;
        case 'grammar':
          await checkGrammar(text, onChunk);
          break;
        case 'tone':
          await changeTone(text, selectedTone, onChunk);
          break;
      }
    } catch (err) {
      console.error('AI Error:', err);
      if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
        setError('Cannot connect to Ollama. Make sure Ollama is running on localhost:11434 and OLLAMA_ORIGINS=* is set.');
      } else {
        setError(`Error: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedTone, getText]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [result]);

  const handleApply = useCallback(() => {
    if (!editor || !result) return;
    
    const { from, to } = editor.state.selection;
    if (from !== to) {
      // Replace selected text
      editor.chain().focus().deleteSelection().insertContent(result).run();
    } else {
      // Replace all content
      editor.commands.setContent(`<p>${result.replace(/\n/g, '</p><p>')}</p>`);
    }
  }, [editor, result]);

  const getActionLabel = () => {
    switch (activeTab) {
      case 'summarize': return 'Summarize Text';
      case 'grammar': return 'Check Grammar';
      case 'tone': return `Apply ${selectedTone.charAt(0).toUpperCase() + selectedTone.slice(1)} Tone`;
    }
  };

  const getEmptyMessage = () => {
    switch (activeTab) {
      case 'summarize': return 'Click the button to generate a concise summary of your text.';
      case 'grammar': return 'Click the button to analyze your text for grammar, spelling, and style issues.';
      case 'tone': return 'Select a tone and click the button to rewrite your text.';
    }
  };

  const getEmptyIcon = () => {
    switch (activeTab) {
      case 'summarize': return <FileText />;
      case 'grammar': return <SpellCheck />;
      case 'tone': return <Palette />;
    }
  };

  return (
    <div className="ai-panel">
      {/* Header */}
      <div className="ai-panel__header">
        <div className="ai-panel__title">
          <div className="ai-panel__title-icon">
            <Sparkles />
          </div>
          AI Assistant
        </div>
        <div className={`ai-panel__status ${ollamaStatus?.running ? 'ai-panel__status--online' : 'ai-panel__status--offline'}`}>
          <span className={`status-dot ${ollamaStatus?.running ? 'status-dot--online' : 'status-dot--offline'}`}></span>
          {ollamaStatus?.running ? 'Online' : 'Offline'}
        </div>
      </div>

      {/* Tabs */}
      <div className="ai-panel__tabs">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`ai-panel__tab ${activeTab === tab.id ? 'ai-panel__tab--active' : ''}`}
            onClick={() => { setActiveTab(tab.id); setResult(''); setError(''); }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="ai-panel__content">
        {/* Tone Selector (only for tone tab) */}
        {activeTab === 'tone' && (
          <div className="tone-selector">
            {TONES.map(tone => (
              <button
                key={tone.id}
                className={`tone-btn ${selectedTone === tone.id ? 'tone-btn--active' : ''}`}
                onClick={() => setSelectedTone(tone.id)}
              >
                {tone.label}
              </button>
            ))}
          </div>
        )}

        {/* Action Button */}
        <button
          className="ai-action-btn"
          onClick={handleAction}
          disabled={loading || !ollamaStatus?.running}
        >
          {loading ? (
            <>
              <div className="ai-loading__spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
              Processing...
            </>
          ) : (
            <>
              <Sparkles />
              {getActionLabel()}
            </>
          )}
        </button>

        {/* Error */}
        {error && (
          <div className="ai-error">
            <AlertCircle />
            <span>{error}</span>
          </div>
        )}

        {/* Loading */}
        {loading && !result && (
          <div className="ai-loading">
            <div className="ai-loading__spinner" />
            <span className="ai-loading__text">AI is thinking...</span>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="ai-result fade-in">
            <div className="ai-result__header">
              <span className="ai-result__label">
                {activeTab === 'summarize' ? '📝 Summary' : activeTab === 'grammar' ? '✅ Analysis' : '✨ Rewritten'}
              </span>
              <div className="ai-result__actions">
                <button className="ai-result__action-btn" onClick={handleCopy} title="Copy to clipboard">
                  {copied ? <Check /> : <Copy />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                {(activeTab === 'tone' || activeTab === 'summarize') && (
                  <button className="ai-result__action-btn" onClick={handleApply} title="Replace text in editor">
                    <Replace />
                    Apply
                  </button>
                )}
              </div>
            </div>
            <div className="ai-result__text">{result}</div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !result && !error && (
          <div className="ai-empty">
            <div className="ai-empty__icon">
              {getEmptyIcon()}
            </div>
            <p className="ai-empty__text">{getEmptyMessage()}</p>
          </div>
        )}
      </div>
    </div>
  );
}
