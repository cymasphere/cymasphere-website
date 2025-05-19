"use client";

import React, { useEffect } from 'react';
import { useParams } from 'next/navigation';
import i18n, { loadTranslations, defaultLanguage } from './i18n-config';

interface I18nProviderProps {
  children: React.ReactNode;
}

export default function I18nProvider({ children }: I18nProviderProps) {
  const params = useParams();
  
  // Get locale from URL params
  const locale = (params?.locale as string) || defaultLanguage;
  
  // Load translations whenever locale changes
  useEffect(() => {
    const setupI18n = async () => {
      await loadTranslations(locale);
      console.log(`Loaded translations for ${locale}`);
    };
    
    setupI18n();
  }, [locale]);
  
  return <>{children}</>;
} 