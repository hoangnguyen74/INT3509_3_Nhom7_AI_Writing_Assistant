import { useState, useRef, useEffect } from 'react';
import { Link as LinkIcon, X, ExternalLink } from 'lucide-react';
import './LinkDialog.css';

export default function LinkDialog({ isOpen, onClose, onSubmit, initialUrl = '', initialText = '' }) {
  const [url, setUrl] = useState(initialUrl);
  const [text, setText] = useState(initialText);
  const urlInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setUrl(initialUrl);
      setText(initialText);
      setTimeout(() => urlInputRef.current?.focus(), 50);
    }
  }, [isOpen, initialUrl, initialText]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    let finalUrl = url.trim();
    if (!/^https?:\/\//i.test(finalUrl) && !finalUrl.startsWith('mailto:')) {
      finalUrl = 'https://' + finalUrl;
    }
    onSubmit({ url: finalUrl, text: text.trim() });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="link-dialog-overlay" onClick={onClose}>
      <div className="link-dialog fade-in" onClick={e => e.stopPropagation()}>
        <div className="link-dialog__header">
          <LinkIcon size={16} />
          <span>Insert Link</span>
          <button className="link-dialog__close" onClick={onClose}><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="link-dialog__field">
            <label>URL</label>
            <input
              ref={urlInputRef}
              type="text"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://example.com"
            />
          </div>
          <div className="link-dialog__field">
            <label>Display text (optional)</label>
            <input
              type="text"
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Click here"
            />
          </div>
          <div className="link-dialog__actions">
            <button type="button" className="link-dialog__btn secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="link-dialog__btn primary" disabled={!url.trim()}>
              <ExternalLink size={14} /> Apply
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
