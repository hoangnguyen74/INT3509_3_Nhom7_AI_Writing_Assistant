// ========================================
// Onboarding Flow — First-time User Guide
// ========================================
import { useState, useCallback } from 'react';
import {
  PenLine, Sparkles, Key, ArrowRight, ArrowLeft,
  CheckCircle, ExternalLink, Eye, EyeOff, Loader2,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { checkGroqStatus, setApiKey, getApiKey } from '../../services/groq';
import './OnboardingFlow.css';

const STEPS = [
  { id: 'welcome', title: 'Welcome' },
  { id: 'apikey', title: 'API Key Setup' },
  { id: 'tour', title: 'Quick Tour' },
  { id: 'ready', title: 'Ready!' },
];

export default function OnboardingFlow({ onComplete }) {
  const { updateSettings } = useApp();
  const [currentStep, setCurrentStep] = useState(0);
  const [apiKey, setLocalApiKey] = useState(getApiKey());
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleTestApiKey = async () => {
    if (!apiKey.trim()) return;
    setTesting(true);
    setTestResult(null);
    const oldKey = getApiKey();
    setApiKey(apiKey);
    const status = await checkGroqStatus();
    if (!status.running) {
      setApiKey(oldKey);
    }
    setTestResult(status);
    setTesting(false);
  };

  const handleSaveApiKey = async () => {
    setApiKey(apiKey);
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
              <h2>Welcome to Write<span className="gradient-text">AI</span>! 🎉</h2>
              <p className="onboarding__subtitle">
                Your intelligent writing companion, powered by AI to help you write better, faster, and smarter.
              </p>
              <div className="onboarding__features">
                <div className="onboarding__feature-card">
                  <span>✨</span>
                  <div>
                    <strong>12+ AI Tools</strong>
                    <p>Summarize, grammar check, translate, rewrite, and more</p>
                  </div>
                </div>
                <div className="onboarding__feature-card">
                  <span>📝</span>
                  <div>
                    <strong>Rich Text Editor</strong>
                    <p>Full-featured editor with formatting, tables, and images</p>
                  </div>
                </div>
                <div className="onboarding__feature-card">
                  <span>🔒</span>
                  <div>
                    <strong>Privacy First</strong>
                    <p>Your documents stay on your device, never stored on our servers</p>
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
              <h2>Set Up Your AI Engine</h2>
              <p className="onboarding__subtitle">
                WriteAI uses <strong>Groq</strong> (free) for AI processing. Follow these steps to get your API key:
              </p>

              <div className="onboarding__instructions">
                <div className="onboarding__instruction">
                  <span className="onboarding__instruction-num">1</span>
                  <div>
                    <strong>Create a free Groq account</strong>
                    <p>
                      Visit{' '}
                      <a href="https://console.groq.com" target="_blank" rel="noreferrer">
                        console.groq.com <ExternalLink size={12} />
                      </a>
                    </p>
                  </div>
                </div>
                <div className="onboarding__instruction">
                  <span className="onboarding__instruction-num">2</span>
                  <div>
                    <strong>Go to API Keys</strong>
                    <p>
                      Navigate to{' '}
                      <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer">
                        API Keys section <ExternalLink size={12} />
                      </a>
                    </p>
                  </div>
                </div>
                <div className="onboarding__instruction">
                  <span className="onboarding__instruction-num">3</span>
                  <div>
                    <strong>Create a new key & paste below</strong>
                    <p>Click "Create API Key", copy it, and paste here:</p>
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
                  {testing ? <Loader2 size={14} className="auth-spinner" /> : '🔌'} Test
                </button>
              </div>

              {testResult && (
                <div className={`onboarding__test-result ${testResult.running ? 'success' : 'error'}`}>
                  {testResult.running
                    ? '✅ Connected! Your API key is working.'
                    : `❌ ${testResult.error || 'Connection failed. Please check your key.'}`
                  }
                </div>
              )}

              <p className="onboarding__hint">
                💡 You can always change this later in Settings. Your key is stored securely in your account.
              </p>
            </div>
          )}

          {/* Step 3: Quick Tour */}
          {currentStep === 2 && (
            <div className="onboarding__step fade-in">
              <div className="onboarding__step-icon">
                <Sparkles size={32} />
              </div>
              <h2>How It Works</h2>
              <p className="onboarding__subtitle">
                Here's a quick overview of your workspace:
              </p>

              <div className="onboarding__tour-grid">
                <div className="onboarding__tour-card">
                  <div className="onboarding__tour-card-header">📁 Sidebar</div>
                  <p>Manage your documents — create, search, favorite, and organize.</p>
                </div>
                <div className="onboarding__tour-card">
                  <div className="onboarding__tour-card-header">📝 Editor</div>
                  <p>Write with a powerful rich text editor. Bold, lists, tables, and more.</p>
                </div>
                <div className="onboarding__tour-card">
                  <div className="onboarding__tour-card-header">🤖 AI Panel</div>
                  <p>Use AI tools: summarize, grammar check, translate, compose, chat.</p>
                </div>
                <div className="onboarding__tour-card">
                  <div className="onboarding__tour-card-header">✨ Inline AI</div>
                  <p>Select any text in the editor and an AI menu appears for quick actions.</p>
                </div>
              </div>

              <div className="onboarding__tip">
                <strong>💡 Pro tip:</strong> Use <kbd>Ctrl+F</kbd> to open Find &amp; Replace — search and update text across your document instantly!
              </div>
            </div>
          )}

          {/* Step 4: Ready */}
          {currentStep === 3 && (
            <div className="onboarding__step fade-in">
              <div className="onboarding__ready-icon">🚀</div>
              <h2>You're All Set!</h2>
              <p className="onboarding__subtitle">
                Your workspace is ready. Start writing and let AI help you create amazing content.
              </p>
              <button className="onboarding__start-btn" onClick={handleFinish}>
                Start Writing
                <ArrowRight size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="onboarding__nav">
          <button className="onboarding__skip" onClick={handleSkip}>
            Skip setup
          </button>
          <div className="onboarding__nav-buttons">
            {currentStep > 0 && (
              <button className="onboarding__nav-btn onboarding__nav-btn--back" onClick={handleBack}>
                <ArrowLeft size={16} />
                Back
              </button>
            )}
            {currentStep < STEPS.length - 1 && (
              <button className="onboarding__nav-btn onboarding__nav-btn--next" onClick={handleNext}>
                Next
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
