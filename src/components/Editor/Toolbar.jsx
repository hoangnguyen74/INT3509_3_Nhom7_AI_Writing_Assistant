import {
  Bold, Italic, Underline as UnderlineIcon, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Highlighter, Undo2, Redo2, RemoveFormatting,
} from 'lucide-react';

export default function Toolbar({ editor }) {
  if (!editor) return null;

  const tools = [
    {
      group: 'history',
      items: [
        { icon: <Undo2 />, action: () => editor.chain().focus().undo().run(), active: false, title: 'Undo' },
        { icon: <Redo2 />, action: () => editor.chain().focus().redo().run(), active: false, title: 'Redo' },
      ]
    },
    {
      group: 'text',
      items: [
        { icon: <Bold />, action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive('bold'), title: 'Bold' },
        { icon: <Italic />, action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive('italic'), title: 'Italic' },
        { icon: <UnderlineIcon />, action: () => editor.chain().focus().toggleUnderline().run(), active: editor.isActive('underline'), title: 'Underline' },
        { icon: <Highlighter />, action: () => editor.chain().focus().toggleHighlight().run(), active: editor.isActive('highlight'), title: 'Highlight' },
      ]
    },
    {
      group: 'heading',
      items: [
        { icon: <Heading1 />, action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(), active: editor.isActive('heading', { level: 1 }), title: 'Heading 1' },
        { icon: <Heading2 />, action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive('heading', { level: 2 }), title: 'Heading 2' },
        { icon: <Heading3 />, action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: editor.isActive('heading', { level: 3 }), title: 'Heading 3' },
      ]
    },
    {
      group: 'list',
      items: [
        { icon: <List />, action: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive('bulletList'), title: 'Bullet List' },
        { icon: <ListOrdered />, action: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive('orderedList'), title: 'Ordered List' },
        { icon: <Quote />, action: () => editor.chain().focus().toggleBlockquote().run(), active: editor.isActive('blockquote'), title: 'Blockquote' },
      ]
    },
    {
      group: 'clear',
      items: [
        { icon: <RemoveFormatting />, action: () => editor.chain().focus().clearNodes().unsetAllMarks().run(), active: false, title: 'Clear Formatting' },
      ]
    }
  ];

  return (
    <div className="editor-toolbar">
      {tools.map((group, gi) => (
        <div key={group.group} style={{ display: 'flex', alignItems: 'center' }}>
          {gi > 0 && <div className="toolbar-divider" />}
          <div className="toolbar-group">
            {group.items.map((tool, ti) => (
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
      ))}
    </div>
  );
}
