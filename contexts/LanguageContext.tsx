/**
 * @fileoverview Language context provider for managing internationalization and translations.
 * @module contexts/LanguageContext
 * @description Provides translation functions, language switching, and translation loading state.
 * Integrates with i18next for translation management.
 */

"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import useLanguageHook from '@/hooks/useLanguage';
import i18next from 'i18next';

/**
 * @brief Type definition for the language context.
 * @description Defines the shape of the language context value, including
 * translation function, loading states, current language, and language switching.
 */
interface LanguageContextType {
  t: (key: string, options?: any) => string;
  translationsLoaded: boolean;
  isLoading: boolean;
  currentLanguage: string;
  changeLanguage: (lang: string) => Promise<void>;
  languages: string[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

/**
 * @brief Language context provider component.
 * @description Wraps the application with language context, providing translation
 * functions and language management. Uses the useLanguage hook internally.
 * @param {Object} props - Component props.
 * @param {ReactNode} props.children - Child components to wrap with language context.
 * @returns {JSX.Element} LanguageContext provider wrapping children.
 */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const { currentLanguage, isLoading, changeLanguage, languages } = useLanguageHook();

  const t = (key: string, options?: any): string => {
    const result = i18next.t(key, options);
    return typeof result === 'string' ? result : String(result);
  };

  const translationsLoaded = !isLoading;

  return (
    <LanguageContext.Provider value={{
      t,
      translationsLoaded,
      isLoading,
      currentLanguage,
      changeLanguage,
      languages
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

/**
 * @brief Custom hook to access the language context.
 * @description Provides access to translation functions, current language,
 * language switching, and loading states. Must be used within a LanguageProvider.
 * @returns {LanguageContextType} Language context value.
 * @throws {Error} If used outside of LanguageProvider.
 * @example
 * const { t, currentLanguage, changeLanguage } = useLanguage();
 * const translatedText = t('welcome.message');
 */
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
} 