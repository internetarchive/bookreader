/**
 * Internationalization (i18n) system for BookReader
 * 
 * This module provides a centralized way to manage translations for all UI text
 * in the BookReader component. It follows the pattern established in the TTS plugin
 * and extends it to cover all user-facing strings.
 */

import { en } from './languages/en.js';
import { de } from './languages/de.js';

// Available languages
export const LANGUAGES = {
  en: { name: 'English', nativeName: 'English', dict: en },
  de: { name: 'German', nativeName: 'Deutsch', dict: de },
};

// Default language
export const DEFAULT_LANGUAGE = 'en';

/**
 * I18n class for managing translations
 */
export class I18n {
  constructor(language = DEFAULT_LANGUAGE) {
    this.currentLanguage = language;
    this.fallbackLanguage = DEFAULT_LANGUAGE;
  }

  /**
   * Get a translation for a given key
   * @param {string} key - Translation key
   * @param {Object} variables - Variables to interpolate
   * @returns {string} Translated text
   */
  t(key, variables = {}) {
    const currentDict = LANGUAGES[this.currentLanguage]?.dict;
    const fallbackDict = LANGUAGES[this.fallbackLanguage]?.dict;
    
    let translation = currentDict?.[key] || fallbackDict?.[key] || key;
    
    // Interpolate variables if present
    if (variables && Object.keys(variables).length > 0) {
      translation = this.interpolate(translation, variables);
    }
    
    return translation;
  }

  /**
   * Interpolate variables in a translation string
   * @param {string} text - Text with variables
   * @param {Object} variables - Variables to interpolate
   * @returns {string} Text with variables replaced
   */
  interpolate(text, variables) {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] !== undefined ? variables[key] : match;
    });
  }

  /**
   * Set the current language
   * @param {string} language - Language code (e.g., 'en', 'de')
   */
  setLanguage(language) {
    if (LANGUAGES[language]) {
      this.currentLanguage = language;
      return true;
    }
    return false;
  }

  /**
   * Get the current language
   * @returns {string} Current language code
   */
  getLanguage() {
    return this.currentLanguage;
  }

  /**
   * Get available languages
   * @returns {Object} Available languages
   */
  getAvailableLanguages() {
    return LANGUAGES;
  }

  /**
   * Check if a language is supported
   * @param {string} language - Language code to check
   * @returns {boolean} True if supported
   */
  isLanguageSupported(language) {
    return !!LANGUAGES[language];
  }

  /**
   * Get language name in native language
   * @param {string} language - Language code
   * @returns {string} Native language name
   */
  getLanguageNativeName(language) {
    return LANGUAGES[language]?.nativeName || language;
  }

  /**
   * Get language name in English
   * @param {string} language - Language code
   * @returns {string} English language name
   */
  getLanguageName(language) {
    return LANGUAGES[language]?.name || language;
  }
}

// Create a default instance
export const i18n = new I18n();

// Export the default instance as default export for backward compatibility
export default i18n;

