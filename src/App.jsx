import { useState, useEffect, useCallback, useRef } from 'react';
import { PenLine, Sparkles, X, Eye, EyeOff, Key } from 'lucide-react';
import Editor from './components/Editor/Editor';
import AIPanel from './components/AIPanel/AIPanel';
import ThemeToggle from './components/ThemeToggle/ThemeToggle';
import { checkGroqStatus, getApiKey, setApiKey } from './services/groq';
import './App.css';

function SettingsModal({ isOpen, onClose, onSave }) {
  const [key, setKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setKey(getApiKey());
      setTestResult(null);
    }
  }, [isOpen]);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    // Temporarily save key to test
    const oldKey = getApiKey();
    setApiKey(key);
    const status = await checkGroqStatus();
    if (!status.running) {
      setApiKey(oldKey); // restore old key on failure
    }
    setTestResult(status);
    setTesting(false);
  };

  const handleSave = () => {
    setApiKey(key);
    onSave();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal fade-in" onClick={e => e.stopPropagation()}>
        <div className="settings-modal__header">
          <h2>⚙️ API Settings</h2>
          <button className="settings-modal__close" onClick={onClose}><X /></button>
        </div>
        <div className="settings-modal__body">
          <label className="settings-label">
            <Key size={14} />
            Groq API Key
          </label>
          <p className="settings-hint">
            Get a free API key from{' '}
            <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer">
              Groq Console →
            </a>
          </p>
          <div className="settings-input-group">
            <input
              type={showKey ? 'text' : 'password'}
              className="settings-input"
              value={key}
              onChange={e => setKey(e.target.value)}
              placeholder="gsk_..."
            />
            <button
              className="settings-input-toggle"
              onClick={() => setShowKey(!showKey)}
              title={showKey ? 'Hide key' : 'Show key'}
            >
              {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>

          {testResult && (
            <div className={`settings-test-result ${testResult.running ? 'success' : 'error'}`}>
              {testResult.running ? '✅ API key is valid! Connected to Groq.' : `❌ ${testResult.error}`}
            </div>
          )}

          <div className="settings-modal__actions">
            <button
              className="settings-btn settings-btn--secondary"
              onClick={handleTest}
              disabled={!key || testing}
            >
              {testing ? 'Testing...' : 'Test Connection'}
            </button>
            <button
              className="settings-btn settings-btn--primary"
              onClick={handleSave}
              disabled={!key}
            >
              Save Key
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [groqStatus, setGroqStatus] = useState({ running: false });
  const [showSettings, setShowSettings] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const editorRef = useRef(null);

  const checkStatus = useCallback(async () => {
    const status = await checkGroqStatus();
    setGroqStatus(status);
  }, []);

  // Check Groq status on mount
  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

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

      {/* Main Content */}
      <main className="app-main">
        <div className="editor-container">
          <Editor onEditorReady={handleEditorReady} />
        </div>

        <AIPanel
          editor={editorRef.current}
          groqStatus={groqStatus}
          onOpenSettings={() => setShowSettings(true)}
        />

        {/* Mobile overlay */}
        <div
          className={`mobile-overlay ${showAIPanel ? 'visible' : ''}`}
          onClick={() => setShowAIPanel(false)}
        />
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSave={checkStatus}
      />
    </div>
  );
}
