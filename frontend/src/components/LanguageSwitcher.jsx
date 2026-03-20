import React from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import './LanguageSwitcher.css';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const location = useLocation();

  const showLanguageSwitcher =
    location.pathname === '/' ||
    location.pathname === '/admin/dashboard' ||
    location.pathname === '/user/dashboard';

  const changeLanguage = (lng) => {
    console.log('Changing language to:', lng);
    i18n.changeLanguage(lng);
    localStorage.setItem("language", lng);
    
    setTimeout(() => {
      window.dispatchEvent(new Event('languageChanged'));
    }, 50);
  };

  if (!showLanguageSwitcher) return null;

  return (
    <div className="language-switcher">
      <button
        className={i18n.language === 'en' ? 'active' : ''}
        onClick={() => changeLanguage('en')}
      >
        English
      </button>

      <button
        className={i18n.language === 'ne' ? 'active' : ''}
        onClick={() => changeLanguage('ne')}
      >
        नेपाली
      </button>
    </div>
  );
};

export default LanguageSwitcher;