import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
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

  const wordCount = editor
    ? editor.state.doc.textContent.split(/\s+/).filter(Boolean).length
    : 0;
  const charCount = editor ? editor.state.doc.textContent.length : 0;

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
        </div>
        <span>WriteAI Editor</span>
      </div>
    </div>
  );
}
