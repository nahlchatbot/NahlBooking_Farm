import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ar from './locales/ar.json';
import en from './locales/en.json';

const savedLang = localStorage.getItem('admin-lang') || 'ar';

i18n.use(initReactI18next).init({
  resources: {
    ar: { translation: ar },
    en: { translation: en },
  },
  lng: savedLang,
  fallbackLng: 'ar',
  interpolation: {
    escapeValue: false,
  },
});

// Update document direction when language changes
i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
  document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
  document.body.dir = lng === 'ar' ? 'rtl' : 'ltr';
  localStorage.setItem('admin-lang', lng);
});

// Set initial direction
document.documentElement.lang = savedLang;
document.documentElement.dir = savedLang === 'ar' ? 'rtl' : 'ltr';
document.body.dir = savedLang === 'ar' ? 'rtl' : 'ltr';

export default i18n;
