import { useState, useCallback, useEffect } from 'react';
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
import Toolbar from './Toolbar';
import AIToolbar from './AIToolbar';
import DiffSuggestion from './DiffSuggestion';
import InlineAIMenu from './InlineAIMenu';
import FindReplace from './FindReplace';
import './Editor.css';

export default function Editor({ initialContent, onEditorReady, onUpdate }) {
  const [wordCount, setWordCount] = useState({ words: 0, characters: 0, paragraphs: 0 });
  const [readingTime, setReadingTime] = useState(0);

  // AI Diff State
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [showFind, setShowFind] = useState(false);

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
    ],
    content: initialContent || '<p></p>',
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
        <EditorContent editor={editor} className="editor-content" />
        
        <DiffSuggestion
           result={aiResult}
           loading={aiLoading}
           error={aiError}
           onAccept={handleAcceptAI}
           onReject={handleRejectAI}
        />
      </div>

      <div className="editor-statusbar">
        <div className="statusbar-info">
          <span>{wordCount.words} words</span>
          <span>{wordCount.characters} characters</span>
          <span>{wordCount.paragraphs} paragraphs</span>
          <span>~{readingTime} min read</span>
        </div>
        <div className="statusbar-right">
          <span className="statusbar-shortcut" title="Auto-save is enabled">Auto-save ✓</span>
          <span>WriteAI</span>
        </div>
      </div>
    </div>
  );
}

