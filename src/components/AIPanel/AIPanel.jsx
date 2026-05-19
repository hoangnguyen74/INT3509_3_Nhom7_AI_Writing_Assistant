// ========================================
// AI Panel — 4-section AI workspace
// ========================================
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Sparkles, Rocket, Languages, MessageCircle,
  AlertCircle, Settings,
} from 'lucide-react';
import AICompose from './AICompose';
import AITranslate from './AITranslate';
import AIChat from './AIChat';
import { getActiveProviderInfo } from '../../services/ai';
import './AIPanel.css';

export default function AIPanel({ editor, aiStatus, onOpenSettings }) {
  const { t } = useTranslation();
  const [activeSection, setActiveSection] = useState('compose');

  const SECTIONS = [
    { id: 'compose', label: t('compose.compose'), icon: Rocket },
    { id: 'translate', label: t('translate.translate'), icon: Languages },
    { id: 'chat', label: t('chat.chat'), icon: MessageCircle },
  ];
  const isReady = aiStatus?.running;
  const { config: providerConfig } = getActiveProviderInfo();

  return (
    <div className="ai-panel">
      {/* Header */}
      <div className="ai-panel__header">
        <div className="ai-panel__title">
          <div className="ai-panel__title-icon">
            <Sparkles />
          </div>
          {t('ai.assistant')}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className={`ai-panel__status ${isReady ? 'ai-panel__status--online' : 'ai-panel__status--offline'}`}>
            <span className={`status-dot ${isReady ? 'status-dot--online' : 'status-dot--offline'}`}></span>
            {isReady ? `${providerConfig?.icon || '⚡'} ${providerConfig?.name || 'AI'}` : t('ai.notConnected')}
          </div>
          <button
            className="ai-panel__settings-btn"
            onClick={onOpenSettings}
            title="API Settings"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* Section Navigation */}
      <div className="ai-panel__nav">
        {SECTIONS.map(section => {
          const Icon = section.icon;
          return (
            <button
              key={section.id}
              className={`ai-panel__nav-btn ${activeSection === section.id ? 'ai-panel__nav-btn--active' : ''}`}
              onClick={() => setActiveSection(section.id)}
              title={section.label}
            >
              <Icon size={16} />
              <span>{section.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="ai-panel__content">
        {/* No API Key hint */}
        {!isReady && (
          <div className="ai-panel__no-key">
            <AlertCircle size={16} />
            <span>
              {t('ai.configureProvider')}{' '}
              <button onClick={onOpenSettings} className="ai-panel__key-link">
                ⚙️ {t('ai.settings')}
              </button>
              {' '}{t('ai.enableFeatures')}
            </span>
          </div>
        )}

        {/* Sections */}
        {activeSection === 'compose' && (
          <AICompose editor={editor} isReady={isReady} />
        )}
        {activeSection === 'translate' && (
          <AITranslate editor={editor} isReady={isReady} />
        )}
        {activeSection === 'chat' && (
          <AIChat editor={editor} isReady={isReady} />
        )}
      </div>
    </div>
  );
}
