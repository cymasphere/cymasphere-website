"use client";

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Languages we support
export const languages = ['en', 'es', 'fr', 'de', 'ja'];
export const defaultLanguage = 'en';

// Function to load translations for a language
export const loadTranslations = async (locale: string) => {
  try {
    // Use fetch to get translations from our API
    const response = await fetch(`/api/translations?locale=${locale}`);
    const data = await response.json();
    
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