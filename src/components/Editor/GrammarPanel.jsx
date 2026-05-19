// ========================================
// Grammar Panel — Side panel listing all grammar issues
// ========================================
import { useTranslation } from 'react-i18next';
import {
  SpellCheck, Check, CheckCheck, X, Loader2, RefreshCw
} from 'lucide-react';
import './GrammarPanel.css';

export default function GrammarPanel({
  errors, isChecking, editor,
  onCheckNow, onFix, onFixAll, onDismiss, onClearAll, onClose,
}) {
  const { t } = useTranslation();
  const TYPE_LABELS = {
    grammar: t('grammar.types.grammar'),
    spelling: t('grammar.types.spelling'),
    punctuation: t('grammar.types.punctuation'),
    style: t('grammar.types.style'),
  };
  const handleScrollToError = (error) => {
    if (!editor) return;
    try {
      editor.commands.setTextSelection({ from: error.from, to: error.to });
      const dom = editor.view.domAtPos(error.from);
      dom?.node?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
    } catch { /* ignore if position is stale */ }
  };

  return (
    <div className="grammar-panel">
      <div className="grammar-panel__header">
        <div className="grammar-panel__title">
          <SpellCheck size={16} />
          <span>{t('grammar.title')}</span>
          {errors.length > 0 && (
            <span className="grammar-panel__count">{errors.length}</span>
          )}
        </div>
        <div className="grammar-panel__header-actions">
          <button
            className="grammar-panel__btn"
            onClick={onCheckNow}
            disabled={isChecking}
            title={t('grammar.checkNow')}
          >
            {isChecking ? <Loader2 size={14} className="wt-spinner" /> : <RefreshCw size={14} />}
          </button>
          {errors.length > 0 && (
            <button className="grammar-panel__btn grammar-panel__btn--fix-all" onClick={onFixAll} title={t('grammar.fixAll')}>
              <CheckCheck size={14} /> {t('grammar.fixAll')}
            </button>
          )}
          <button className="grammar-panel__btn" onClick={onClose} title="Close grammar panel">
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="grammar-panel__list">
        {errors.length === 0 && !isChecking && (
          <div className="grammar-panel__empty">
            <span>✅</span>
            <p>{t('grammar.noIssues')}</p>
            <small>{t('grammar.noIssuesHint')}</small>
          </div>
        )}

        {isChecking && errors.length === 0 && (
          <div className="grammar-panel__empty">
            <Loader2 size={20} className="wt-spinner" />
            <p>{t('grammar.checking')}</p>
          </div>
        )}

        {errors.map(error => (
          <div
            key={error.id}
            className="grammar-panel__item"
            onClick={() => handleScrollToError(error)}
          >
            <div className="grammar-panel__item-header">
              <span className={`grammar-panel__type-badge grammar-panel__type-badge--${error.type}`}>
                {TYPE_LABELS[error.type] || t('grammar.types.grammar')}
              </span>
            </div>
            <p className="grammar-panel__reason">{error.reason}</p>
            <div className="grammar-panel__diff">
              <del>{error.original}</del>
              <span>→</span>
              <ins>{error.replacement}</ins>
            </div>
            <div className="grammar-panel__item-actions">
              <button
                className="grammar-panel__action-btn grammar-panel__action-btn--fix"
                onClick={(e) => { e.stopPropagation(); onFix(error.id); }}
              >
                <Check size={12} /> {t('grammar.fix')}
              </button>
              <button
                className="grammar-panel__action-btn"
                onClick={(e) => { e.stopPropagation(); onDismiss(error.id); }}
              >
                <X size={12} /> {t('grammar.ignore')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
