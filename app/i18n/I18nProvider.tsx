/**
 * @fileoverview Internationalization provider component.
 * @module app/i18n/I18nProvider
 * @description Provides i18n context and listens for global language change events.
 * Ensures all components using translations are updated when language changes.
 */

"use client";

import React, { useEffect } from 'react';
import i18next from 'i18next';
import useLanguage from '@/hooks/useLanguage';

/**
 * @brief Interface for I18nProvider component props.
 * @description Defines the props structure for the i18n provider component.
 */
interface I18nProviderProps {
  children: React.ReactNode;
}

/**
 * @brief Internationalization provider component.
 * @description Wraps children with i18n context and listens for global language
 * change events to force component updates. Returns null while translations are loading.
 * @param {I18nProviderProps} props - Component props.
 * @param {React.ReactNode} props.children - Child components to wrap with i18n context.
 * @returns {JSX.Element | null} Children wrapped with i18n context, or null while loading.
 * @note Listens for 'languageChange' window events to trigger i18next language change events.
 */
export default function I18nProvider({ children }: I18nProviderProps) {
  const { currentLanguage, isLoading } = useLanguage();
  
  // Listen for global language change events
  useEffect(() => {
    // Listen for the global language change event
    const handleGlobalLanguageChange = () => {
      console.log('[I18nProvider] Detected global language change event');
      
      // Force a refresh of all components that use translations
      if (i18next.isInitialized) {
        i18next.emit('languageChanged', currentLanguage);
      }
    };
    
    window.addEventListener('languageChange', handleGlobalLanguageChange);
    
    return () => {
      window.removeEventListener('languageChange', handleGlobalLanguageChange);
    };
  }, [currentLanguage]);
  
  if (isLoading) {
    return null;
  }
  
  return <>{children}</>;
} 