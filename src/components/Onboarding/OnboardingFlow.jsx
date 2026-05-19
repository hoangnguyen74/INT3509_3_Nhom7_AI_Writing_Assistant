// ========================================
// Onboarding Flow — First-time User Guide
// ========================================
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  PenLine, Sparkles, Key, ArrowRight, ArrowLeft,
  CheckCircle, ExternalLink, Eye, EyeOff, Loader2,
  Zap, Globe, HardDrive,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { checkAIStatus, getAISettings, updateAISettings, PROVIDER_CONFIG } from '../../services/ai';
import './OnboardingFlow.css';

const PROVIDER_OPTIONS = [
  {
    id: 'groq',
    Icon: Zap,
    color: '#f97316',
    free: true,
    tag: 'Fastest',
  },
  {
    id: 'gemini',
    Icon: Globe,
    color: '#3b82f6',
    free: true,
    tag: 'Gemma 4',
  },
  {
    id: 'ollama',
    Icon: HardDrive,
    color: '#8b5cf6',
    free: true,
    tag: 'Local',
  },
];

function ProviderSetupInstructions({ providerId, t }) {
  if (providerId === 'groq') {
    return (
      <div className="onboarding__instructions">
        <div className="onboarding__instruction">
          <span className="onboarding__instruction-num">1</span>
          <div>
            <strong>{t('onboarding.groq.step1')}</strong>
            <p>
              <a href="https://console.groq.com" target="_blank" rel="noreferrer">
                console.groq.com <ExternalLink size={12} />
              </a>
            </p>
          </div>
        </div>
        <div className="onboarding__instruction">
          <span className="onboarding__instruction-num">2</span>
          <div>
            <strong>{t('onboarding.groq.step2')}</strong>
            <p>
              <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer">
                API Keys <ExternalLink size={12} />
              </a>
            </p>
          </div>
        </div>
        <div className="onboarding__instruction">
          <span className="onboarding__instruction-num">3</span>
          <div>
            <strong>{t('onboarding.groq.step3')}</strong>
            <p>{t('onboarding.groq.step3Desc')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (providerId === 'gemini') {
    return (
      <div className="onboarding__instructions">
        <div className="onboarding__instruction">
          <span className="onboarding__instruction-num">1</span>
          <div>
            <strong>{t('onboarding.gemini.step1')}</strong>
            <p>
              <a href="https://aistudio.google.com" target="_blank" rel="noreferrer">
                Google AI Studio <ExternalLink size={12} />
              </a>
            </p>
          </div>
        </div>
        <div className="onboarding__instruction">
          <span className="onboarding__instruction-num">2</span>
          <div>
            <strong>{t('onboarding.gemini.step2')}</strong>
            <p>
              <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">
                Get API Key <ExternalLink size={12} />
              </a>
            </p>
          </div>
        </div>
        <div className="onboarding__instruction">
          <span className="onboarding__instruction-num">3</span>
          <div>
            <strong>{t('onboarding.gemini.step3')}</strong>
            <p>{t('onboarding.gemini.step3Desc')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (providerId === 'ollama') {
    return (
      <div className="onboarding__instructions">
        <div className="onboarding__instruction">
          <span className="onboarding__instruction-num">1</span>
          <div>
            <strong>{t('onboarding.ollama.step1')}</strong>
            <p>
              <a href="https://ollama.com/download" target="_blank" rel="noreferrer">
                ollama.com <ExternalLink size={12} />
              </a>
            </p>
          </div>
        </div>
        <div className="onboarding__instruction">
          <span className="onboarding__instruction-num">2</span>
          <div>
            <strong>{t('onboarding.ollama.step2')}</strong>
            <p>{t('onboarding.ollama.step2Desc')}</p>
          </div>
        </div>
        <div className="onboarding__instruction">
          <span className="onboarding__instruction-num">3</span>
          <div>
            <strong>{t('onboarding.ollama.step3')}</strong>
            <p>{t('onboarding.ollama.step3Desc')}</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default function OnboardingFlow({ onComplete }) {
  const { t } = useTranslation();
  const { updateSettings } = useApp();

  const STEPS = [
    { id: 'welcome', title: t('onboarding.welcome') },
    { id: 'provider', title: t('onboarding.providerSetup') },
    { id: 'tour', title: t('onboarding.quickTour') },
    { id: 'ready', title: t('onboarding.ready') },
  ];
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [apiKey, setLocalApiKey] = useState('');
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleSelectProvider = (providerId) => {
    setSelectedProvider(providerId);
    setTestResult(null);
    setLocalApiKey('');
    setShowKey(false);
  };

  const handleTestApiKey = async () => {
    if (selectedProvider === 'ollama') {
      setTesting(true);
      setTestResult(null);
      updateAISettings({ providers: { ollama: { baseUrl: ollamaUrl } } });
      const status = await checkAIStatus('ollama');
      setTestResult(status);
      setTesting(false);
      return;
    }

    if (!apiKey.trim()) return;
    setTesting(true);
    setTestResult(null);
    updateAISettings({ providers: { [selectedProvider]: { apiKey } } });
    const status = await checkAIStatus(selectedProvider);
    if (!status.running) {
      updateAISettings({ providers: { [selectedProvider]: { apiKey: '' } } });
    }
    setTestResult(status);
    setTesting(false);
  };

  const handleSaveProvider = async () => {
    if (!selectedProvider) return;
    if (selectedProvider === 'ollama') {
      updateAISettings({ activeProvider: 'ollama', providers: { ollama: { baseUrl: ollamaUrl } } });
    } else {
      updateAISettings({ activeProvider: selectedProvider, providers: { [selectedProvider]: { apiKey } } });
      if (selectedProvider === 'groq') {
        await updateSettings({ groqApiKey: apiKey });
      }
    }
  };

  const handleNext = () => {
    if (currentStep === 1 && selectedProvider) {
      handleSaveProvider();
    }
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = async () => {
    if (selectedProvider) {
      handleSaveProvider();
    }
    await updateSettings({ onboardingCompleted: true });
    onComplete();
  };

  const handleSkip = async () => {
    await updateSettings({ onboardingCompleted: true });
    onComplete();
  };

  const needsApiKey = selectedProvider && PROVIDER_CONFIG[selectedProvider]?.requiresApiKey;
  const keyPlaceholder = selectedProvider === 'gemini' ? 'AI...' : 'gsk_...';

  return (
    <div className="onboarding">
      <div className="onboarding__card">
        {/* Progress */}
        <div className="onboarding__progress">
          {STEPS.map((step, i) => (
            <div
              key={step.id}
              className={`onboarding__progress-step ${i <= currentStep ? 'onboarding__progress-step--active' : ''} ${i < currentStep ? 'onboarding__progress-step--done' : ''}`}
            >
              <div className="onboarding__progress-dot">
                {i < currentStep ? <CheckCircle size={14} /> : i + 1}
              </div>
              <span>{step.title}</span>
            </div>
          ))}
          <div className="onboarding__progress-bar">
            <div
              className="onboarding__progress-fill"
              style={{ width: `${(currentStep / (STEPS.length - 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="onboarding__content">
          {/* Step 1: Welcome */}
          {currentStep === 0 && (
            <div className="onboarding__step fade-in">
              <div className="onboarding__welcome-icon">
                <PenLine size={40} />
              </div>
              <h2>{t('onboarding.welcomeTitle')}</h2>
              <p className="onboarding__subtitle">
                {t('onboarding.welcomeSubtitle')}
              </p>
              <div className="onboarding__features">
                <div className="onboarding__feature-card">
                  <span>✨</span>
                  <div>
                    <strong>{t('onboarding.feature1')}</strong>
                    <p>{t('onboarding.feature1Desc')}</p>
                  </div>
                </div>
                <div className="onboarding__feature-card">
                  <span>📝</span>
                  <div>
                    <strong>{t('onboarding.feature2')}</strong>
                    <p>{t('onboarding.feature2Desc')}</p>
                  </div>
                </div>
                <div className="onboarding__feature-card">
                  <span>🔒</span>
                  <div>
                    <strong>{t('onboarding.feature3')}</strong>
                    <p>{t('onboarding.feature3Desc')}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Provider Selection + Setup */}
          {currentStep === 1 && (
            <div className="onboarding__step fade-in">
              <div className="onboarding__step-icon">
                <Key size={32} />
              </div>
              <h2>{t('onboarding.providerTitle')}</h2>
              <p className="onboarding__subtitle">
                {t('onboarding.providerSubtitle')}
              </p>

              {/* Provider Cards */}
              <div className="onboarding__provider-grid">
                {PROVIDER_OPTIONS.map(opt => {
                  const cfg = PROVIDER_CONFIG[opt.id];
                  const isSelected = selectedProvider === opt.id;
                  return (
                    <button
                      key={opt.id}
                      className={`onboarding__provider-card ${isSelected ? 'onboarding__provider-card--selected' : ''}`}
                      onClick={() => handleSelectProvider(opt.id)}
                    >
                      <div className="onboarding__provider-card-icon" style={{ color: opt.color }}>
                        <opt.Icon size={24} />
                      </div>
                      <strong>{cfg.name}</strong>
                      <p>{t(`onboarding.provider.${opt.id}Desc`)}</p>
                      <div className="onboarding__provider-card-tags">
                        {opt.free && <span className="onboarding__provider-tag onboarding__provider-tag--free">{t('onboarding.provider.free')}</span>}
                        <span className="onboarding__provider-tag">{opt.tag}</span>
                      </div>
                      {isSelected && <div className="onboarding__provider-check"><CheckCircle size={18} /></div>}
                    </button>
                  );
                })}
              </div>

              {/* Provider-specific setup */}
              {selectedProvider && (
                <div className="onboarding__provider-setup fade-in">
                  <ProviderSetupInstructions providerId={selectedProvider} t={t} />

                  {/* API Key Input */}
                  {needsApiKey && (
                    <div className="onboarding__input-group">
                      <div className="onboarding__input-wrapper">
                        <input
                          type={showKey ? 'text' : 'password'}
                          value={apiKey}
                          onChange={(e) => { setLocalApiKey(e.target.value); setTestResult(null); }}
                          placeholder={keyPlaceholder}
                          className="onboarding__input"
                        />
                        <button
                          className="onboarding__input-toggle"
                          onClick={() => setShowKey(!showKey)}
                        >
                          {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      <button
                        className="onboarding__test-btn"
                        onClick={handleTestApiKey}
                        disabled={!apiKey.trim() || testing}
                      >
                        {testing ? <Loader2 size={14} className="auth-spinner" /> : '🔌'} {t('onboarding.test')}
                      </button>
                    </div>
                  )}

                  {/* Ollama URL Input */}
                  {selectedProvider === 'ollama' && (
                    <div className="onboarding__input-group">
                      <div className="onboarding__input-wrapper">
                        <input
                          type="text"
                          value={ollamaUrl}
                          onChange={(e) => { setOllamaUrl(e.target.value); setTestResult(null); }}
                          placeholder="http://localhost:11434"
                          className="onboarding__input"
                        />
                      </div>
                      <button
                        className="onboarding__test-btn"
                        onClick={handleTestApiKey}
                        disabled={testing}
                      >
                        {testing ? <Loader2 size={14} className="auth-spinner" /> : '🔌'} {t('onboarding.test')}
                      </button>
                    </div>
                  )}

                  {testResult && (
                    <div className={`onboarding__test-result ${testResult.running ? 'success' : 'error'}`}>
                      {testResult.running
                        ? `✅ ${t('onboarding.testSuccess')}`
                        : `❌ ${testResult.error || t('onboarding.testFailed')}`
                      }
                    </div>
                  )}
                </div>
              )}

              <p className="onboarding__hint">
                💡 {t('onboarding.providerHint')}
              </p>
            </div>
          )}

          {/* Step 3: Quick Tour */}
          {currentStep === 2 && (
            <div className="onboarding__step fade-in">
              <div className="onboarding__step-icon">
                <Sparkles size={32} />
              </div>
              <h2>{t('onboarding.tourTitle')}</h2>
              <p className="onboarding__subtitle">
                {t('onboarding.tourSubtitle')}
              </p>

              <div className="onboarding__tour-grid">
                <div className="onboarding__tour-card">
                  <div className="onboarding__tour-card-header">📁 {t('onboarding.tourSidebar')}</div>
                  <p>{t('onboarding.tourSidebarDesc')}</p>
                </div>
                <div className="onboarding__tour-card">
                  <div className="onboarding__tour-card-header">📝 {t('onboarding.tourEditor')}</div>
                  <p>{t('onboarding.tourEditorDesc')}</p>
                </div>
                <div className="onboarding__tour-card">
                  <div className="onboarding__tour-card-header">🤖 {t('onboarding.tourAI')}</div>
                  <p>{t('onboarding.tourAIDesc')}</p>
                </div>
                <div className="onboarding__tour-card">
                  <div className="onboarding__tour-card-header">✨ {t('onboarding.tourInline')}</div>
                  <p>{t('onboarding.tourInlineDesc')}</p>
                </div>
              </div>

              <div className="onboarding__tip">
                <strong>💡 {t('onboarding.proTip')}</strong> {t('onboarding.proTipText')}
              </div>
            </div>
          )}

          {/* Step 4: Ready */}
          {currentStep === 3 && (
            <div className="onboarding__step fade-in">
              <div className="onboarding__ready-icon">🚀</div>
              <h2>{t('onboarding.allSet')}</h2>
              <p className="onboarding__subtitle">
                {t('onboarding.allSetDesc')}
              </p>
              <button className="onboarding__start-btn" onClick={handleFinish}>
                {t('onboarding.startWriting')}
                <ArrowRight size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="onboarding__nav">
          <button className="onboarding__skip" onClick={handleSkip}>
            {t('onboarding.skipSetup')}
          </button>
          <div className="onboarding__nav-buttons">
            {currentStep > 0 && (
              <button className="onboarding__nav-btn onboarding__nav-btn--back" onClick={handleBack}>
                <ArrowLeft size={16} />
                {t('onboarding.back')}
              </button>
            )}
            {currentStep < STEPS.length - 1 && (
              <button className="onboarding__nav-btn onboarding__nav-btn--next" onClick={handleNext}>
                {t('onboarding.next')}
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
