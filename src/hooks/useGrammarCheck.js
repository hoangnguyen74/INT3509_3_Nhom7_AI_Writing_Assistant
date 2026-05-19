// ========================================
// useGrammarCheck — Orchestration hook for real-time grammar checking
// ========================================
import { useState, useCallback, useRef, useEffect } from 'react';
import { checkGrammarInline } from '../services/ai';
import { setGrammarDecorations, clearGrammarDecorations } from '../components/Editor/extensions/GrammarHighlight';

const DEBOUNCE_MS = 5000;
const MAX_PARAGRAPHS_PER_CHECK = 5;

function hashText(text) {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = ((h << 5) - h + text.charCodeAt(i)) | 0;
  }
  return h;
}

function extractParagraphs(doc) {
  const paragraphs = [];
  doc.descendants((node, pos) => {
    if (node.isTextblock && node.textContent.trim().length > 0) {
      paragraphs.push({
        text: node.textContent,
        from: pos + 1,
        to: pos + node.nodeSize - 1,
        hash: hashText(node.textContent),
      });
    }
  });
  return paragraphs;
}

export function useGrammarCheck(editor, enabled = true) {
  const [errors, setErrors] = useState([]);
  const [isChecking, setIsChecking] = useState(false);
  const checkedHashesRef = useRef(new Map());
  const debounceRef = useRef(null);
  const abortRef = useRef(null);
  const errorIdCounter = useRef(0);

  const checkNow = useCallback(async (checkApiQuota, openPaywall) => {
    if (!editor || !enabled) return;

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    const doc = editor.state.doc;
    const paragraphs = extractParagraphs(doc);

    const changed = paragraphs.filter(p => {
      const prev = checkedHashesRef.current.get(p.from);
      return prev !== p.hash;
    });

    if (changed.length === 0) return;

    setIsChecking(true);
    const toCheck = changed.slice(0, MAX_PARAGRAPHS_PER_CHECK);
    const newErrors = [];

    for (const para of toCheck) {
      if (abortRef.current.signal.aborted) break;

      if (checkApiQuota) {
        const hasQuota = await checkApiQuota();
        if (!hasQuota) {
          openPaywall?.();
          break;
        }
      }

      try {
        const results = await checkGrammarInline(para.text);

        checkedHashesRef.current.set(para.from, para.hash);

        for (const err of results) {
          const idx = para.text.indexOf(err.original);
          if (idx === -1) continue;

          const from = para.from + idx;
          const to = from + err.original.length;

          if (to <= editor.state.doc.content.size) {
            const currentText = editor.state.doc.textBetween(from, to, '');
            if (currentText !== err.original) continue;

            newErrors.push({
              id: `ge-${++errorIdCounter.current}`,
              from,
              to,
              original: err.original,
              replacement: err.replacement,
              reason: err.reason,
              type: err.type || 'grammar',
            });
          }
        }
      } catch {
        // skip failed paragraph
      }
    }

    setErrors(prev => {
      const checkedRanges = toCheck.map(p => ({ from: p.from, to: p.to }));
      const kept = prev.filter(e => !checkedRanges.some(r => e.from >= r.from && e.to <= r.to));
      return [...kept, ...newErrors];
    });

    setIsChecking(false);
  }, [editor, enabled]);

  // Update decorations whenever errors change
  useEffect(() => {
    if (!editor) return;
    if (errors.length > 0) {
      setGrammarDecorations(editor, errors);
    } else {
      clearGrammarDecorations(editor);
    }
  }, [editor, errors]);

  // Debounced trigger on editor updates
  const scheduleCheck = useCallback((checkApiQuota, openPaywall) => {
    if (!enabled) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      checkNow(checkApiQuota, openPaywall);
    }, DEBOUNCE_MS);
  }, [enabled, checkNow]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const acceptFix = useCallback((errorId) => {
    if (!editor) return;
    const error = errors.find(e => e.id === errorId);
    if (!error) return;

    const currentText = editor.state.doc.textBetween(error.from, error.to, '');
    if (currentText !== error.original) {
      setErrors(prev => prev.filter(e => e.id !== errorId));
      return;
    }

    editor.chain()
      .focus()
      .setTextSelection({ from: error.from, to: error.to })
      .deleteSelection()
      .insertContent(error.replacement)
      .run();

    setErrors(prev => prev.filter(e => e.id !== errorId));
  }, [editor, errors]);

  const acceptAll = useCallback(() => {
    const sorted = [...errors].sort((a, b) => b.from - a.from);
    for (const error of sorted) {
      const currentText = editor.state.doc.textBetween(error.from, error.to, '');
      if (currentText === error.original) {
        editor.chain()
          .focus()
          .setTextSelection({ from: error.from, to: error.to })
          .deleteSelection()
          .insertContent(error.replacement)
          .run();
      }
    }
    setErrors([]);
  }, [editor, errors]);

  const dismissError = useCallback((errorId) => {
    setErrors(prev => prev.filter(e => e.id !== errorId));
  }, []);

  const clearAll = useCallback(() => {
    setErrors([]);
    checkedHashesRef.current.clear();
    if (editor) clearGrammarDecorations(editor);
  }, [editor]);

  return {
    errors,
    isChecking,
    checkNow,
    scheduleCheck,
    acceptFix,
    acceptAll,
    dismissError,
    clearAll,
  };
}
