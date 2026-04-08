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
import Toolbar from './Toolbar';
import InlineAIMenu from './InlineAIMenu';
import './Editor.css';

export default function Editor({ initialContent, onEditorReady, onUpdate }) {
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
    ],
    content: initialContent || '<p></p>',
    onUpdate: ({ editor }) => {
      onUpdate?.(editor.getHTML());
    },
    onCreate: ({ editor }) => {
      onEditorReady?.(editor);
    },
  });

  // Pass editor up when it's ready
  if (editor && onEditorReady) {
    onEditorReady(editor);
  }

  const textContent = editor ? editor.state.doc.textContent : '';
  const wordCount = textContent.split(/\s+/).filter(Boolean).length;
  const charCount = textContent.length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));
  const paragraphCount = editor
    ? editor.state.doc.content.content.filter(
        (node) => node.type.name === 'paragraph' && node.textContent.trim().length > 0
      ).length
    : 0;

  return (
    <div className="editor-wrapper">
      <Toolbar editor={editor} />
      <div className="editor-content">
        <EditorContent editor={editor} />
        <InlineAIMenu editor={editor} />
      </div>
      <div className="editor-statusbar">
        <div className="statusbar-info">
          <span>{wordCount} words</span>
          <span>{charCount} characters</span>
          <span>{paragraphCount} paragraphs</span>
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

