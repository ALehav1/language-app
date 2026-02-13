/**
 * LanguageBadge - Display-only language indicator (top-right on every page)
 * 
 * INVARIANT: This is DISPLAY-ONLY. No click behavior.
 * Use LanguageSwitcher in the page header for switching.
 */

import { useLanguage } from '../contexts/LanguageContext';

export function LanguageBadge() {
  const { language } = useLanguage();
  
  return (
    <div
      className={`fixed top-4 right-4 z-50 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm border pointer-events-none ${
        language === 'arabic' 
          ? 'bg-teal-500/20 border-teal-500/50 text-teal-300' 
          : 'bg-amber-500/20 border-amber-500/50 text-amber-300'
      }`}
      aria-label={`Current language: ${language === 'arabic' ? 'Arabic' : 'Spanish'}`}
    >
      {language === 'arabic' ? '🇪🇬 Arabic' : '🇲🇽 Spanish'}
    </div>
  );
}
