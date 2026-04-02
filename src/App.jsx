import { useState, useEffect, useCallback, useRef } from 'react';
import { PenLine, Sparkles, WifiOff } from 'lucide-react';
import Editor from './components/Editor/Editor';
import AIPanel from './components/AIPanel/AIPanel';
import ThemeToggle from './components/ThemeToggle/ThemeToggle';
import { checkOllamaStatus } from './services/ollama';
import './App.css';

export default function App() {
  const [ollamaStatus, setOllamaStatus] = useState({ running: false, models: [] });
  const [showAIPanel, setShowAIPanel] = useState(false);
  const editorRef = useRef(null);

  // Check Ollama status on mount and periodically
  useEffect(() => {
    const check = async () => {
      const status = await checkOllamaStatus();
      setOllamaStatus(status);
    };
    check();
    const interval = setInterval(check, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, []);

  // Set initial theme
  useEffect(() => {
    const saved = localStorage.getItem('writeai-theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  const handleEditorReady = useCallback((editor) => {
    editorRef.current = editor;
  }, []);

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="app-logo">
          <div className="app-logo__icon">
            <PenLine />
          </div>
          <h1 className="app-logo__text">
            Write<span>AI</span>
          </h1>
        </div>
        <div className="app-header__actions">
          <ThemeToggle />
          <button
            className="mobile-ai-toggle"
            onClick={() => setShowAIPanel(!showAIPanel)}
            title="Toggle AI Panel"
          >
            <Sparkles />
          </button>
        </div>
      </header>

      {/* Connection warning banner */}
      {!ollamaStatus.running && (
        <div className="connection-banner">
          <WifiOff />
          <span>Ollama is not running. Start Ollama to use AI features.</span>
        </div>
      )}

      {/* Main Content */}
      <main className="app-main">
        <div className="editor-container">
          <Editor onEditorReady={handleEditorReady} />
        </div>

        <AIPanel
          editor={editorRef.current}
          ollamaStatus={ollamaStatus}
        />

        {/* Mobile overlay */}
        <div
          className={`mobile-overlay ${showAIPanel ? 'visible' : ''}`}
          onClick={() => setShowAIPanel(false)}
        />
      </main>
    </div>
  );
}
