// ========================================
// Grammar Tooltip — Hover tooltip for grammar errors
// ========================================
import { useState, useEffect, useCallback, useRef } from 'react';
import { Check, X } from 'lucide-react';
import './GrammarTooltip.css';

const TYPE_LABELS = {
  grammar: 'Grammar',
  spelling: 'Spelling',
  punctuation: 'Punctuation',
  style: 'Style',
};

export default function GrammarTooltip({ editor, errors, onFix, onDismiss }) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [activeError, setActiveError] = useState(null);
  const tooltipRef = useRef(null);
  const hideTimer = useRef(null);

  const cancelHide = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  }, []);

  const scheduleHide = useCallback(() => {
    cancelHide();
    hideTimer.current = setTimeout(() => {
      setVisible(false);
      setActiveError(null);
    }, 300);
  }, [cancelHide]);

  const handleMouseOver = useCallback((e) => {
    const errorEl = e.target.closest('.grammar-error');
    if (!errorEl) return;

    cancelHide();

    const errorId = errorEl.getAttribute('data-error-id');
    const error = errors.find(err => err.id === errorId);
    if (!error) return;

    const rect = errorEl.getBoundingClientRect();
    const editorRect = editor.view.dom.closest('.editor-content-wrapper')?.getBoundingClientRect();
    if (!editorRect) return;

    setPosition({
      top: rect.bottom - editorRect.top + 2,
      left: rect.left - editorRect.left,
    });
    setActiveError(error);
    setVisible(true);
  }, [editor, errors, cancelHide]);

  const handleMouseOut = useCallback((e) => {
    const relatedTarget = e.relatedTarget;
    if (tooltipRef.current?.contains(relatedTarget)) return;
    if (relatedTarget?.closest('.grammar-error')) return;
    scheduleHide();
  }, [scheduleHide]);

  useEffect(() => {
    if (!editor?.view?.dom) return;
    const dom = editor.view.dom;
    dom.addEventListener('mouseover', handleMouseOver);
    dom.addEventListener('mouseout', handleMouseOut);
    return () => {
      dom.removeEventListener('mouseover', handleMouseOver);
      dom.removeEventListener('mouseout', handleMouseOut);
      cancelHide();
    };
  }, [editor, handleMouseOver, handleMouseOut, cancelHide]);

  if (!visible || !activeError) return null;

  return (
    <div
      ref={tooltipRef}
      className="grammar-tooltip"
      style={{ top: `${position.top}px`, left: `${position.left}px` }}
      onMouseEnter={cancelHide}
      onMouseLeave={scheduleHide}
    >
      <div className="grammar-tooltip__header">
        <span className={`grammar-tooltip__badge grammar-tooltip__badge--${activeError.type}`}>
          {TYPE_LABELS[activeError.type] || 'Grammar'}
        </span>
      </div>
      <p className="grammar-tooltip__reason">{activeError.reason}</p>
      <div className="grammar-tooltip__suggestion">
        <del>{activeError.original}</del>
        <span className="grammar-tooltip__arrow">→</span>
        <ins>{activeError.replacement}</ins>
      </div>
      <div className="grammar-tooltip__actions">
        <button className="grammar-tooltip__fix-btn" onClick={() => { onFix(activeError.id); setVisible(false); }}>
          <Check size={12} /> Fix
        </button>
        <button className="grammar-tooltip__dismiss-btn" onClick={() => { onDismiss(activeError.id); setVisible(false); }}>
          <X size={12} /> Ignore
        </button>
      </div>
    </div>
  );
}
