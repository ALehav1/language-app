/**
 * LanguageContext - Global language mode for the entire app
 * 
 * This is the missing control plane. Every feature keys off this.
 * 
 * Responsibilities:
 * - Persist user's language choice
 * - Persist dialect preferences per language (Arabic: egyptian/standard, Spanish: latam/spain)
 * - Provide current language and dialect to all components
 * - Drive routing, lesson generation, vocab filtering
 */

import { createContext, useContext, useState, ReactNode } from 'react';
import type { Language } from '../types';

/** Dialect options for Arabic */
export type ArabicDialect = 'egyptian' | 'standard';

/** Dialect options for Spanish */
export type SpanishDialect = 'latam' | 'spain';

/** Dialect preferences object - stored per language */
export interface DialectPreferences {
  arabic: ArabicDialect;
  spanish: SpanishDialect;
}

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  
  // Dialect preferences
  dialectPreferences: DialectPreferences;
  setArabicDialect: (dialect: ArabicDialect) => void;
  setSpanishDialect: (dialect: SpanishDialect) => void;
  
  // Convenience: get current dialect for active language
  currentDialect: ArabicDialect | SpanishDialect;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export const LANGUAGE_STORAGE_KEY = 'language-app-selected-language';
const DIALECT_STORAGE_KEY = 'language-app-dialect-preferences';

/** Default dialect preferences */
const DEFAULT_DIALECTS: DialectPreferences = {
  arabic: 'egyptian',
  spanish: 'latam',
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Language state
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored === 'arabic' || stored === 'spanish') {
      return stored;
    }
    return 'arabic';
  });

  // Dialect preferences state
  const [dialectPreferences, setDialectPreferences] = useState<DialectPreferences>(() => {
    try {
      const stored = localStorage.getItem(DIALECT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          arabic: parsed.arabic === 'standard' ? 'standard' : 'egyptian',
          spanish: parsed.spanish === 'spain' ? 'spain' : 'latam',
        };
      }
    } catch (e) {
      console.warn('[LanguageContext] Failed to parse dialect preferences:', e);
    }
    return DEFAULT_DIALECTS;
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
  };

  const setArabicDialect = (dialect: ArabicDialect) => {
    const newPrefs = { ...dialectPreferences, arabic: dialect };
    setDialectPreferences(newPrefs);
    localStorage.setItem(DIALECT_STORAGE_KEY, JSON.stringify(newPrefs));
  };

  const setSpanishDialect = (dialect: SpanishDialect) => {
    const newPrefs = { ...dialectPreferences, spanish: dialect };
    setDialectPreferences(newPrefs);
    localStorage.setItem(DIALECT_STORAGE_KEY, JSON.stringify(newPrefs));
  };

  // Convenience getter for current language's dialect
  const currentDialect = language === 'arabic'
    ? dialectPreferences.arabic
    : dialectPreferences.spanish;

  return (
    <LanguageContext.Provider value={{ 
      language, 
      setLanguage,
      dialectPreferences,
      setArabicDialect,
      setSpanishDialect,
      currentDialect,
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
