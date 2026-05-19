import { useMemo } from 'react';
import { marked } from 'marked';
import './MarkdownContent.css';

marked.setOptions({ breaks: true, gfm: true });

export default function MarkdownContent({ text, className = '' }) {
  const html = useMemo(() => marked.parse(text || ''), [text]);
  return (
    <div
      className={`markdown-content ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
