/**
 * @fileoverview Internationalization configuration and utilities.
 * @module app/i18n/i18n-config
 * @description Provides i18next configuration, language detection, and translation loading.
 * Handles language preference detection from localStorage and browser settings.
 */

"use client";

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Try to import TranslationsContext (may not be available in all contexts)
let useTranslationsContext: (() => any) | null = null;
try {
  const translationsModule = require('@/contexts/TranslationsContext');
  useTranslationsContext = translationsModule.useTranslations;
} catch (e) {
  // Context not available, will use fallback cache
}

/**
 * @brief Array of supported language codes.
 * @description List of all language codes supported by the application.
 */
export const languages = ['en', 'es', 'fr', 'it', 'de', 'pt', 'tr', 'zh', 'ja'];

/**
 * @brief Default language code.
 * @description Fallback language used when no preference is detected.
 */
export const defaultLanguage = 'en';

/**
 * @brief Gets the current language preference from localStorage or browser.
 * @description Checks localStorage first, then browser language settings.
 * Handles language variants (e.g., 'en-US' -> 'en', 'es-MX' -> 'es').
 * @returns {string} Language code to use.
 * @note Saves detected language to localStorage for future use.
 */
export const getCurrentLanguage = (): string => {
  if (typeof window === 'undefined') return defaultLanguage;
  
  // First check localStorage for saved preference
  const savedLanguage = window.localStorage.getItem('i18nextLng');
  
  if (savedLanguage && languages.includes(savedLanguage)) {
    return savedLanguage;
  }
  
  // If no saved preference, try to use browser language with better locale detection
  const browserFullLocale = navigator.language; // e.g., 'en-US', 'fr-FR', 'es-MX'
  const browserLang = browserFullLocale.split('-')[0].toLowerCase(); // Get just the language part

  // Check if the browser language is in our supported languages
  if (languages.includes(browserLang)) {
    window.localStorage.setItem('i18nextLng', browserLang);
    return browserLang;
  }

  // Handle special cases for language variants
  // For example, if browser shows 'en-GB', 'en-US', 'en-CA', etc., use 'en'
  // Or for 'es-MX', 'es-AR', etc., use 'es'
  for (const lang of languages) {
    if (browserFullLocale.toLowerCase().startsWith(lang)) {
      window.localStorage.setItem('i18nextLng', lang);
      return lang;
    }
  }
  
  // Fall back to default language
  window.localStorage.setItem('i18nextLng', defaultLanguage);
  return defaultLanguage;
};

// In-memory cache for translations (fallback if context is not available)
let translationsCache: { [locale: string]: any } = {};

/**
 * @brief Helper function to initialize i18next with translations
 */
const initializeI18n = async (locale: string, data: any) => {
  // Always store language preference in localStorage
  if (typeof window !== 'undefined') {
    window.localStorage.setItem('i18nextLng', locale);
  }
  
  // Initialize i18next with the translations
  if (!i18n.isInitialized) {
    await i18n
      .use(initReactI18next)
      .init({
        lng: locale,
        fallbackLng: defaultLanguage,
        interpolation: {
          escapeValue: false,
        },
        resources: {
          [locale]: {
            translation: data
          }
        },
        returnNull: false,
        returnEmptyString: false,
      });
  } else {
    i18n.changeLanguage(locale);
    i18n.addResourceBundle(locale, 'translation', data, true, true);
  }
};

/**
 * @brief Loads translations for a specified locale from the API or cache.
 * @description Fetches translations from the translations API endpoint (or uses cache)
 * and initializes or updates i18next with the loaded translations.
 * Uses TranslationsContext if available, otherwise falls back to module-level cache.
 * @param {string} locale - The locale code to load translations for.
 * @param {boolean} useCache - Whether to use cached translations if available (default: true).
 * @returns {Promise<object>} Promise resolving to the translation data object.
 * @note Uses TranslationsContext cache if available, otherwise uses module-level cache.
 * @note Initializes i18next if not already initialized.
 * @note Saves language preference to localStorage.
 * @note Returns empty object on error to prevent crashes.
 */
export const loadTranslations = async (locale: string, useCache: boolean = true) => {
  try {
    // Try to use TranslationsContext if available (preferred method)
    if (useCache && useTranslationsContext) {
      try {
        // This will only work if called within a React component that has access to the context
        // For cases where we're not in a React context, we'll fall back to module cache
        const translationsContext = useTranslationsContext();
        if (translationsContext) {
          // Check if already cached
          if (translationsContext.hasTranslations(locale)) {
            const cachedData = translationsContext.getCachedTranslations(locale);
            await initializeI18n(locale, cachedData);
            return cachedData;
          }
          
          // Get from context (will fetch and cache if needed)
          const data = await translationsContext.getTranslations(locale);
          await initializeI18n(locale, data);
          return data;
        }
      } catch (contextError) {
        // Context not available (e.g., called outside React component tree)
        // Fall through to module-level cache
        console.log('[loadTranslations] TranslationsContext not available, using module cache');
      }
    }
    
    // Fallback to module-level cache
    if (useCache && translationsCache[locale]) {
      const cachedData = translationsCache[locale];
      await initializeI18n(locale, cachedData);
      return cachedData;
    }
    
    // Fetch from API (no timestamp to allow browser caching)
    const response = await fetch(`/api/translations?locale=${locale}`);
    
    // Check if response is ok (200-299)
    if (!response.ok) {
      console.error(`[loadTranslations] API returned status ${response.status} for locale ${locale}`);
      throw new Error(`HTTP ${response.status}: Failed to fetch translations`);
    }
    
    const data = await response.json();
    
    // Check if data is empty
    if (!data || Object.keys(data).length === 0) {
      console.warn(`[loadTranslations] Received empty translations for locale ${locale}`);
    }
    
    // Cache the translations in module-level cache
    translationsCache[locale] = data;
    
    await initializeI18n(locale, data);

    return data;
  } catch (error) {
    console.error(`[loadTranslations] Error loading translations for ${locale}:`, error);
    
    // Return an object with the locale key so at least we don't have completely empty data
    return {};
  }
};

export default i18n; 