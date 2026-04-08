import React, { useState } from 'react';
import { Sparkles, Check, X, Zap } from 'lucide-react';
import './PaywallModal.css';
import { useApp } from '../../contexts/AppContext';

export default function PaywallModal({ isOpen, onClose }) {
  const { upgradeToPro } = useApp();
  const [billing, setBilling] = useState('yearly');

  if (!isOpen) return null;

  const handleUpgrade = () => {
    upgradeToPro();
    onClose();
  };

  return (
    <div className="paywall-overlay" onClick={onClose}>
      <div className="paywall-modal fade-in" onClick={e => e.stopPropagation()}>
        <button className="paywall-close" onClick={onClose}><X size={20}/></button>
        
        <div className="paywall-header">
           <div className="paywall-icon-wrapper">
             <Zap size={24} className="paywall-icon" />
           </div>
           <h2>Upgrade to WriteAI Pro</h2>
           <p>Deliver impactful writing, whether working alone or as a team. Unleash unlimited AI power.</p>
           
           {/* Segmented Control */}
           <div className="billing-tabs">
             <button 
               className={`billing-tab ${billing === 'monthly' ? 'billing-tab--active' : ''}`}
               onClick={() => setBilling('monthly')}
             >
               Monthly
             </button>
             <button 
               className={`billing-tab ${billing === 'yearly' ? 'billing-tab--active' : ''}`}
               onClick={() => setBilling('yearly')}
             >
               Yearly <span className="discount">Save 60%</span>
             </button>
           </div>
        </div>

        <div className="pricing-cards">
           {/* Free Card */}
           <div className="pricing-card">
              <h3>Free</h3>
              <p className="card-desc">Get peace of mind with basic AI writing.</p>
              <div className="price">
                 <span className="amount">$0</span>
                 <span className="period">/ month</span>
              </div>
              <p className="billing-hint">Free forever</p>
              <button className="pricing-btn secondary" onClick={onClose}>Current Plan</button>
              <ul className="features-list">
                 <li><Check size={16}/> 10 AI actions / day</li>
                 <li><Check size={16}/> Standard Grammar checks</li>
                 <li><Check size={16}/> Basic formatting</li>
                 <li className="disabled"><X size={16}/> Unlimited AI usage</li>
                 <li className="disabled"><X size={16}/> Professional Personas</li>
              </ul>
           </div>

           {/* Pro Card */}
           <div className="pricing-card highlight">
              <div className="popular-badge"><Sparkles size={12}/> Most popular</div>
              <h3>Pro</h3>
              <p className="card-desc">Advanced AI for absolute confidence.</p>
              <div className="price">
                 <span className="amount">{billing === 'monthly' ? '$30' : '$12'}</span>
                 <span className="period">/ month</span>
              </div>
              <p className="billing-hint">{billing === 'yearly' ? 'Billed $144 annually' : 'Billed monthly'}</p>
              <button className="pricing-btn primary-gradient" onClick={handleUpgrade}>
                <Sparkles size={16} /> Upgrade to Pro
              </button>
              <ul className="features-list">
                 <li><Check size={16} className="text-primary"/> <b>Everything in Free</b></li>
                 <li><Check size={16} className="text-primary"/> <b>Unlimited AI usage</b></li>
                 <li><Check size={16} className="text-primary"/> <b>Advanced Personas (IT, Sales)</b></li>
                 <li><Check size={16} className="text-primary"/> Full paragraph rewrites</li>
                 <li><Check size={16} className="text-primary"/> Priority model access</li>
              </ul>
           </div>
        </div>
      </div>
    </div>
  );
}
