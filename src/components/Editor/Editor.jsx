import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import { Image } from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { Link } from '@tiptap/extension-link';
import CharacterCount from '@tiptap/extension-character-count';
import { GrammarHighlight } from './extensions/GrammarHighlight';
import { useGrammarCheck } from '../../hooks/useGrammarCheck';
import { useApp } from '../../contexts/AppContext';
import { isAIConfigured } from '../../services/ai';
import Toolbar from './Toolbar';
import AIToolbar from './AIToolbar';
import DiffSuggestion from './DiffSuggestion';
import InlineAIMenu from './InlineAIMenu';
import FindReplace from './FindReplace';
import GrammarTooltip from './GrammarTooltip';
import GrammarPanel from './GrammarPanel';
import { SpellCheck } from 'lucide-react';
import './Editor.css';

export default function Editor({ initialContent, onEditorReady, onUpdate }) {
  const { t } = useTranslation();
  const { checkApiQuota, openPaywall } = useApp();
  const [wordCount, setWordCount] = useState({ words: 0, characters: 0, paragraphs: 0 });
  const [readingTime, setReadingTime] = useState(0);

  // AI Diff State
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [showFind, setShowFind] = useState(false);
  const [showGrammarPanel, setShowGrammarPanel] = useState(false);
  const [grammarEnabled, setGrammarEnabled] = useState(() => isAIConfigured());

  // Ctrl+F / Ctrl+H keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setShowFind(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
        e.preventDefault();
        setShowFind(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Placeholder.configure({
        placeholder: 'Start writing or paste your text here...',
      }),
      Highlight.configure({ multicolor: false }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Image.configure({
        inline: false,
        allowBase64: true,
      }),
      Table.configure({
        resizable: true,
        handleWidth: 5,
        cellMinWidth: 50,
        lastColumnResizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      CharacterCount,
      GrammarHighlight,
    ],
    content: initialContent || '<p></p>',
    editorProps: {
      handleKeyDown: (view, event) => {
        // Tab key handling — prevent focus from leaving editor
        if (event.key === 'Tab') {
          event.preventDefault();
          const { editor: ed } = view.state;
          // In a table: navigate to next/prev cell
          if (view.state.selection.$from.parent.type.name === 'tableCell' ||
              view.state.selection.$from.parent.type.name === 'tableHeader') {
            if (event.shiftKey) {
              // Try goToPreviousCell
              return false; // let tiptap table handle it
            }
            return false; // let tiptap table handle it
          }
          // In a list: indent/outdent
          // Otherwise: insert tab space
          const { state, dispatch } = view;
          const tr = state.tr.insertText('\t');
          dispatch(tr);
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      onUpdate?.(editor.getHTML());
      
      try {
        const words = editor?.storage?.characterCount?.words?.() || 0;
        const characters = editor?.storage?.characterCount?.characters?.() || 0;
        const docNodes = editor?.state?.doc?.content?.content || [];
        const paragraphs = docNodes.filter(
          (node) => node.type.name === 'paragraph' && node.textContent.trim().length > 0
        ).length;
        
        const stats = { words, characters, paragraphs };
        setWordCount(stats);
        setReadingTime(Math.max(1, Math.ceil(stats.words / 200)));
      } catch (err) {
        console.error('Word count stats error:', err);
      }
    },
    onCreate: ({ editor }) => {
      onEditorReady?.(editor);
    },
  });

  // Grammar check hook
  const grammar = useGrammarCheck(editor, grammarEnabled);

  // Schedule grammar check on editor updates
  useEffect(() => {
    if (!editor || !grammarEnabled) return;
    const handler = () => grammar.scheduleCheck(checkApiQuota, openPaywall);
    editor.on('update', handler);
    return () => editor.off('update', handler);
  }, [editor, grammarEnabled, grammar.scheduleCheck, checkApiQuota, openPaywall]);

  const handleAcceptAI = useCallback(() => {
    if (!editor || !aiResult) return;
    const finalResult = aiResult.includes('---') ? aiResult.split('---')[1].trim() : aiResult;

    const { from, to } = editor.state.selection;
    if (from !== to) {
      editor.chain().focus().deleteSelection().insertContent(finalResult).run();
    } else {
      editor.commands.setContent(`<p>${finalResult.replace(/\n/g, '</p><p>')}</p>`);
    }
    setAiResult('');
  }, [editor, aiResult]);

  const handleRejectAI = useCallback(() => {
    setAiResult('');
    setAiLoading(false);
    setAiError('');
  }, []);

  return (
    <div className="editor-layout">
      <div className="editor-toolbar-wrapper">
        <Toolbar editor={editor} />
        <AIToolbar 
           editor={editor} 
           onResult={setAiResult} 
           onLoading={setAiLoading} 
           onError={setAiError} 
        />
      </div>

      <div className="editor-content-wrapper">
        <FindReplace editor={editor} isOpen={showFind} onClose={() => setShowFind(false)} />
        <InlineAIMenu editor={editor} />
        <GrammarTooltip
          editor={editor}
          errors={grammar.errors}
          onFix={grammar.acceptFix}
          onDismiss={grammar.dismissError}
        />
        <EditorContent editor={editor} className="editor-content" />

        <DiffSuggestion
           result={aiResult}
           loading={aiLoading}
           error={aiError}
           onAccept={handleAcceptAI}
           onReject={handleRejectAI}
        />

        {showGrammarPanel && (
          <GrammarPanel
            errors={grammar.errors}
            isChecking={grammar.isChecking}
            editor={editor}
            onCheckNow={() => grammar.checkNow(checkApiQuota, openPaywall)}
            onFix={grammar.acceptFix}
            onFixAll={grammar.acceptAll}
            onDismiss={grammar.dismissError}
            onClearAll={grammar.clearAll}
            onClose={() => setShowGrammarPanel(false)}
          />
        )}
      </div>

      <div className="editor-statusbar">
        <div className="statusbar-info">
          <span>{wordCount.words} {t('editor.words')}</span>
          <span>{wordCount.characters} {t('editor.characters')}</span>
          <span>{wordCount.paragraphs} {t('editor.paragraphs')}</span>
          <span>~{readingTime} {t('editor.minRead')}</span>
        </div>
        <div className="statusbar-right">
          <button
            className={`statusbar-grammar-btn ${grammarEnabled ? 'statusbar-grammar-btn--active' : ''}`}
            onClick={() => {
              const next = !grammarEnabled;
              setGrammarEnabled(next);
              setShowGrammarPanel(next);
              if (!next) grammar.clearAll();
            }}
            title={grammarEnabled ? 'Disable grammar check' : 'Enable grammar check'}
          >
            <SpellCheck size={13} />
            {grammar.errors.length > 0 && (
              <span className="statusbar-grammar-count">{grammar.errors.length}</span>
            )}
          </button>
          <span className="statusbar-shortcut" title="Auto-save">{t('editor.autoSave')}</span>
          <span>WriteAI</span>
        </div>
      </div>
    </div>
  );
}

