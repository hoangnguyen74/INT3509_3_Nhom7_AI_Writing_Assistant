import { useState, useEffect, useCallback, useRef } from 'react';
import {
  PenLine, Sparkles, Menu, X, Eye, EyeOff, Key, Download, FileText,
  FileCode, FileType, Printer, Wand2, Languages, MessageSquare, BookOpen,
} from 'lucide-react';
import { exportAsMarkdown, exportAsPlainText, exportAsHTML, exportAsPDF } from './services/export';
import { AppProvider, useApp } from './contexts/AppContext';
import AuthPage from './pages/AuthPage';
import OnboardingFlow from './components/Onboarding/OnboardingFlow';
import Sidebar from './components/Sidebar/Sidebar';
import Editor from './components/Editor/Editor';
import AIPanel from './components/AIPanel/AIPanel';
import ThemeToggle from './components/ThemeToggle/ThemeToggle';
import ToastContainer from './components/Toast/ToastContainer';
import PaywallModal from './components/Paywall/PaywallModal';
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
    user, loading, settings, currentDoc, sidebarOpen, showPaywall,
    setSidebarOpen, setCurrentDoc, updateDocument, addToast, openPaywall, closePaywall,
  } = useApp();

  const [groqStatus, setGroqStatus] = useState({ running: false });
  const [showSettings, setShowSettings] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const editorRef = useRef(null);
  const exportMenuRef = useRef(null);
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

  // Close export menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = async (format) => {
    if (!currentDoc) return;
    setShowExportMenu(false);
    if (format === 'pdf') {
      setExportingPDF(true);
      try {
        await exportAsPDF(currentDoc);
        addToast({ type: 'success', message: 'PDF exported successfully!' });
      } catch (err) {
        console.error('PDF export error:', err);
        addToast({ type: 'error', message: 'PDF export failed' });
      } finally {
        setExportingPDF(false);
      }
    } else if (format === 'md') {
      exportAsMarkdown(currentDoc);
      addToast({ type: 'success', message: 'Markdown exported!' });
    } else if (format === 'txt') {
      exportAsPlainText(currentDoc);
      addToast({ type: 'success', message: 'Text file exported!' });
    } else if (format === 'html') {
      exportAsHTML(currentDoc);
      addToast({ type: 'success', message: 'HTML exported!' });
    }
  };

  const handleOnboardingComplete = useCallback(() => {
    setShowOnboarding(false);
    checkStatus();
  }, [checkStatus]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+S — Force save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (currentDoc && editorRef.current) {
          const content = editorRef.current.getHTML();
          updateDocInStorage(currentDoc.id, { content }).then((updated) => {
            updateDocument(updated);
            addToast({ type: 'success', message: 'Document saved!' });
          });
        }
      }
      // Ctrl+Shift+E — Export menu
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'E') {
        e.preventDefault();
        if (currentDoc) setShowExportMenu((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentDoc, updateDocument, addToast]);

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
          {!settings.isPro && (
            <button className="upgrade-badge-btn" onClick={openPaywall} title="Upgrade to Pro">
              <Sparkles size={14} /> Upgrade
            </button>
          )}

          {currentDoc && (
            <div className="export-menu-wrapper" ref={exportMenuRef}>
              <button
                className={`header-action-btn ${showExportMenu ? 'active' : ''}`}
                onClick={() => setShowExportMenu(!showExportMenu)}
                title="Export document"
                disabled={exportingPDF}
              >
                {exportingPDF ? (
                  <div className="btn-spinner" />
                ) : (
                  <Download size={18} />
                )}
              </button>
              {showExportMenu && (
                <div className="export-dropdown fade-in">
                  <div className="export-dropdown__header">Export as...</div>
                  <button onClick={() => handleExport('md')}>
                    <FileText size={15} />
                    <div>
                      <span>Markdown</span>
                      <small>.md</small>
                    </div>
                  </button>
                  <button onClick={() => handleExport('txt')}>
                    <FileType size={15} />
                    <div>
                      <span>Plain Text</span>
                      <small>.txt</small>
                    </div>
                  </button>
                  <button onClick={() => handleExport('html')}>
                    <FileCode size={15} />
                    <div>
                      <span>HTML</span>
                      <small>.html</small>
                    </div>
                  </button>
                  <div className="export-dropdown__divider" />
                  <button onClick={() => handleExport('pdf')}>
                    <Printer size={15} />
                    <div>
                      <span>PDF</span>
                      <small>.pdf</small>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}
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
              <h2>Welcome to WriteAI</h2>
              <p>Select a document from the sidebar, or create a new one to start writing with AI.</p>
              <div className="editor-empty__features">
                <div className="editor-empty__feature">
                  <Wand2 size={18} />
                  <span>AI Writing Tools</span>
                </div>
                <div className="editor-empty__feature">
                  <Languages size={18} />
                  <span>Translation</span>
                </div>
                <div className="editor-empty__feature">
                  <MessageSquare size={18} />
                  <span>AI Chat</span>
                </div>
                <div className="editor-empty__feature">
                  <BookOpen size={18} />
                  <span>Rich Editor</span>
                </div>
              </div>
              <div className="editor-empty__shortcuts">
                <kbd>Ctrl+S</kbd> Save &nbsp;·&nbsp;
                <kbd>Ctrl+Shift+E</kbd> Export
              </div>
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

      {/* Paywall Modal */}
      <PaywallModal isOpen={showPaywall} onClose={closePaywall} />

      {/* Toast Notifications */}
      <ToastContainer />
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
