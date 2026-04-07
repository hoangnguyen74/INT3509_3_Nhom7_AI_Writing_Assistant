import { useState, useEffect, useCallback, useRef } from 'react';
import { PenLine, Sparkles, Menu, X, Eye, EyeOff, Key } from 'lucide-react';
import { AppProvider, useApp } from './contexts/AppContext';
import AuthPage from './pages/AuthPage';
import OnboardingFlow from './components/Onboarding/OnboardingFlow';
import Sidebar from './components/Sidebar/Sidebar';
import Editor from './components/Editor/Editor';
import AIPanel from './components/AIPanel/AIPanel';
import ThemeToggle from './components/ThemeToggle/ThemeToggle';
import { checkGroqStatus, getApiKey, setApiKey } from './services/groq';
import { updateDocument as updateDocInStorage } from './services/storage';
import './App.css';

// ========================================
// Settings Modal (kept as overlay for quick API key access)
// ========================================
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
    const oldKey = getApiKey();
    setApiKey(key);
    const status = await checkGroqStatus();
    if (!status.running) {
      setApiKey(oldKey);
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

// ========================================
// Main App Content (inside AppProvider)
// ========================================
function AppContent() {
  const {
    user, loading, settings, currentDoc, sidebarOpen,
    setSidebarOpen, setCurrentDoc, updateDocument, addToast,
  } = useApp();

  const [groqStatus, setGroqStatus] = useState({ running: false });
  const [showSettings, setShowSettings] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const editorRef = useRef(null);
  const autoSaveTimerRef = useRef(null);

  // Check Groq status
  const checkStatus = useCallback(async () => {
    const status = await checkGroqStatus();
    setGroqStatus(status);
  }, []);

  useEffect(() => {
    if (user) {
      checkStatus();
    }
  }, [user, checkStatus]);

  // Check if onboarding needed
  useEffect(() => {
    if (user && !settings.onboardingCompleted) {
      setShowOnboarding(true);
    }
  }, [user, settings.onboardingCompleted]);

  // Auto-save
  const handleEditorUpdate = useCallback((content) => {
    if (!currentDoc) return;

    // Debounce auto-save
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(async () => {
      try {
        const updated = await updateDocInStorage(currentDoc.id, { content });
        updateDocument(updated);
      } catch (err) {
        console.error('Auto-save error:', err);
      }
    }, settings.autoSaveInterval || 2000);
  }, [currentDoc, settings.autoSaveInterval, updateDocument]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  const handleEditorReady = useCallback((editor) => {
    editorRef.current = editor;
  }, []);

  const handleOnboardingComplete = useCallback(() => {
    setShowOnboarding(false);
    checkStatus();
  }, [checkStatus]);

  // Loading state
  if (loading) {
    return (
      <div className="app-loading">
        <div className="app-loading__spinner" />
        <span>Loading WriteAI...</span>
      </div>
    );
  }

  // Not logged in → Auth Page
  if (!user) {
    return <AuthPage />;
  }

  // Onboarding
  if (showOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  // Main App
  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="app-header__left">
          {!sidebarOpen && (
            <button
              className="sidebar-toggle-btn"
              onClick={() => setSidebarOpen(true)}
              title="Open sidebar"
            >
              <Menu size={18} />
            </button>
          )}
          <div className="app-logo">
            <div className="app-logo__icon">
              <PenLine />
            </div>
            <h1 className="app-logo__text">
              Write<span>AI</span>
            </h1>
          </div>
        </div>

        {/* Document title */}
        {currentDoc && (
          <div className="app-header__doc-title">
            {currentDoc.title || 'Untitled'}
          </div>
        )}

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
        {/* Sidebar */}
        <Sidebar />

        {/* Editor Area */}
        <div className="editor-container">
          {currentDoc ? (
            <Editor
              key={currentDoc.id}
              initialContent={currentDoc.content}
              onEditorReady={handleEditorReady}
              onUpdate={handleEditorUpdate}
            />
          ) : (
            <div className="editor-empty">
              <div className="editor-empty__icon">
                <PenLine size={48} />
              </div>
              <h2>Select or create a document</h2>
              <p>Choose a document from the sidebar, or create a new one to get started.</p>
            </div>
          )}
        </div>

        {/* AI Panel */}
        <div className={`ai-panel-wrapper ${showAIPanel ? 'ai-panel-wrapper--mobile-open' : ''}`}>
          <AIPanel
            editor={editorRef.current}
            groqStatus={groqStatus}
            onOpenSettings={() => setShowSettings(true)}
          />
        </div>

        {/* Mobile overlay */}
        {showAIPanel && (
          <div
            className="mobile-overlay visible"
            onClick={() => setShowAIPanel(false)}
          />
        )}
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        onSave={checkStatus}
      />

      {/* Toast Notifications (simple version for now) */}
    </div>
  );
}

// ========================================
// Root App (wrapped in Provider)
// ========================================
export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
