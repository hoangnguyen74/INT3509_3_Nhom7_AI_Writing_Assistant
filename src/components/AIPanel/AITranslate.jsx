// ========================================
// AI Translate — Multi-language translation
// ========================================
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Languages, ArrowRightLeft, Copy, Check, Replace,
  Loader2, AlertCircle
} from 'lucide-react';
import { translate, LANGUAGE_NAMES } from '../../services/ai';
import { useApp } from '../../contexts/AppContext';

const LANGUAGES = [
  { id: 'auto', label: '🔍 Auto Detect', flag: '🔍' },
  { id: 'en', label: '🇬🇧 English', flag: '🇬🇧' },
  { id: 'vi', label: '🇻🇳 Vietnamese', flag: '🇻🇳' },
  { id: 'ja', label: '🇯🇵 Japanese', flag: '🇯🇵' },
  { id: 'ko', label: '🇰🇷 Korean', flag: '🇰🇷' },
  { id: 'zh', label: '🇨🇳 Chinese', flag: '🇨🇳' },
  { id: 'fr', label: '🇫🇷 French', flag: '🇫🇷' },
  { id: 'es', label: '🇪🇸 Spanish', flag: '🇪🇸' },
  { id: 'de', label: '🇩🇪 German', flag: '🇩🇪' },
  { id: 'pt', label: '🇧🇷 Portuguese', flag: '🇧🇷' },
  { id: 'ru', label: '🇷🇺 Russian', flag: '🇷🇺' },
  { id: 'th', label: '🇹🇭 Thai', flag: '🇹🇭' },
  { id: 'id', label: '🇮🇩 Indonesian', flag: '🇮🇩' },
];

export default function AITranslate({ editor, isReady }) {
  const { t } = useTranslation();
  const { checkApiQuota, openPaywall } = useApp();
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('en');
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

  const handleSwap = useCallback(() => {
    if (sourceLang === 'auto') return;
    const temp = sourceLang;
    setSourceLang(targetLang);
    setTargetLang(temp);
    setResult('');
  }, [sourceLang, targetLang]);

  const handleTranslate = useCallback(async () => {
    const text = getText();
    if (!text.trim()) {
      setError(t('translate.noText'));
      return;
    }
    if (sourceLang === targetLang && sourceLang !== 'auto') {
      setError(t('translate.sameLang'));
      return;
    }

    setLoading(true);
    setResult('');
    setError('');

    try {
      await translate(text, sourceLang, targetLang, (partial) => setResult(partial));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [getText, sourceLang, targetLang]);

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
    <div className="ai-translate">
      {/* Language Selectors */}
      <div className="translate-langs">
        <div className="translate-lang-field">
          <label className="compose-label">{t('translate.from')}</label>
          <select
            className="compose-select"
            value={sourceLang}
            onChange={(e) => { setSourceLang(e.target.value); setResult(''); }}
          >
            {LANGUAGES.map(l => (
              <option key={l.id} value={l.id}>{l.label}</option>
            ))}
          </select>
        </div>

        <button
          className="translate-swap-btn"
          onClick={handleSwap}
          disabled={sourceLang === 'auto'}
          title={t('translate.swapLanguages')}
        >
          <ArrowRightLeft size={16} />
        </button>

        <div className="translate-lang-field">
          <label className="compose-label">{t('translate.to')}</label>
          <select
            className="compose-select"
            value={targetLang}
            onChange={(e) => { setTargetLang(e.target.value); setResult(''); }}
          >
            {LANGUAGES.filter(l => l.id !== 'auto').map(l => (
              <option key={l.id} value={l.id}>{l.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Translate Button */}
      <button
        className="compose-generate-btn"
        onClick={handleTranslate}
        disabled={loading || !isReady}
      >
        {loading ? (
          <><Loader2 size={16} className="wt-spinner" /> {t('translate.translating')}</>
        ) : (
          <><Languages size={16} /> {t('translate.translate')}</>
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
            <span className="wt-result__label">
              🌐 {t('translate.translation')} ({LANGUAGE_NAMES[targetLang] || targetLang})
            </span>
            <div className="wt-result__actions">
              <button className="wt-action-btn" onClick={handleCopy}>
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? t('compose.copied') : t('compose.copy')}
              </button>
              <button className="wt-action-btn wt-action-btn--primary" onClick={handleApply}>
                <Replace size={13} />
                {t('translate.apply')}
              </button>
            </div>
          </div>
          <div className="wt-result__text">{result}</div>
        </div>
      )}

      {/* Hint */}
      {!loading && !result && !error && (
        <p className="wt-hint">
          💡 {t('translate.hint')}
        </p>
      )}
    </div>
  );
}
