"use client";

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Languages we support
export const languages = ['en', 'es', 'fr', 'de', 'ja'];
export const defaultLanguage = 'en';

// Function to get the current language preference from localStorage or browser
export const getCurrentLanguage = (): string => {
  if (typeof window === 'undefined') return defaultLanguage;
  
  // First check localStorage for saved preference
  const savedLanguage = window.localStorage.getItem('i18nextLng');
  
  if (savedLanguage && languages.includes(savedLanguage)) {
    return savedLanguage;
  }
  
  // If no saved preference, try to use browser language
  const browserLang = navigator.language.split('-')[0];
  if (languages.includes(browserLang)) {
    // Save the detected browser language for future visits
    window.localStorage.setItem('i18nextLng', browserLang);
    return browserLang;
  }
  
  // Fall back to default language
  window.localStorage.setItem('i18nextLng', defaultLanguage);
  return defaultLanguage;
};

// Function to load translations for a language
export const loadTranslations = async (locale: string) => {
  try {
    // Add timestamp to prevent caching
    const timestamp = new Date().getTime();
    
    // Use fetch to get translations from our API
    const response = await fetch(`/api/translations?locale=${locale}&_=${timestamp}`);
    const data = await response.json();
    
    // Always store language preference in localStorage
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('i18nextLng', locale);
    }
    
    // Initialize i18next with the fetched translations
    if (!i18n.isInitialized) {
      await i18n
        .use(initReactI18next)
        .init({
          lng: locale,
          fallbackLng: defaultLanguage,
          interpolation: {
            escapeValue: false, // React already escapes values
          },
          resources: {
            [locale]: {
              translation: data
            }
          },
          returnNull: false, // Don't return null for missing translations
          returnEmptyString: false, // Don't return empty string for missing translations
        });
    } else {
      // Just change the language and add resources if already initialized
      i18n.changeLanguage(locale);
      i18n.addResourceBundle(locale, 'translation', data, true, true);
    }

    return data;
  } catch (error) {
    console.error(`Error loading translations for ${locale}:`, error);
    return {};
  }
};

export default i18n; 