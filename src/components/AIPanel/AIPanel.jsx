// ========================================
// AI Panel — 4-section AI workspace
// ========================================
import { useState } from 'react';
import {
  Sparkles, PenTool, Rocket, Languages, MessageCircle,
  AlertCircle, Settings,
} from 'lucide-react';
import WritingTools from './WritingTools';
import AICompose from './AICompose';
import AITranslate from './AITranslate';
import AIChat from './AIChat';
import './AIPanel.css';

const SECTIONS = [
  { id: 'writing', label: 'Writing', icon: PenTool },
  { id: 'compose', label: 'Compose', icon: Rocket },
  { id: 'translate', label: 'Translate', icon: Languages },
  { id: 'chat', label: 'Chat', icon: MessageCircle },
];

export default function AIPanel({ editor, groqStatus, onOpenSettings }) {
  const [activeSection, setActiveSection] = useState('writing');
  const isReady = groqStatus?.running;

  return (
    <div className="ai-panel">
      {/* Header */}
      <div className="ai-panel__header">
        <div className="ai-panel__title">
          <div className="ai-panel__title-icon">
            <Sparkles />
          </div>
          AI Assistant
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className={`ai-panel__status ${isReady ? 'ai-panel__status--online' : 'ai-panel__status--offline'}`}>
            <span className={`status-dot ${isReady ? 'status-dot--online' : 'status-dot--offline'}`}></span>
            {isReady ? 'Llama 3' : 'No Key'}
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
              Set your Groq API key in{' '}
              <button onClick={onOpenSettings} className="ai-panel__key-link">
                ⚙️ Settings
              </button>
              {' '}to enable AI features.{' '}
              <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer">
                Get a free key →
              </a>
            </span>
          </div>
        )}

        {/* Sections */}
        {activeSection === 'writing' && (
          <WritingTools editor={editor} isReady={isReady} />
        )}
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
