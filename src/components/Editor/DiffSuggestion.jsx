import React from 'react';
import { Check, X, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import './DiffSuggestion.css';

export default function DiffSuggestion({ result, loading, error, onAccept, onReject }) {
  if (!result && !loading && !error) return null;

  return (
    <div className="diff-suggestion fade-in">
      <div className="diff-header">
        <div className="diff-badge">
          <Sparkles size={14} /> AI Suggestion
        </div>
        <div className="diff-actions">
          {!loading && !error && (
            <>
              <button className="diff-btn diff-reject" onClick={onReject}>
                <X size={14} /> Dismiss
              </button>
              <button className="diff-btn diff-accept" onClick={onAccept}>
                <Check size={14} /> Accept Change
              </button>
            </>
          )}
          {(error || loading) && (
            <button className="diff-btn diff-reject" onClick={onReject}>
              <X size={14} />
            </button>
          )}
        </div>
      </div>
      <div className="diff-content">
        {loading && (
          <div className="diff-status">
            <Loader2 size={16} className="wt-spinner" /> <span>AI is processing...</span>
          </div>
        )}
        {error && (
          <div className="diff-status diff-error">
            <AlertCircle size={16} /> <span>{error}</span>
          </div>
        )}
        {!loading && !error && result && (
           <div className="diff-text">
             {/* If it's the grammar tool with ---, split it */}
             {result.includes('---') ? (
               <>
                 <div className="diff-grammar-analysis">
                   {result.split('---')[0]}
                 </div>
                 <div className="diff-grammar-result">
                   {result.split('---')[1]}
                 </div>
               </>
             ) : (
               result
             )}
           </div>
        )}
      </div>
    </div>
  );
}
