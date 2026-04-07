// ========================================
// Inline AI Menu — Floating action menu on text selection
// ========================================
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  FileText, RefreshCw, Languages, Maximize2, Minimize2,
  SpellCheck, Copy, Check, Replace, X, Loader2
} from 'lucide-react';
import {
  summarize, paraphrase, translate, expandText,
  shortenText, checkGrammar
} from '../../services/groq';
import { getApiKey } from '../../services/groq';
import './InlineAIMenu.css';

const ACTIONS = [
  { id: 'summarize', label: 'Summarize', icon: FileText },
  { id: 'rewrite', label: 'Rewrite', icon: RefreshCw },
  { id: 'grammar', label: 'Grammar', icon: SpellCheck },
  { id: 'translate', label: 'Translate', icon: Languages },
  { id: 'expand', label: 'Expand', icon: Maximize2 },
  { id: 'shorten', label: 'Shorten', icon: Minimize2 },
];

export default function InlineAIMenu({ editor }) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const menuRef = useRef(null);
  const resultRef = useRef(null);

  // Listen to editor selection changes
  useEffect(() => {
    if (!editor) return;

    const handleSelectionUpdate = () => {
      const { from, to } = editor.state.selection;
      const hasSelection = from !== to;
      const hasApiKey = !!getApiKey();

      if (hasSelection && hasApiKey && !loading) {
        // Get selection coordinates
        const { view } = editor;
        const start = view.coordsAtPos(from);
        const end = view.coordsAtPos(to);

        setPosition({
          top: Math.min(start.top, end.top) - 45,
          left: (start.left + end.left) / 2,
        });
        setVisible(true);
      } else if (!hasSelection) {
        if (!loading && !result) {
          setVisible(false);
        }
      }
    };

    editor.on('selectionUpdate', handleSelectionUpdate);
    return () => editor.off('selectionUpdate', handleSelectionUpdate);
  }, [editor, loading, result]);

  const getSelectedText = useCallback(() => {
    if (!editor) return '';
    const { from, to } = editor.state.selection;
    return editor.state.doc.textBetween(from, to, ' ');
  }, [editor]);

  const handleAction = useCallback(async (actionId) => {
    const text = getSelectedText();
    if (!text.trim()) return;

    setLoading(true);
    setResult('');
    setError('');

    try {
      const onChunk = (partial) => setResult(partial);
      switch (actionId) {
        case 'summarize': await summarize(text, onChunk); break;
        case 'rewrite': await paraphrase(text, onChunk); break;
        case 'grammar': await checkGrammar(text, onChunk); break;
        case 'translate': await translate(text, 'auto', 'en', onChunk); break;
        case 'expand': await expandText(text, onChunk); break;
        case 'shorten': await shortenText(text, onChunk); break;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getSelectedText]);

  const handleApply = useCallback(() => {
    if (!editor || !result) return;
    editor.chain().focus().deleteSelection().insertContent(result).run();
    handleDismiss();
  }, [editor, result]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [result]);

  const handleDismiss = useCallback(() => {
    setVisible(false);
    setResult('');
    setError('');
    setLoading(false);
  }, []);

  if (!visible) return null;

  return (
    <div
      ref={menuRef}
      className="inline-ai-menu"
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
    >
      {/* Action buttons (show when no result) */}
      {!result && !loading && !error && (
        <div className="inline-ai-menu__actions">
          {ACTIONS.map(action => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                className="inline-ai-menu__btn"
                onClick={() => handleAction(action.id)}
                title={action.label}
              >
                <Icon size={14} />
              </button>
            );
          })}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="inline-ai-menu__loading">
          <Loader2 size={14} className="wt-spinner" />
          <span>Processing...</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="inline-ai-menu__error">
          <span>❌ {error}</span>
          <button onClick={handleDismiss}><X size={12} /></button>
        </div>
      )}

      {/* Result popup */}
      {result && !loading && (
        <div ref={resultRef} className="inline-ai-menu__result">
          <div className="inline-ai-menu__result-text">{result}</div>
          <div className="inline-ai-menu__result-actions">
            <button className="wt-action-btn wt-action-btn--primary" onClick={handleApply}>
              <Replace size={12} /> Apply
            </button>
            <button className="wt-action-btn" onClick={handleCopy}>
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button className="wt-action-btn" onClick={handleDismiss}>
              <X size={12} /> Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
