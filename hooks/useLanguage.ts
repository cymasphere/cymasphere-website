/**
 * @fileoverview Custom hook for managing language and internationalization.
 * @module hooks/useLanguage
 * @description Provides language detection, switching, and translation loading.
 * Automatically detects language from localStorage or browser preferences and
 * manages i18next language state.
 */

"use client";

import { useState, useEffect } from 'react';
import i18next from 'i18next';
import { languages, defaultLanguage, loadTranslations } from '@/app/i18n/i18n-config';

/**
 * @brief Custom hook for language management.
 * @description Initializes language from localStorage or browser preferences,
 * loads translations, and provides language switching functionality.
 * @returns {Object} Object containing current language, loading state, changeLanguage function, and available languages.
 * @returns {string} returns.currentLanguage - The currently active language code.
 * @returns {boolean} returns.isLoading - Whether translations are currently loading.
 * @returns {Function} returns.changeLanguage - Function to switch to a different language.
 * @returns {string[]} returns.languages - Array of available language codes.
 * @note Automatically saves language preference to localStorage.
 * @note Emits 'languageChange' event on window when language changes.
 * @example
 * const { currentLanguage, changeLanguage, isLoading } = useLanguage();
 * await changeLanguage('es');
 */
export default function useLanguage() {
  const [currentLanguage, setCurrentLanguage] = useState<string>(defaultLanguage);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize language on first render
  useEffect(() => {
    const initLanguage = async () => {
      setIsLoading(true);
      
      // Get language from localStorage or browser preference
      let lang = defaultLanguage;
      
      if (typeof window !== 'undefined') {
        // First check localStorage
        const savedLang = localStorage.getItem('i18nextLng');
        if (savedLang && languages.includes(savedLang)) {
          lang = savedLang;
        } else {
          // Then check browser language
          const browserLang = navigator.language.split('-')[0];
          if (languages.includes(browserLang)) {
            lang = browserLang;
          }
          // Save preference
          localStorage.setItem('i18nextLng', lang);
        }
      }
      
      // Load translations (loadTranslations will use context cache if available)
      try {
        await loadTranslations(lang, true); // Use cache
        // Force language change
        await i18next.changeLanguage(lang);
        setCurrentLanguage(lang);
        console.log(`[useLanguage] Initialized with language: ${lang}`);
      } catch (error) {
        console.error('[useLanguage] Failed to initialize language:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initLanguage();
  }, []);
  
  /**
   * @brief Changes the application language and loads translations.
   * @param {string} lang - The language code to switch to (must be in available languages).
   * @returns {Promise<void>} Promise that resolves when language change is complete.
   * @note Does nothing if language is invalid or already active.
   * @note Saves preference to localStorage and emits 'languageChange' event.
   */
  const changeLanguage = async (lang: string) => {
    if (!languages.includes(lang) || lang === currentLanguage) return;
    
    setIsLoading(true);
    try {
      console.log(`[useLanguage] Changing language to: ${lang}`);
      // loadTranslations will use context cache if available
      await loadTranslations(lang, true); // Use cache
      await i18next.changeLanguage(lang);
      localStorage.setItem('i18nextLng', lang);
      setCurrentLanguage(lang);
      
      // Manually emit the event to force components to update
      window.dispatchEvent(new Event('languageChange'));
    } catch (error) {
      console.error(`[useLanguage] Failed to change language to ${lang}:`, error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    currentLanguage,
    isLoading,
    changeLanguage,
    languages
  };
} 