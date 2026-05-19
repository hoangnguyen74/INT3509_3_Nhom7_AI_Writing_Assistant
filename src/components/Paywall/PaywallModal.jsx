import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Check, X, Zap } from 'lucide-react';
import './PaywallModal.css';
import { useApp } from '../../contexts/AppContext';

export default function PaywallModal({ isOpen, onClose }) {
  const { t } = useTranslation();
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
             <span className="paywall-icon">⚡</span>
           </div>
           <h2>{t('paywall.upgradeTitle')}</h2>
           <p>{t('paywall.upgradeSubtitle')}</p>

           {/* Segmented Control */}
           <div className="billing-tabs">
             <button
               className={`billing-tab ${billing === 'monthly' ? 'billing-tab--active' : ''}`}
               onClick={() => setBilling('monthly')}
             >
               {t('paywall.monthly')}
             </button>
             <button
               className={`billing-tab ${billing === 'yearly' ? 'billing-tab--active' : ''}`}
               onClick={() => setBilling('yearly')}
             >
               {t('paywall.yearly')} <span className="discount">{t('paywall.savePercent')}</span>
             </button>
           </div>
        </div>

        <div className="pricing-cards">
           {/* Free Card */}
           <div className="pricing-card">
              <h3>{t('paywall.freePlan')}</h3>
              <p className="card-desc">{t('paywall.freeDesc')}</p>
              <div className="price">
                 <span className="amount">{t('paywall.freePrice')}</span>
                 <span className="period">{t('paywall.freePerMonth')}</span>
              </div>
              <p className="billing-hint">Free forever</p>
              <button className="pricing-btn secondary" onClick={onClose}>{t('paywall.currentPlan')}</button>
              <ul className="features-list">
                 <li><Check size={16}/> {t('paywall.freeFeat1')}</li>
                 <li><Check size={16}/> {t('paywall.freeFeat2')}</li>
                 <li><Check size={16}/> {t('paywall.freeFeat3')}</li>
                 <li className="disabled"><X size={16}/> {t('paywall.proFeat1')}</li>
                 <li className="disabled"><X size={16}/> {t('paywall.proFeat2')}</li>
              </ul>
           </div>

           {/* Pro Card */}
           <div className="pricing-card highlight">
              <div className="popular-badge"><Sparkles size={12}/> {t('paywall.proBadge')}</div>
              <h3>{t('paywall.proPlan')}</h3>
              <p className="card-desc">{t('paywall.proDesc')}</p>
              <div className="price">
                 <span className="amount">{billing === 'monthly' ? '$30' : '$12'}</span>
                 <span className="period">{t('paywall.freePerMonth')}</span>
              </div>
              <p className="billing-hint">{billing === 'yearly' ? t('paywall.billedYearly') : t('paywall.billedMonthly')}</p>
              <button className="pricing-btn primary-gradient" onClick={handleUpgrade}>
                <Sparkles size={16} /> {t('paywall.upgradeToPro')}
              </button>
              <ul className="features-list">
                 <li><Check size={16} className="text-primary"/> <b>{t('paywall.proFeat1')}</b></li>
                 <li><Check size={16} className="text-primary"/> <b>{t('paywall.proFeat2')}</b></li>
                 <li><Check size={16} className="text-primary"/> <b>{t('paywall.proFeat3')}</b></li>
                 <li><Check size={16} className="text-primary"/> {t('paywall.proFeat4')}</li>
              </ul>
           </div>
        </div>
      </div>
    </div>
  );
}
