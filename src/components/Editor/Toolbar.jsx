import { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bold, Italic, Underline as UnderlineIcon, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Highlighter, Undo2, Redo2, RemoveFormatting,
  Image as ImageIcon, Link as LinkIcon, CheckSquare, Code,
  Table as TableIcon, Columns, Rows, Trash2, Unlink
} from 'lucide-react';
import LinkDialog from './LinkDialog';
import './Toolbar.css'; // Let's add a specific css file for Toolbar if needed or use Editor.css

export default function Toolbar({ editor }) {
  const { t } = useTranslation();
  const fileInputRef = useRef(null);
  const [showLinkDialog, setShowLinkDialog] = useState(false);

  if (!editor) return null;

  const openLinkDialog = useCallback(() => {
    setShowLinkDialog(true);
  }, []);

  const handleLinkSubmit = useCallback(({ url, text }) => {
    if (!editor) return;
    
    const { from, to } = editor.state.selection;
    const hasSelection = from !== to;
    
    if (text && !hasSelection) {
      // No selection + display text: insert text with link
      editor.chain().focus()
        .insertContent(`<a href="${url}">${text}</a>`)
        .run();
    } else if (hasSelection) {
      // Has selection: wrap it in a link
      editor.chain().focus()
        .extendMarkRange('link')
        .setLink({ href: url })
        .run();
    } else {
      // No selection, no text: insert URL as both text and link
      editor.chain().focus()
        .insertContent(`<a href="${url}">${url}</a>`)
        .run();
    }
  }, [editor]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        editor.chain().focus().setImage({ src: event.target.result }).run();
      };
      reader.readAsDataURL(file);
    }
    // reset input
    e.target.value = '';
  };

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const tools = [
    {
      group: 'history',
      items: [
        { icon: <Undo2 />, action: () => editor.chain().focus().undo().run(), active: false, title: t('toolbar.undo') },
        { icon: <Redo2 />, action: () => editor.chain().focus().redo().run(), active: false, title: t('toolbar.redo') },
      ]
    },
    {
      group: 'text',
      items: [
        { icon: <Bold />, action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive('bold'), title: t('toolbar.bold') },
        { icon: <Italic />, action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive('italic'), title: t('toolbar.italic') },
        { icon: <UnderlineIcon />, action: () => editor.chain().focus().toggleUnderline().run(), active: editor.isActive('underline'), title: t('toolbar.underline') },
        { icon: <Highlighter />, action: () => editor.chain().focus().toggleHighlight().run(), active: editor.isActive('highlight'), title: t('toolbar.highlight') },
        { icon: <LinkIcon />, action: openLinkDialog, active: editor.isActive('link'), title: t('toolbar.link') },
        { icon: <Unlink />, action: () => editor.chain().focus().unsetLink().run(), active: false, title: 'Unlink', visible: editor.isActive('link') },
      ]
    },
    {
      group: 'heading',
      items: [
        { icon: <Heading1 />, action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), active: editor.isActive('heading', { level: 1 }), title: t('toolbar.h1') },
        { icon: <Heading2 />, action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive('heading', { level: 2 }), title: t('toolbar.h2') },
        { icon: <Heading3 />, action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: editor.isActive('heading', { level: 3 }), title: t('toolbar.h3') },
      ]
    },
    {
      group: 'list',
      items: [
        { icon: <List />, action: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive('bulletList'), title: t('toolbar.bulletList') },
        { icon: <ListOrdered />, action: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive('orderedList'), title: t('toolbar.orderedList') },
        { icon: <CheckSquare />, action: () => editor.chain().focus().toggleTaskList().run(), active: editor.isActive('taskList'), title: t('toolbar.taskList') },
        { icon: <Quote />, action: () => editor.chain().focus().toggleBlockquote().run(), active: editor.isActive('blockquote'), title: t('toolbar.blockquote') },
        { icon: <Code />, action: () => editor.chain().focus().toggleCodeBlock().run(), active: editor.isActive('codeBlock'), title: t('toolbar.codeBlock') },
      ]
    },
    {
      group: 'insert',
      items: [
        { icon: <ImageIcon />, action: () => fileInputRef.current?.click(), active: false, title: t('toolbar.image') },
        { icon: <TableIcon />, action: insertTable, active: editor.isActive('table'), title: t('toolbar.insertTable') },
      ]
    },
    {
      group: 'clear',
      items: [
        { icon: <RemoveFormatting />, action: () => editor.chain().focus().clearNodes().unsetAllMarks().run(), active: false, title: t('toolbar.clearFormatting') },
      ]
    }
  ];

  const tableControls = editor.isActive('table') ? [
    { icon: <Columns strokeWidth={1.5} />, action: () => editor.chain().focus().addColumnAfter().run(), title: 'Add Column' },
    { icon: <Rows strokeWidth={1.5} />, action: () => editor.chain().focus().addRowAfter().run(), title: 'Add Row' },
    { icon: <Trash2 strokeWidth={1.5} />, action: () => editor.chain().focus().deleteTable().run(), title: t('toolbar.deleteTable'), danger: true },
  ] : [];

  return (
    <div className="editor-toolbar-container">
      <div className="editor-toolbar">
        {tools.map((group, gi) => {
          // Filter out invisible items (like Unlink when no link is active)
          const visibleItems = group.items.filter(item => item.visible !== false);
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.group} style={{ display: 'flex', alignItems: 'center' }}>
              {gi > 0 && <div className="toolbar-divider" />}
              <div className="toolbar-group">
                {visibleItems.map((tool, ti) => (
                  <button
                    key={ti}
                    className={`toolbar-btn ${tool.active ? 'active' : ''}`}
                    onClick={tool.action}
                    title={tool.title}
                    type="button"
                  >
                    {tool.icon}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Dynamic Table Controls (appears below main toolbar when table is active) */}
      {tableControls.length > 0 && (
        <div className="editor-toolbar-secondary fade-in">
          <span className="toolbar-label">{t('toolbar.table')}</span>
          <div className="toolbar-group">
            {tableControls.map((btn, i) => (
              <button
                key={i}
                className={`toolbar-btn ${btn.danger ? 'danger' : ''}`}
                onClick={btn.action}
                title={btn.title}
                type="button"
              >
                {btn.icon} <span>{btn.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Hidden file input for Base64 image upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        style={{ display: 'none' }}
      />

      {/* Link Dialog */}
      <LinkDialog
        isOpen={showLinkDialog}
        onClose={() => setShowLinkDialog(false)}
        onSubmit={handleLinkSubmit}
        initialUrl={editor.isActive('link') ? editor.getAttributes('link').href : ''}
        initialText=""
      />
    </div>
  );
}
