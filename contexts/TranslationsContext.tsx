/**
 * @fileoverview Translations context provider for caching translations in memory.
 * @module contexts/TranslationsContext
 * @description Provides a centralized cache for translations to avoid repeated API calls.
 * Stores translations in memory and only fetches when needed.
 */

"use client";

import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';

/**
 * @brief Type definition for the translations cache.
 * @description Maps locale codes to their translation data.
 */
type TranslationsCache = {
  [locale: string]: any;
};

/**
 * @brief Type definition for the translations context.
 */
interface TranslationsContextType {
  /**
   * Get translations for a locale (from cache or fetch if not cached)
   */
  getTranslations: (locale: string) => Promise<any>;
  /**
   * Check if translations for a locale are cached
   */
  hasTranslations: (locale: string) => boolean;
  /**
   * Get cached translations for a locale (returns null if not cached)
   */
  getCachedTranslations: (locale: string) => any | null;
  /**
   * Clear the translations cache
   */
  clearCache: () => void;
  /**
   * Preload translations for a locale
   */
  preloadTranslations: (locale: string) => Promise<void>;
}

const TranslationsContext = createContext<TranslationsContextType | undefined>(undefined);

/**
 * @brief Translations context provider component.
 * @description Manages a cache of translations in memory to avoid repeated API calls.
 * @param {Object} props - Component props.
 * @param {ReactNode} props.children - Child components to wrap with translations context.
 * @returns {JSX.Element} TranslationsContext provider wrapping children.
 */
export function TranslationsProvider({ children }: { children: ReactNode }) {
  const [cache, setCache] = useState<TranslationsCache>({});
  const [loadingPromises, setLoadingPromises] = useState<{ [locale: string]: Promise<any> }>({});

  /**
   * Fetch translations from the API
   */
  const fetchTranslations = useCallback(async (locale: string): Promise<any> => {
    try {
      // Remove timestamp to allow proper caching - we handle caching in memory
      const response = await fetch(`/api/translations?locale=${locale}`);
      
      if (!response.ok) {
        console.error(`[TranslationsContext] API returned status ${response.status} for locale ${locale}`);
        throw new Error(`HTTP ${response.status}: Failed to fetch translations`);
      }
      
      const data = await response.json();
      
      if (!data || Object.keys(data).length === 0) {
        console.warn(`[TranslationsContext] Received empty translations for locale ${locale}`);
      }
      
      return data;
    } catch (error) {
      console.error(`[TranslationsContext] Error fetching translations for ${locale}:`, error);
      throw error;
    }
  }, []);

  /**
   * Get translations for a locale (from cache or fetch if not cached)
   */
  const getTranslations = useCallback(async (locale: string): Promise<any> => {
    // Check if already cached
    if (cache[locale]) {
      return cache[locale];
    }

    // Check if already loading
    if (locale in loadingPromises) {
      const existingPromise = loadingPromises[locale];
      if (existingPromise) {
        return existingPromise;
      }
    }

    // Fetch and cache
    const promise = fetchTranslations(locale)
      .then((data) => {
        setCache((prev) => ({
          ...prev,
          [locale]: data,
        }));
        setLoadingPromises((prev) => {
          const newPromises = { ...prev };
          delete newPromises[locale];
          return newPromises;
        });
        return data;
      })
      .catch((error) => {
        setLoadingPromises((prev) => {
          const newPromises = { ...prev };
          delete newPromises[locale];
          return newPromises;
        });
        throw error;
      });

    setLoadingPromises((prev) => ({
      ...prev,
      [locale]: promise,
    }));

    return promise;
  }, [cache, loadingPromises, fetchTranslations]);

  /**
   * Check if translations for a locale are cached
   */
  const hasTranslations = useCallback((locale: string): boolean => {
    return !!cache[locale];
  }, [cache]);

  /**
   * Get cached translations for a locale (returns null if not cached)
   */
  const getCachedTranslations = useCallback((locale: string): any | null => {
    return cache[locale] || null;
  }, [cache]);

  /**
   * Clear the translations cache
   */
  const clearCache = useCallback(() => {
    setCache({});
    setLoadingPromises({});
  }, []);

  /**
   * Preload translations for a locale
   */
  const preloadTranslations = useCallback(async (locale: string): Promise<void> => {
    if (!cache[locale] && !loadingPromises[locale]) {
      await getTranslations(locale);
    }
  }, [cache, loadingPromises, getTranslations]);

  const value = useMemo(
    () => ({
      getTranslations,
      hasTranslations,
      getCachedTranslations,
      clearCache,
      preloadTranslations,
    }),
    [getTranslations, hasTranslations, getCachedTranslations, clearCache, preloadTranslations]
  );

  return (
    <TranslationsContext.Provider value={value}>
      {children}
    </TranslationsContext.Provider>
  );
}

/**
 * @brief Custom hook to access the translations context.
 * @description Provides access to translation caching functions.
 * @returns {TranslationsContextType} Translations context value.
 * @throws {Error} If used outside of TranslationsProvider.
 */
export function useTranslations() {
  const context = useContext(TranslationsContext);
  if (context === undefined) {
    throw new Error('useTranslations must be used within a TranslationsProvider');
  }
  return context;
}

