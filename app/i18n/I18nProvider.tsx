"use client";

import React, { useEffect } from 'react';
import i18next from 'i18next';
import useLanguage from '@/hooks/useLanguage';

interface I18nProviderProps {
  children: React.ReactNode;
}

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