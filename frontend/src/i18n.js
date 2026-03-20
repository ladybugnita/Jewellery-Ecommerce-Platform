import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslation from './locales/en.json';
import neTranslation from './locales/ne.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
  resources: {
    en: enTranslation,
    ne: neTranslation
  },
  fallbackLng: 'en',
  lng: localStorage.getItem("language") || "en",
  interpolation: {
    escapeValue: false
  }
});

export default i18n;