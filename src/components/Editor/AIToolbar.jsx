import React, { useState, useCallback } from 'react';
import {
  Sparkles, FileText, SpellCheck, Palette, RefreshCw, 
  Maximize2, Minimize2, Lightbulb, ChevronDown, Check
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import {
  summarize, checkGrammar, changeTone, paraphrase,
  expandText, shortenText, improveReadability
} from '../../services/groq';
import './AIToolbar.css';

const AI_TOOLS = [
  { id: 'summarize', label: 'Summarize', icon: FileText, category: 'improve' },
  { id: 'grammar', label: 'Fix Grammar', icon: SpellCheck, category: 'improve' },
  { id: 'readability', label: 'Readability', icon: Lightbulb, category: 'improve' },
  { id: 'paraphrase', label: 'Paraphrase', icon: RefreshCw, category: 'creative' },
  { id: 'expand', label: 'Expand', icon: Maximize2, category: 'creative' },
  { id: 'shorten', label: 'Shorten', icon: Minimize2, category: 'creative' },
];

const TONES = ['Professional', 'Friendly', 'Academic', 'Sales', 'Creative'];
const PERSONAS = [
  { id: 'general', label: 'General Assistant' },
  { id: 'it', label: 'IT & Tech Lead' },
  { id: 'sales', label: 'Marketing & Sales' },
  { id: 'academic', label: 'Academic Researcher' },
];

export default function AIToolbar({ editor, onResult, onError, onLoading }) {
  const { settings, updateSettings, checkApiQuota, openPaywall } = useApp();
  const [showToneDropdown, setShowToneDropdown] = useState(false);
  const [showPersonaDropdown, setShowPersonaDropdown] = useState(false);

  const getText = useCallback(() => {
    if (!editor) return '';
    const { from, to } = editor.state.selection;
    if (from !== to) return editor.state.doc.textBetween(from, to, ' ');
    return editor.state.doc.textContent;
  }, [editor]);

  const handleToolClick = async (toolId, extraArg = null) => {
    if (!editor) return;
    const hasQuota = await checkApiQuota();
    if (!hasQuota) {
      openPaywall();
      return;
    }

    const text = getText();
    if (!text.trim()) {
      onError('Write or select some text first.');
      return;
    }

    onLoading(true);
    onError('');
    
    try {
      const persona = settings.activePersona || 'general';
      switch (toolId) {
        case 'summarize': await summarize(text, onResult, persona); break;
        case 'grammar': await checkGrammar(text, onResult, persona); break;
        case 'tone': await changeTone(text, extraArg, onResult, persona); break;
        case 'paraphrase': await paraphrase(text, onResult, persona); break;
        case 'expand': await expandText(text, onResult, persona); break;
        case 'shorten': await shortenText(text, onResult, persona); break;
        case 'readability': await improveReadability(text, onResult, persona); break;
      }
    } catch (err) {
      onError(err.message);
    } finally {
      onLoading(false);
    }
  };

  const handlePersonaChange = (personaId) => {
    updateSettings({ activePersona: personaId });
    setShowPersonaDropdown(false);
  };

  const activePersonaLabel = PERSONAS.find(p => p.id === (settings.activePersona || 'general'))?.label;

  return (
    <div className="ai-toolbar">
      <div className="ai-toolbar-section">
        <div className="ai-toolbar-badge">
          <Sparkles size={14} /> AI Tools
        </div>
        
        {AI_TOOLS.map(tool => {
          const Icon = tool.icon;
          return (
            <button key={tool.id} className="ai-tb-btn" onClick={() => handleToolClick(tool.id)} title={tool.label}>
              <Icon size={14} /> <span>{tool.label}</span>
            </button>
          );
        })}

        <div className="ai-dropdown-wrapper">
          <button className="ai-tb-btn" onClick={() => setShowToneDropdown(!showToneDropdown)}>
            <Palette size={14} /> <span>Tone</span> <ChevronDown size={14} />
          </button>
          {showToneDropdown && (
            <div className="ai-dropdown-menu">
              {TONES.map(tone => (
                <button key={tone} onClick={() => { handleToolClick('tone', tone.toLowerCase()); setShowToneDropdown(false); }}>
                  {tone}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="ai-toolbar-section persona-section">
        <div className="ai-dropdown-wrapper">
          <button 
             className="ai-tb-btn persona-btn" 
             onClick={() => setShowPersonaDropdown(!showPersonaDropdown)}
             title="Change AI Persona"
          >
            <div className={`persona-indicator ${settings.activePersona !== 'general' ? 'active' : ''}`} />
            <span>{activePersonaLabel}</span> <ChevronDown size={14} />
          </button>
          
          {showPersonaDropdown && (
            <div className="ai-dropdown-menu right-aligned">
              <div className="dropdown-title">Select Persona</div>
              {PERSONAS.map(p => {
                const isActive = (settings.activePersona || 'general') === p.id;
                const isPro = p.id !== 'general';
                return (
                  <button 
                    key={p.id} 
                    className={isActive ? 'active' : ''}
                    onClick={() => {
                      if (isPro && !settings.isPro) openPaywall();
                      else handlePersonaChange(p.id);
                    }}
                  >
                    {isActive ? <Check size={14} className="check-icon" /> : <div style={{width: 14}}/>}
                    {p.label}
                    {isPro && !settings.isPro && <Sparkles size={12} className="pro-sparkle" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
