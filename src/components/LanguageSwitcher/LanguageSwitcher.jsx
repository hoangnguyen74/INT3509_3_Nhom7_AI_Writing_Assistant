import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import './LanguageSwitcher.css';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const toggle = () => {
    const next = i18n.language === 'en' ? 'vi' : 'en';
    i18n.changeLanguage(next);
    localStorage.setItem('writeai-language', next);
  };

  return (
    <button
      className="language-switcher"
      onClick={toggle}
      title={i18n.language === 'en' ? 'Chuyển sang Tiếng Việt' : 'Switch to English'}
    >
      <Globe size={16} />
      <span>{i18n.language === 'en' ? 'EN' : 'VI'}</span>
    </button>
  );
}
