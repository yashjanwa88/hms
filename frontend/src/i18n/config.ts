import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import enCommon from './locales/en/common.json';
import hiCommon from './locales/hi/common.json';
import arCommon from './locales/ar/common.json';

export const resources = {
  en: {
    translation: enCommon,
  },
  hi: {
    translation: hiCommon,
  },
  ar: {
    translation: arCommon,
  },
} as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
    detection: {
      order: ['localStorage', 'cookie', 'htmlTag', 'path', 'subdomain'],
      caches: ['localStorage'],
    },
  });

// Handle RTL for Arabic
i18n.on('languageChanged', (lng) => {
  const dir = lng === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.dir = dir;
  document.documentElement.lang = lng;
});

// Initialize direction on load
const initialLng = i18n.language || 'en';
document.documentElement.dir = initialLng.startsWith('ar') ? 'rtl' : 'ltr';
document.documentElement.lang = initialLng;

export default i18n;
