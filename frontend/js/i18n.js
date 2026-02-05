/**
 * Farm Resort i18n (Internationalization) Module
 * Supports Arabic (default) and English
 */

const I18n = {
  currentLang: 'ar',
  translations: {},

  /**
   * Initialize i18n - load saved language or default to Arabic
   */
  async init() {
    // Get saved language or default to Arabic
    const savedLang = localStorage.getItem('farm-resort-lang') || 'ar';
    await this.setLanguage(savedLang);
    this.setupLanguageToggle();
  },

  /**
   * Load translation file for a language
   */
  async loadTranslations(lang) {
    try {
      const response = await fetch(`/locales/${lang}.json`);
      if (!response.ok) throw new Error(`Failed to load ${lang} translations`);
      return await response.json();
    } catch (error) {
      console.error('Error loading translations:', error);
      return null;
    }
  },

  /**
   * Set the current language and update UI
   */
  async setLanguage(lang) {
    const translations = await this.loadTranslations(lang);
    if (!translations) return;

    this.currentLang = lang;
    this.translations = translations;

    // Save to localStorage
    localStorage.setItem('farm-resort-lang', lang);

    // Update document direction and lang attribute
    document.documentElement.lang = translations.lang;
    document.documentElement.dir = translations.dir;
    document.body.dir = translations.dir;

    // Update all translatable elements
    this.updateAllTranslations();

    // Update language toggle button text
    this.updateToggleButton();
  },

  /**
   * Get a translation by key path (e.g., 'booking.title')
   */
  t(keyPath, fallback = '') {
    const keys = keyPath.split('.');
    let value = this.translations;

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return fallback || keyPath;
      }
    }

    return value || fallback || keyPath;
  },

  /**
   * Update all elements with data-i18n attribute
   */
  updateAllTranslations() {
    // Update text content
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const translation = this.t(key);
      if (translation) {
        el.textContent = translation;
      }
    });

    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      const translation = this.t(key);
      if (translation) {
        el.placeholder = translation;
      }
    });

    // Update aria-labels
    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
      const key = el.getAttribute('data-i18n-aria');
      const translation = this.t(key);
      if (translation) {
        el.setAttribute('aria-label', translation);
      }
    });

    // Update select options
    document.querySelectorAll('[data-i18n-options]').forEach(select => {
      const optionsKey = select.getAttribute('data-i18n-options');
      // Handle specific select elements
      this.updateSelectOptions(select, optionsKey);
    });
  },

  /**
   * Update select element options based on translation keys
   */
  updateSelectOptions(select, optionsKey) {
    if (optionsKey === 'visitType') {
      const options = select.querySelectorAll('option');
      options.forEach(opt => {
        if (opt.value === '') {
          opt.textContent = this.t('booking.selectVisitType');
        } else if (opt.value === 'زيارة نهارية' || opt.value === 'day') {
          opt.textContent = this.t('booking.dayVisit');
        } else if (opt.value === 'إقامة ليلية' || opt.value === 'night') {
          opt.textContent = this.t('booking.overnightStay');
        }
      });
    } else if (optionsKey === 'chaletType') {
      const options = select.querySelectorAll('option');
      options.forEach(opt => {
        if (opt.value === '' || opt.value === 'يتم الاختيار لاحقاً') {
          opt.textContent = this.t('booking.selectLater');
        } else if (opt.value === 'شاليه مطل على النخيل') {
          opt.textContent = this.t('chalets.palmView.name');
        } else if (opt.value === 'شاليه عائلي') {
          opt.textContent = this.t('chalets.family.name');
        } else if (opt.value === 'شاليه خاص') {
          opt.textContent = this.t('chalets.private.name');
        }
      });
    }
  },

  /**
   * Setup language toggle button
   */
  setupLanguageToggle() {
    const toggleBtn = document.getElementById('lang-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.toggleLanguage());
    }
  },

  /**
   * Toggle between Arabic and English
   */
  async toggleLanguage() {
    const newLang = this.currentLang === 'ar' ? 'en' : 'ar';
    await this.setLanguage(newLang);
  },

  /**
   * Update the toggle button text
   */
  updateToggleButton() {
    const toggleBtn = document.getElementById('lang-toggle');
    if (toggleBtn) {
      toggleBtn.textContent = this.t('common.language');
    }
  },

  /**
   * Get current language
   */
  getLang() {
    return this.currentLang;
  },

  /**
   * Check if current language is RTL
   */
  isRTL() {
    return this.currentLang === 'ar';
  }
};

// Export for use in other scripts
window.I18n = I18n;

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  I18n.init();
});
