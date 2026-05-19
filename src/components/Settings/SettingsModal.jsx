// ========================================
// Settings Modal — Multi-provider AI configuration
// ========================================
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X, Eye, EyeOff, Key, Check, Loader2, RefreshCw,
  ExternalLink, Zap, Globe, HardDrive, BookOpen
} from 'lucide-react';
import {
  getAISettings, updateAISettings, checkAIStatus,
  fetchOllamaModels, PROVIDER_CONFIG, PROVIDER_IDS
} from '../../services/ai';
import './SettingsModal.css';

const PROVIDER_ICONS = {
  groq: Zap,
  gemini: Globe,
  ollama: HardDrive,
};

function SetupGuide({ providerId, t }) {
  if (providerId === 'groq') {
    return (
      <div className="settings-setup-guide">
        <div className="settings-setup-guide__title">
          <BookOpen size={14} /> {t('settings.guide.title')}
        </div>
        <div className="settings-setup-guide__steps">
          <div className="settings-setup-guide__step">
            <span className="settings-setup-guide__num">1</span>
            <p>
              {t('settings.guide.groq.step1')}{' '}
              <a href="https://console.groq.com" target="_blank" rel="noreferrer">
                console.groq.com <ExternalLink size={11} />
              </a>
            </p>
          </div>
          <div className="settings-setup-guide__step">
            <span className="settings-setup-guide__num">2</span>
            <p>
              {t('settings.guide.groq.step2')}{' '}
              <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer">
                API Keys <ExternalLink size={11} />
              </a>
            </p>
          </div>
          <div className="settings-setup-guide__step">
            <span className="settings-setup-guide__num">3</span>
            <p>{t('settings.guide.groq.step3')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (providerId === 'gemini') {
    return (
      <div className="settings-setup-guide">
        <div className="settings-setup-guide__title">
          <BookOpen size={14} /> {t('settings.guide.title')}
        </div>
        <div className="settings-setup-guide__steps">
          <div className="settings-setup-guide__step">
            <span className="settings-setup-guide__num">1</span>
            <p>
              {t('settings.guide.gemini.step1')}{' '}
              <a href="https://aistudio.google.com" target="_blank" rel="noreferrer">
                Google AI Studio <ExternalLink size={11} />
              </a>
            </p>
          </div>
          <div className="settings-setup-guide__step">
            <span className="settings-setup-guide__num">2</span>
            <p>
              {t('settings.guide.gemini.step2')}{' '}
              <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">
                Get API Key <ExternalLink size={11} />
              </a>
            </p>
          </div>
          <div className="settings-setup-guide__step">
            <span className="settings-setup-guide__num">3</span>
            <p>{t('settings.guide.gemini.step3')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (providerId === 'ollama') {
    return (
      <div className="settings-setup-guide">
        <div className="settings-setup-guide__title">
          <BookOpen size={14} /> {t('settings.guide.title')}
        </div>
        <div className="settings-setup-guide__steps">
          <div className="settings-setup-guide__step">
            <span className="settings-setup-guide__num">1</span>
            <p>
              {t('settings.guide.ollama.step1')}{' '}
              <a href="https://ollama.com/download" target="_blank" rel="noreferrer">
                ollama.com <ExternalLink size={11} />
              </a>
            </p>
          </div>
          <div className="settings-setup-guide__step">
            <span className="settings-setup-guide__num">2</span>
            <p>{t('settings.guide.ollama.step2')} <code>ollama pull llama3.1</code></p>
          </div>
          <div className="settings-setup-guide__step">
            <span className="settings-setup-guide__num">3</span>
            <p>{t('settings.guide.ollama.step3')} <code>ollama serve</code></p>
          </div>
          <div className="settings-setup-guide__step">
            <span className="settings-setup-guide__num">4</span>
            <p>{t('settings.guide.ollama.step4')}</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default function SettingsModal({ isOpen, onClose, onSave }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('groq');
  const [settings, setSettings] = useState(getAISettings());
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [ollamaModels, setOllamaModels] = useState([]);
  const [loadingModels, setLoadingModels] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSettings(getAISettings());
      setTestResult(null);
      setShowKey(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && activeTab === 'ollama') {
      handleRefreshModels();
    }
  }, [isOpen, activeTab]);

  const getProviderSettings = (providerId) => settings.providers[providerId] || {};

  const updateProviderField = (providerId, field, value) => {
    setSettings(prev => ({
      ...prev,
      providers: {
        ...prev.providers,
        [providerId]: { ...prev.providers[providerId], [field]: value },
      },
    }));
    setTestResult(null);
  };

  const handleTest = useCallback(async () => {
    setTesting(true);
    setTestResult(null);
    updateAISettings({
      activeProvider: activeTab,
      providers: { [activeTab]: settings.providers[activeTab] },
    });
    const status = await checkAIStatus(activeTab);
    setTestResult(status);
    setTesting(false);
  }, [activeTab, settings]);

  const handleSetActive = useCallback((providerId) => {
    setSettings(prev => ({ ...prev, activeProvider: providerId }));
  }, []);

  const handleSave = () => {
    updateAISettings(settings);
    onSave?.();
    onClose();
  };

  const handleRefreshModels = async () => {
    setLoadingModels(true);
    const baseUrl = settings.providers.ollama?.baseUrl || PROVIDER_CONFIG.ollama.defaultBaseUrl;
    const models = await fetchOllamaModels(baseUrl);
    setOllamaModels(models);
    setLoadingModels(false);
  };

  if (!isOpen) return null;

  const providerSettings = getProviderSettings(activeTab);
  const config = PROVIDER_CONFIG[activeTab];
  const isActive = settings.activeProvider === activeTab;

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal settings-modal--wide fade-in" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="settings-modal__header">
          <h2>⚙️ {t('settings.title')}</h2>
          <button className="settings-modal__close" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Provider Tabs */}
        <div className="settings-provider-tabs">
          {PROVIDER_IDS.map(id => {
            const cfg = PROVIDER_CONFIG[id];
            const Icon = PROVIDER_ICONS[id] || Zap;
            const isTabActive = activeTab === id;
            const isProviderActive = settings.activeProvider === id;
            return (
              <button
                key={id}
                className={`settings-provider-tab ${isTabActive ? 'settings-provider-tab--active' : ''}`}
                onClick={() => { setActiveTab(id); setTestResult(null); setShowKey(false); }}
              >
                <Icon size={16} />
                <span>{cfg.name}</span>
                {isProviderActive && <span className="active-badge">{t('settings.active')}</span>}
              </button>
            );
          })}
        </div>

        {/* Provider Content */}
        <div className="settings-modal__body">
          <div className="settings-provider-info">
            <span className="settings-provider-icon">{config.icon}</span>
            <div>
              <strong>{config.name}</strong>
              <p>{config.description}</p>
            </div>
          </div>

          {/* Setup Guide */}
          <SetupGuide providerId={activeTab} t={t} />

          {/* API Key + Model in 2-column layout (Groq & Gemini) */}
          {config.requiresApiKey && (
            <div className="settings-form-row">
              <div className="settings-form-section">
                <label className="settings-label">
                  <Key size={14} />
                  {t('settings.apiKey')}
                </label>
                <p className="settings-hint">
                  {t('settings.getFreeKey')}{' '}
                  <a href={config.apiKeyUrl} target="_blank" rel="noreferrer">
                    {config.apiKeyLabel} <ExternalLink size={12} />
                  </a>
                </p>
                <div className="settings-input-group">
                  <input
                    type={showKey ? 'text' : 'password'}
                    className="settings-input"
                    value={providerSettings.apiKey || ''}
                    onChange={e => updateProviderField(activeTab, 'apiKey', e.target.value)}
                    placeholder={config.apiKeyPlaceholder}
                  />
                  <button
                    className="settings-input-toggle"
                    onClick={() => setShowKey(!showKey)}
                    title={showKey ? 'Hide key' : 'Show key'}
                  >
                    {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div className="settings-form-section">
                <label className="settings-label">
                  {t('settings.model')}
                </label>
                <select
                  className="settings-select"
                  value={providerSettings.model || ''}
                  onChange={e => updateProviderField(activeTab, 'model', e.target.value)}
                >
                  {config.models.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name}{m.default ? ` ${t('settings.default')}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Ollama: URL + Model in 2-column layout */}
          {activeTab === 'ollama' && (
            <div className="settings-form-row">
              <div className="settings-form-section">
                <label className="settings-label">
                  <HardDrive size={14} />
                  {t('settings.ollamaUrl')}
                </label>
                <p className="settings-hint">
                  {t('settings.ollamaHint')}
                </p>
                <div className="settings-input-group">
                  <input
                    type="text"
                    className="settings-input"
                    value={providerSettings.baseUrl || ''}
                    onChange={e => updateProviderField(activeTab, 'baseUrl', e.target.value)}
                    placeholder="http://localhost:11434"
                  />
                  <button
                    className="settings-input-toggle"
                    onClick={handleRefreshModels}
                    disabled={loadingModels}
                    title={t('settings.refreshModels')}
                  >
                    <RefreshCw size={16} className={loadingModels ? 'wt-spinner' : ''} />
                  </button>
                </div>
              </div>
              <div className="settings-form-section">
                <label className="settings-label">
                  {t('settings.model')}
                </label>
                <select
                  className="settings-select"
                  value={providerSettings.model || ''}
                  onChange={e => updateProviderField(activeTab, 'model', e.target.value)}
                >
                  <option value="">
                    {loadingModels ? t('settings.loadingModels') : ollamaModels.length === 0 ? t('settings.noModels') : t('settings.selectModel')}
                  </option>
                  {ollamaModels.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Test Result */}
          {testResult && (
            <div className={`settings-test-result ${testResult.running ? 'success' : 'error'}`}>
              {testResult.running
                ? `✅ ${t('settings.connected', { provider: config.name, model: testResult.model || providerSettings.model })}`
                : `❌ ${testResult.error}`
              }
            </div>
          )}

          {/* Actions */}
          <div className="settings-modal__actions">
            <button
              className="settings-btn settings-btn--secondary"
              onClick={handleTest}
              disabled={testing || (config.requiresApiKey && !providerSettings.apiKey)}
            >
              {testing ? <><Loader2 size={14} className="wt-spinner" /> {t('settings.testing')}</> : t('settings.testConnection')}
            </button>

            {!isActive ? (
              <button
                className="settings-btn settings-btn--accent"
                onClick={() => handleSetActive(activeTab)}
              >
                <Check size={14} /> {t('settings.setAsActive')}
              </button>
            ) : (
              <span className="settings-active-indicator">
                <Check size={14} /> {t('settings.currentlyActive')}
              </span>
            )}

            <button
              className="settings-btn settings-btn--primary"
              onClick={handleSave}
            >
              {t('settings.save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
