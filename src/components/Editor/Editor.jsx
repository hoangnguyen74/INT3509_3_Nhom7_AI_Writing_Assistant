import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import Toolbar from './Toolbar';
import './Editor.css';

const INITIAL_CONTENT = `<h2>Welcome to WriteAI ✨</h2>
<p>Start writing here, or paste your text to get started. Use the <strong>AI tools</strong> on the right panel to:</p>
<ul>
  <li><strong>Summarize</strong> — Get a concise summary of your text</li>
  <li><strong>Grammar Check</strong> — Find and fix grammatical errors</li>
  <li><strong>Tone Changer</strong> — Adjust the tone to formal, friendly, or professional</li>
</ul>
<p>Try it out! Select some text or use the full document for AI analysis. 🚀</p>`;

export default function Editor({ onEditorReady }) {
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
    content: INITIAL_CONTENT,
    onUpdate: () => {
      // onUpdate can be used for auto-save etc.
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
