"use client";

import { useState, useEffect } from 'react';
import i18next from 'i18next';
import { languages, defaultLanguage, loadTranslations } from '@/app/i18n/i18n-config';

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
          if (typeof navigator !== 'undefined' && navigator.language) {
            const browserLang = navigator.language.split('-')[0];
            if (languages.includes(browserLang)) {
              lang = browserLang;
            }
          }
          // Save preference
          localStorage.setItem('i18nextLng', lang);
        }
      }
      
      // Load translations
      try {
        await loadTranslations(lang);
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
  
  // Function to change language
  const changeLanguage = async (lang: string) => {
    if (!languages.includes(lang) || lang === currentLanguage) return;
    
    setIsLoading(true);
    try {
      console.log(`[useLanguage] Changing language to: ${lang}`);
      await loadTranslations(lang);
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