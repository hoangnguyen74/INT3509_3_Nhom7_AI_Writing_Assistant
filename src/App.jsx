import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  PenLine, Sparkles, Menu, Download, FileText,
  FileCode, FileType, Printer, Plus, Home
} from 'lucide-react';
import { exportAsMarkdown, exportAsPlainText, exportAsHTML, exportAsPDF } from './services/export';
import { AppProvider, useApp } from './contexts/AppContext';
import AuthPage from './pages/AuthPage';
import OnboardingFlow from './components/Onboarding/OnboardingFlow';
import Sidebar from './components/Sidebar/Sidebar';
import Editor from './components/Editor/Editor';
import AIPanel from './components/AIPanel/AIPanel';
import ThemeToggle from './components/ThemeToggle/ThemeToggle';
import LanguageSwitcher from './components/LanguageSwitcher/LanguageSwitcher';
import ToastContainer from './components/Toast/ToastContainer';
import PaywallModal from './components/Paywall/PaywallModal';
import TemplateGallery from './components/TemplateGallery/TemplateGallery';
import SettingsModal from './components/Settings/SettingsModal';
import { checkAIStatus } from './services/ai';
import { updateDocument as updateDocInStorage } from './services/storage';
import './App.css';

// ========================================
// Main App Content (inside AppProvider)
// ========================================
function AppContent() {
  const { t } = useTranslation();
  const {
    user, loading, settings, currentDoc, sidebarOpen, showPaywall, documents,
    setSidebarOpen, setCurrentDoc, addDocument, updateDocument, addToast, openPaywall, closePaywall, updateSettings,
  } = useApp();

  const [aiStatus, setAIStatus] = useState({ running: false });
  const [showSettings, setShowSettings] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const editorRef = useRef(null);
  const exportMenuRef = useRef(null);
  const autoSaveTimerRef = useRef(null);

  // Check AI provider status
  const checkStatus = useCallback(async () => {
    const status = await checkAIStatus();
    setAIStatus(status);
  }, []);

  useEffect(() => {
    if (user) {
      checkStatus();
    }
  }, [user, checkStatus]);

  // Check if onboarding needed
  useEffect(() => {
    if (user && !loading && !settings.onboardingCompleted) {
      setShowOnboarding(true);
    }
  }, [user, loading, settings.onboardingCompleted]);

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
        addToast({ type: 'success', message: t('export.pdfSuccess') });
      } catch (err) {
        console.error('PDF export error:', err);
        addToast({ type: 'error', message: t('export.pdfFailed') });
      } finally {
        setExportingPDF(false);
      }
    } else if (format === 'md') {
      exportAsMarkdown(currentDoc);
      addToast({ type: 'success', message: t('export.mdSuccess') });
    } else if (format === 'txt') {
      exportAsPlainText(currentDoc);
      addToast({ type: 'success', message: t('export.txtSuccess') });
    } else if (format === 'html') {
      exportAsHTML(currentDoc);
      addToast({ type: 'success', message: t('export.htmlSuccess') });
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
            addToast({ type: 'success', message: t('editor.docSaved') });
          });
        }
      }
      // Ctrl+Shift+E — Export menu
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'E') {
        e.preventDefault();
        if (currentDoc) setShowExportMenu((prev) => !prev);
      }
      // Ctrl+P — Print
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        if (currentDoc) window.print();
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
        <span>{t('app.loading')}</span>
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
              title={t('sidebar.openSidebar')}
            >
              <Menu size={18} />
            </button>
          )}
          <div className="app-logo" onClick={() => setCurrentDoc(null)} style={{cursor: 'pointer'}} title={t('common.goToDashboard')}>
            <div className="app-logo__icon">
              <PenLine />
            </div>
            <h1 className="app-logo__text">
              Write<span>AI</span>
            </h1>
          </div>
          {currentDoc && (
            <button 
              className="header-action-btn" 
              onClick={() => setCurrentDoc(null)}
              style={{ marginLeft: 16 }}
              title={t('common.home')}
            >
              <Home size={18} />
            </button>
          )}
        </div>

        {/* Document title — editable */}
        {currentDoc && (
          editingTitle ? (
            <input
              className="app-header__doc-title-input"
              value={titleDraft}
              onChange={e => setTitleDraft(e.target.value)}
              onBlur={async () => {
                const newTitle = titleDraft.trim() || t('sidebar.untitled', 'Untitled');
                const updated = await updateDocInStorage(currentDoc.id, { title: newTitle });
                updateDocument(updated);
                setCurrentDoc({ ...currentDoc, title: newTitle });
                setEditingTitle(false);
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') e.target.blur();
                if (e.key === 'Escape') setEditingTitle(false);
              }}
              autoFocus
              maxLength={80}
            />
          ) : (
            <div
              className="app-header__doc-title"
              onClick={() => {
                setTitleDraft(currentDoc.title || 'Untitled');
                setEditingTitle(true);
              }}
              title={t('editor.clickToRename')}
            >
              {currentDoc.title || t('dashboard.untitled')}
            </div>
          )
        )}

        <div className="app-header__actions">
          {!settings.isPro ? (
            <>
              <span className="quota-badge" title="AI calls used today">
                {settings.lastCallDate === new Date().toISOString().split('T')[0] ? (settings.apiCalls || 0) : 0}/10
              </span>
              <button className="upgrade-badge-btn" onClick={openPaywall} title={t('common.upgrade')}>
                <Sparkles size={14} /> {t('common.upgrade')}
              </button>
            </>
          ) : (
            <button 
              className="upgrade-badge-btn upgrade-badge-btn--pro" 
              onClick={() => {
                updateSettings({ isPro: false });
                addToast({ message: 'Downgraded to free (Demo)', type: 'info' })
              }}
              title="Click to downgrade (Demo purpose)"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
            >
              <Sparkles size={14} /> {t('common.pro')}
            </button>
          )}

          {currentDoc && (
            <div className="export-menu-wrapper" ref={exportMenuRef}>
              <button
                className={`header-action-btn ${showExportMenu ? 'active' : ''}`}
                onClick={() => setShowExportMenu(!showExportMenu)}
                title={t('export.exportDocument')}
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
                  <div className="export-dropdown__header">{t('export.exportAs')}</div>
                  <button onClick={() => handleExport('md')}>
                    <FileText size={15} />
                    <div>
                      <span>{t('export.markdown')}</span>
                      <small>.md</small>
                    </div>
                  </button>
                  <button onClick={() => handleExport('txt')}>
                    <FileType size={15} />
                    <div>
                      <span>{t('export.plainText')}</span>
                      <small>.txt</small>
                    </div>
                  </button>
                  <button onClick={() => handleExport('html')}>
                    <FileCode size={15} />
                    <div>
                      <span>{t('export.html')}</span>
                      <small>.html</small>
                    </div>
                  </button>
                  <div className="export-dropdown__divider" />
                  <button onClick={() => handleExport('pdf')}>
                    <Printer size={15} />
                    <div>
                      <span>{t('export.pdf')}</span>
                      <small>.pdf</small>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}
          <LanguageSwitcher />
          <ThemeToggle />
          <button
            className="mobile-ai-toggle"
            onClick={() => setShowAIPanel(!showAIPanel)}
            title={t('common.toggleAIPanel')}
          >
            <Sparkles />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="app-main">
        {/* Sidebar */}
        <Sidebar onNewDocument={() => {
          setShowTemplates(true);
          // Optional: hide sidebar on mobile when opening templates
          if (window.innerWidth <= 768) setSidebarOpen(false);
        }} />

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
            <div className="dashboard-view">
              <div className="dashboard-header">
                <h1>{t('dashboard.welcome')}</h1>
                <p>{t('app.tagline')}</p>
              </div>

              {/* Feature Highlights */}
              <div className="feature-strip">
                <div className="feature-card">
                  <div className="feature-card__icon" style={{background: 'linear-gradient(135deg, #6366f1, #8b5cf6)'}}>🧠</div>
                  <div className="feature-card__body">
                    <h4>{t('dashboard.featureAI')}</h4>
                    <p>{t('dashboard.featureAIDesc')}</p>
                  </div>
                </div>
                <div className="feature-card">
                  <div className="feature-card__icon" style={{background: 'linear-gradient(135deg, #0ea5e9, #06b6d4)'}}>🌍</div>
                  <div className="feature-card__body">
                    <h4>{t('dashboard.featureTranslate')}</h4>
                    <p>{t('dashboard.featureTranslateDesc')}</p>
                  </div>
                </div>
                <div className="feature-card">
                  <div className="feature-card__icon" style={{background: 'linear-gradient(135deg, #f59e0b, #ef4444)'}}>🎭</div>
                  <div className="feature-card__body">
                    <h4>{t('dashboard.featurePersonas')}</h4>
                    <p>{t('dashboard.featurePersonasDesc')}</p>
                  </div>
                </div>
                <div className="feature-card">
                  <div className="feature-card__icon" style={{background: 'linear-gradient(135deg, #10b981, #059669)'}}>📄</div>
                  <div className="feature-card__body">
                    <h4>{t('dashboard.featureExport')}</h4>
                    <p>{t('dashboard.featureExportDesc')}</p>
                  </div>
                </div>
              </div>

              {/* Documents Grid */}
              <div className="recent-docs">
                <div className="recent-docs__header">
                  <h3>{t('dashboard.documents')}</h3>
                  {documents.length > 8 && (
                    <button className="view-all-btn" onClick={() => setSidebarOpen(true)}>
                      {t('dashboard.viewAll')} ({documents.length}) →
                    </button>
                  )}
                </div>
                <div className="docs-grid">
                  {/* New Document Card */}
                  <div className="doc-card doc-card--new" onClick={() => setShowTemplates(true)}>
                    <div className="doc-card-new-icon"><Plus size={28} /></div>
                    <span>{t('dashboard.newDocument')}</span>
                  </div>
                  {/* Existing Documents */}
                  {documents.slice(0, 8).map(doc => (
                    <div key={doc.id} className="doc-card" onClick={() => setCurrentDoc(doc)}>
                      <div className="doc-card-preview">
                        {doc.content ? doc.content.replace(/<[^>]+>/g, '').substring(0, 80) : t('dashboard.emptyDoc')}
                      </div>
                      <div className="doc-card-footer">
                        <span className="doc-title">{doc.title || t('dashboard.untitled')}</span>
                        <span className="doc-date">{new Date(doc.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* AI Panel - only show when a document is open */}
        {currentDoc && (
          <div className={`ai-panel-wrapper ${showAIPanel ? 'ai-panel-wrapper--mobile-open' : ''}`}>
            <AIPanel
              editor={editorRef.current}
              aiStatus={aiStatus}
              onOpenSettings={() => setShowSettings(true)}
            />
          </div>
        )}

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

      {/* Template Gallery */}
      <TemplateGallery
        isOpen={showTemplates}
        onClose={() => setShowTemplates(false)}
        onSelect={async (title, content) => {
          const { createDocument } = await import('./services/storage');
          const doc = await createDocument(title, content);
          addDocument(doc);
          setCurrentDoc(doc);
          addToast({ type: 'success', message: t('common.createdFromTemplate', { title }) });
        }}
      />

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
