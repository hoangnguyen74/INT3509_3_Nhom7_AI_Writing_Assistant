// ========================================
// Inline AI Menu — Floating action menu on text selection
// ========================================
import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileText, RefreshCw, Languages, Maximize2, Minimize2,
  SpellCheck, Copy, Check, Replace, X, Loader2
} from 'lucide-react';
import {
  summarize, paraphrase, translate, expandText,
  shortenText, checkGrammar, isAIConfigured, cleanAIOutput
} from '../../services/ai';
import MarkdownContent from '../common/MarkdownContent';
import './InlineAIMenu.css';

export default function InlineAIMenu({ editor }) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  const ACTIONS = [
    { id: 'summarize', label: t('inline.summarize'), icon: FileText },
    { id: 'rewrite', label: t('inline.rewrite'), icon: RefreshCw },
    { id: 'grammar', label: t('inline.grammar'), icon: SpellCheck },
    { id: 'translate', label: t('inline.translate'), icon: Languages },
    { id: 'expand', label: t('inline.expand'), icon: Maximize2 },
    { id: 'shorten', label: t('inline.shorten'), icon: Minimize2 },
  ];
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
      const hasApiKey = isAIConfigured();

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
    const cleaned = cleanAIOutput(result, 'text-only');
    editor.chain().focus().deleteSelection().insertContent(cleaned).run();
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
          <span>{t('chat.processing')}</span>
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
          <MarkdownContent text={cleanAIOutput(result, 'text-only')} className="inline-ai-menu__result-text" />
          <div className="inline-ai-menu__result-actions">
            <button className="wt-action-btn wt-action-btn--primary" onClick={handleApply}>
              <Replace size={12} /> {t('inline.apply')}
            </button>
            <button className="wt-action-btn" onClick={handleCopy}>
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? t('compose.copied') : t('compose.copy')}
            </button>
            <button className="wt-action-btn" onClick={handleDismiss}>
              <X size={12} /> {t('inline.dismiss')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
