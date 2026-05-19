// ========================================
// Onboarding Flow — First-time User Guide
// ========================================
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  PenLine, Sparkles, Key, ArrowRight, ArrowLeft,
  CheckCircle, ExternalLink, Eye, EyeOff, Loader2,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { checkAIStatus, getAISettings, updateAISettings } from '../../services/ai';
import './OnboardingFlow.css';

export default function OnboardingFlow({ onComplete }) {
  const { t } = useTranslation();
  const { updateSettings } = useApp();

  const STEPS = [
    { id: 'welcome', title: t('onboarding.welcome') },
    { id: 'apikey', title: t('onboarding.apiKeySetup') },
    { id: 'tour', title: t('onboarding.quickTour') },
    { id: 'ready', title: t('onboarding.ready') },
  ];
  const [currentStep, setCurrentStep] = useState(0);
  const [apiKey, setLocalApiKey] = useState(getAISettings().providers.groq.apiKey);
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleTestApiKey = async () => {
    if (!apiKey.trim()) return;
    setTesting(true);
    setTestResult(null);
    updateAISettings({ providers: { groq: { apiKey } } });
    const status = await checkAIStatus('groq');
    if (!status.running) {
      updateAISettings({ providers: { groq: { apiKey: '' } } });
    }
    setTestResult(status);
    setTesting(false);
  };

  const handleSaveApiKey = async () => {
    updateAISettings({ activeProvider: 'groq', providers: { groq: { apiKey } } });
    await updateSettings({ groqApiKey: apiKey });
  };

  const handleNext = () => {
    if (currentStep === 1 && apiKey.trim()) {
      handleSaveApiKey();
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
    if (apiKey.trim()) {
      handleSaveApiKey();
    }
    await updateSettings({ onboardingCompleted: true });
    onComplete();
  };

  const handleSkip = async () => {
    await updateSettings({ onboardingCompleted: true });
    onComplete();
  };

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

          {/* Step 2: API Key Setup */}
          {currentStep === 1 && (
            <div className="onboarding__step fade-in">
              <div className="onboarding__step-icon">
                <Key size={32} />
              </div>
              <h2>{t('onboarding.setupTitle')}</h2>
              <p className="onboarding__subtitle">
                {t('onboarding.setupSubtitle')}
              </p>

              <div className="onboarding__instructions">
                <div className="onboarding__instruction">
                  <span className="onboarding__instruction-num">1</span>
                  <div>
                    <strong>{t('onboarding.step1')}</strong>
                    <p>
                      Visit{' '}
                      <a href="https://console.groq.com" target="_blank" rel="noreferrer">
                        {t('onboarding.step1Link')} <ExternalLink size={12} />
                      </a>
                    </p>
                  </div>
                </div>
                <div className="onboarding__instruction">
                  <span className="onboarding__instruction-num">2</span>
                  <div>
                    <strong>{t('onboarding.step2')}</strong>
                    <p>
                      <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer">
                        {t('onboarding.step2Link')} <ExternalLink size={12} />
                      </a>
                    </p>
                  </div>
                </div>
                <div className="onboarding__instruction">
                  <span className="onboarding__instruction-num">3</span>
                  <div>
                    <strong>{t('onboarding.step3')}</strong>
                    <p>{t('onboarding.step3Desc')}</p>
                  </div>
                </div>
              </div>

              <div className="onboarding__input-group">
                <div className="onboarding__input-wrapper">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={(e) => { setLocalApiKey(e.target.value); setTestResult(null); }}
                    placeholder="gsk_..."
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

              {testResult && (
                <div className={`onboarding__test-result ${testResult.running ? 'success' : 'error'}`}>
                  {testResult.running
                    ? `✅ ${t('onboarding.testSuccess')}`
                    : `❌ ${testResult.error || t('onboarding.testFailed')}`
                  }
                </div>
              )}

              <p className="onboarding__hint">
                💡 {t('onboarding.keyHint')}
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
