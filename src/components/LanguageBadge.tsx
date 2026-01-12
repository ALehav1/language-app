/**
 * LanguageBadge - Global indicator showing active language/dialect
 * 
 * Prevents mis-testing by making it obvious which mode the app is in.
 * Always visible in top-right of every view.
 */

import { useLanguage } from '../contexts/LanguageContext';

export function LanguageBadge() {
  const { language } = useLanguage();
  
  return (
    <div className="fixed top-4 right-4 z-50 px-3 py-1.5 rounded-full text-xs font-bold bg-white/10 border border-white/20 text-white/80 backdrop-blur-sm">
      {language === 'arabic' ? '🇪🇬 Arabic' : '🇲🇽 Spanish'}
    </div>
  );
}
