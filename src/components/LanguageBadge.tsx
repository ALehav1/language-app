/**
 * LanguageBadge - Display-only language indicator (top-right on every page)
 *
 * INVARIANT: This is DISPLAY-ONLY. No click behavior.
 * Use LanguageSwitcher in the page header for switching.
 *
 * Hidden on routes where LanguageSwitcher is present (/lookup, /lessons, /vocabulary)
 * to avoid visual overlap/redundancy.
 */

import { useLanguage } from '../contexts/LanguageContext';
import { useLocation } from 'react-router-dom';

// Routes where LanguageSwitcher is shown in the page header
const ROUTES_WITH_SWITCHER = ['/lookup', '/lessons', '/vocabulary'];

export function LanguageBadge() {
  const { language } = useLanguage();
  const { pathname } = useLocation();

  // Hide when LanguageSwitcher is already visible on the page
  if (ROUTES_WITH_SWITCHER.some(route => pathname === route)) {
    return null;
  }

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
