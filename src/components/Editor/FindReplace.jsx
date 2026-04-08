// ========================================
// Find & Replace — Search within editor
// ========================================
import { useState, useCallback, useEffect, useRef } from 'react';
import { Search, Replace, X, ChevronUp, ChevronDown, ArrowDownUp } from 'lucide-react';
import './FindReplace.css';

export default function FindReplace({ editor, isOpen, onClose }) {
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [showReplace, setShowReplace] = useState(false);
  const [matches, setMatches] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const findInputRef = useRef(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && findInputRef.current) {
      findInputRef.current.focus();
      findInputRef.current.select();
    }
  }, [isOpen]);

  // Clear highlights on close
  useEffect(() => {
    if (!isOpen && editor) {
      clearHighlights();
    }
  }, [isOpen]);

  const clearHighlights = useCallback(() => {
    if (!editor) return;
    // Remove all find highlights
    editor.commands.unsetHighlight();
  }, [editor]);

  const findAll = useCallback(() => {
    if (!editor || !findText) {
      setMatches([]);
      setCurrentIndex(-1);
      clearHighlights();
      return;
    }

    const doc = editor.state.doc;
    const text = doc.textContent;
    const searchText = caseSensitive ? findText : findText.toLowerCase();
    const docText = caseSensitive ? text : text.toLowerCase();
    
    const positions = [];
    let idx = 0;
    while (idx < docText.length) {
      const found = docText.indexOf(searchText, idx);
      if (found === -1) break;
      
      // Map text offset to doc position
      let charCount = 0;
      let from = 0;
      doc.descendants((node, pos) => {
        if (node.isText) {
          const start = charCount;
          const end = charCount + node.text.length;
          if (from === 0 && found >= start && found < end) {
            from = pos + (found - start);
          }
          charCount = end;
        }
      });
      
      if (from > 0) {
        positions.push({ from, to: from + findText.length, textOffset: found });
      }
      idx = found + 1;
    }
    
    setMatches(positions);
    if (positions.length > 0) {
      setCurrentIndex(0);
      goToMatch(positions[0]);
    } else {
      setCurrentIndex(-1);
    }
  }, [editor, findText, caseSensitive]);

  // Re-search when findText or caseSensitive changes
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(findAll, 200);
      return () => clearTimeout(timer);
    }
  }, [findText, caseSensitive, isOpen]);

  const goToMatch = useCallback((match) => {
    if (!editor || !match) return;
    // Set selection WITHOUT stealing focus from find input
    const tr = editor.state.tr.setSelection(
      editor.state.selection.constructor.create(editor.state.doc, match.from, match.to)
    );
    editor.view.dispatch(tr);
    // Scroll into view
    const domAtPos = editor.view.domAtPos(match.from);
    if (domAtPos?.node) {
      const el = domAtPos.node.nodeType === 3 ? domAtPos.node.parentElement : domAtPos.node;
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    // Keep focus on find input
    setTimeout(() => findInputRef.current?.focus(), 0);
  }, [editor]);

  const goNext = useCallback(() => {
    if (matches.length === 0) return;
    const next = (currentIndex + 1) % matches.length;
    setCurrentIndex(next);
    goToMatch(matches[next]);
  }, [matches, currentIndex, goToMatch]);

  const goPrev = useCallback(() => {
    if (matches.length === 0) return;
    const prev = (currentIndex - 1 + matches.length) % matches.length;
    setCurrentIndex(prev);
    goToMatch(matches[prev]);
  }, [matches, currentIndex, goToMatch]);

  const replaceOne = useCallback(() => {
    if (!editor || currentIndex < 0 || !matches[currentIndex]) return;
    const match = matches[currentIndex];
    editor.chain().focus()
      .setTextSelection({ from: match.from, to: match.to })
      .deleteSelection()
      .insertContent(replaceText)
      .run();
    // Re-search after replace
    setTimeout(findAll, 50);
  }, [editor, matches, currentIndex, replaceText, findAll]);

  const replaceAll = useCallback(() => {
    if (!editor || matches.length === 0) return;
    // Replace from end to start to preserve positions
    const sorted = [...matches].sort((a, b) => b.from - a.from);
    const chain = editor.chain();
    for (const match of sorted) {
      chain.setTextSelection({ from: match.from, to: match.to })
        .deleteSelection()
        .insertContent(replaceText);
    }
    chain.run();
    setTimeout(findAll, 50);
  }, [editor, matches, replaceText, findAll]);

  // Keyboard: Enter=next, Shift+Enter=prev, Escape=close
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      goNext();
    } else if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      goPrev();
    }
  }, [onClose, goNext, goPrev]);

  if (!isOpen) return null;

  return (
    <div className="find-replace fade-in">
      <div className="find-replace__row">
        <div className="find-replace__input-group">
          <Search size={14} />
          <input
            ref={findInputRef}
            type="text"
            placeholder="Find..."
            value={findText}
            onChange={e => setFindText(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            className={`find-replace__toggle ${caseSensitive ? 'active' : ''}`}
            onClick={() => setCaseSensitive(!caseSensitive)}
            title="Case sensitive"
          >
            Aa
          </button>
        </div>
        <span className="find-replace__count">
          {matches.length > 0 ? `${currentIndex + 1}/${matches.length}` : findText ? 'No results' : ''}
        </span>
        <button className="find-replace__nav" onClick={goPrev} title="Previous (Shift+Enter)"><ChevronUp size={16} /></button>
        <button className="find-replace__nav" onClick={goNext} title="Next (Enter)"><ChevronDown size={16} /></button>
        <button
          className="find-replace__nav"
          onClick={() => setShowReplace(!showReplace)}
          title="Toggle Replace"
        >
          <ArrowDownUp size={14} />
        </button>
        <button className="find-replace__close" onClick={onClose}><X size={16} /></button>
      </div>
      
      {showReplace && (
        <div className="find-replace__row">
          <div className="find-replace__input-group">
            <Replace size={14} />
            <input
              type="text"
              placeholder="Replace with..."
              value={replaceText}
              onChange={e => setReplaceText(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <button className="find-replace__action" onClick={replaceOne} disabled={currentIndex < 0}>
            Replace
          </button>
          <button className="find-replace__action" onClick={replaceAll} disabled={matches.length === 0}>
            All
          </button>
        </div>
      )}
    </div>
  );
}
