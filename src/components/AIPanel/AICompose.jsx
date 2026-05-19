// ========================================
// AI Compose — Generate content from prompts
// ========================================
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Send, Copy, Check, ArrowDownToLine, Loader2, AlertCircle,
  FileText, ListChecks, ChevronRight
} from 'lucide-react';
import { compose, continueWriting, generateOutline } from '../../services/ai';
import { useApp } from '../../contexts/AppContext';

export default function AICompose({ editor, isReady }) {
  const { t } = useTranslation();
  const { checkApiQuota, openPaywall, settings } = useApp();

  const CONTENT_TYPES = [
    { id: 'email', label: `📧 ${t('compose.types.email')}` },
    { id: 'blog', label: `📝 ${t('compose.types.blog')}` },
    { id: 'essay', label: `📄 ${t('compose.types.essay')}` },
    { id: 'report', label: `📊 ${t('compose.types.report')}` },
    { id: 'letter', label: `✉️ ${t('compose.types.letter')}` },
    { id: 'social', label: `📱 ${t('compose.types.social')}` },
    { id: 'story', label: `📖 ${t('compose.types.story')}` },
    { id: 'review', label: `⭐ ${t('compose.types.review')}` },
  ];

  const TONES = [
    { id: '', label: t('compose.auto') },
    { id: 'formal', label: 'Formal' },
    { id: 'friendly', label: t('ai.tones.friendly') },
    { id: 'professional', label: t('ai.tones.professional') },
    { id: 'creative', label: t('ai.tones.creative') },
  ];

  const LANGUAGES = [
    { id: 'auto', label: `🌐 ${t('compose.auto')}` },
    { id: 'en', label: `🇬🇧 ${t('language.en')}` },
    { id: 'vi', label: `🇻🇳 ${t('language.vi')}` },
  ];
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
      setError(t('compose.enterPrompt'));
      return;
    }

    const hasQuota = await checkApiQuota();
    if (!hasQuota) {
      openPaywall();
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
          setError(t('compose.writeFirst'));
          setLoading(false);
          return;
        }
        await continueWriting(text, onChunk);
      } else if (mode === 'outline') {
        await generateOutline(prompt, contentType, onChunk);
      } else {
        const persona = settings.activePersona || 'general';
        await compose(prompt, contentType, tone, language, onChunk, persona);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [mode, prompt, contentType, tone, language, editor, checkApiQuota, openPaywall, settings]);

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
          {t('compose.compose')}
        </button>
        <button
          className={`compose-mode-tab ${mode === 'continue' ? 'compose-mode-tab--active' : ''}`}
          onClick={() => { setMode('continue'); setResult(''); setError(''); }}
        >
          <ChevronRight size={14} />
          {t('compose.continue')}
        </button>
        <button
          className={`compose-mode-tab ${mode === 'outline' ? 'compose-mode-tab--active' : ''}`}
          onClick={() => { setMode('outline'); setResult(''); setError(''); }}
        >
          <ListChecks size={14} />
          {t('compose.outline')}
        </button>
      </div>

      {/* Prompt Input (for compose & outline) */}
      {mode !== 'continue' && (
        <div className="compose-field">
          <label className="compose-label">
            {mode === 'outline' ? t('compose.topicLabel') : t('compose.promptLabel')}
          </label>
          <textarea
            className="compose-textarea"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={
              mode === 'outline'
                ? t('compose.topicPlaceholder')
                : t('compose.promptPlaceholder')
            }
            rows={3}
          />
        </div>
      )}

      {/* Content Type */}
      {mode !== 'continue' && (
        <div className="compose-field">
          <label className="compose-label">{t('compose.contentType')}</label>
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
            <label className="compose-label">{t('compose.toneLabel')}</label>
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
            <label className="compose-label">{t('compose.languageLabel')}</label>
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
          💡 {t('compose.continueInfo')}
        </p>
      )}

      {/* Generate Button */}
      <button
        className="compose-generate-btn"
        onClick={handleGenerate}
        disabled={loading || !isReady}
      >
        {loading ? (
          <><Loader2 size={16} className="wt-spinner" /> {t('compose.generating')}</>
        ) : (
          <>
            {mode === 'compose' && <><Send size={16} /> {t('compose.generate')}</>}
            {mode === 'continue' && <><ChevronRight size={16} /> {t('compose.continueWriting')}</>}
            {mode === 'outline' && <><ListChecks size={16} /> {t('compose.generateOutline')}</>}
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
            <span className="wt-result__label">✨ {t('compose.generatedContent')}</span>
            <div className="wt-result__actions">
              <button className="wt-action-btn" onClick={handleCopy}>
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? t('compose.copied') : t('compose.copy')}
              </button>
              <button className="wt-action-btn wt-action-btn--primary" onClick={handleInsert}>
                <ArrowDownToLine size={13} />
                {t('compose.insert')}
              </button>
            </div>
          </div>
          <div className="wt-result__text">{result}</div>
        </div>
      )}
    </div>
  );
}
