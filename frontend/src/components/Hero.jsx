import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toNepaliDigits } from '../utils/nepaliFormat';
import LanguageSwitcher from './LanguageSwitcher';
import './Hero.css';

const Hero = () => {
  const { t, i18n } = useTranslation();
  const currentLng = i18n.language;
  const getTitleParts = (fullTitle) => {
    const firstSpaceIndex = fullTitle.indexOf(' ');
    if (firstSpaceIndex === -1) return { first: fullTitle, rest: '' };
    return {
      first: fullTitle.substring(0, firstSpaceIndex),
      rest: fullTitle.substring(firstSpaceIndex)
    };
  };

  const fullTitle = t('app_title');
  const { first, rest } = getTitleParts(fullTitle);

  return (
    <div className="hero-container">
      <div className="hero-overlay"></div>
      <div className="hero-content">
        <h1 className="hero-title">
          {currentLng === 'ne' ? (
            <>
              <span className="gold-text">{first}</span>
              {rest}
            </>
          ) : (
            <>
              <span className="gold-text">Jewellery</span> {rest || fullTitle.replace('Jewellery ', '')}
            </>
          )}
        </h1>
        <p className="hero-subtitle">
          {t('hero.subtitle')}
        </p>
        <div className="hero-buttons">
          <Link to="/login" className="hero-button primary">
            {t('nav.login')}
          </Link>
          <Link to="/signup" className="hero-button secondary">
            {t('nav.signup')}
          </Link>
        </div>
      </div>
      <div className="hero-stats">
        <div className="stat-item">
          <h3>{currentLng === 'ne' ? toNepaliDigits('५००+') : '500+'}</h3>
          <p>{t('hero.unique_designs')}</p>
        </div>
        <div className="stat-item">
          <h3>{currentLng === 'ne' ? toNepaliDigits('१०००+') : '1000+'}</h3>
          <p>{t('hero.happy_customers')}</p>
        </div>
        <div className="stat-item">
          <h3>{currentLng === 'ne' ? toNepaliDigits('२४K') : '24K'}</h3>
          <p>{t('hero.pure_gold')}</p>
        </div>
        <div className="stat-item">
          <h3>{currentLng === 'ne' ? toNepaliDigits('५०+') : '50+'}</h3>
          <p>{t('hero.certified_artisans')}</p>
        </div>
      </div>
    </div>
  );
};

export default Hero;