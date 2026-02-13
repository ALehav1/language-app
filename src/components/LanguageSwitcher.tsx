import { useLanguage } from '../contexts/LanguageContext';

/**
 * LanguageSwitcher - Compact language selection component
 * 
 * Shows current language and allows switching.
 * Used on first-level screens (Lookup, Lessons, Vocabulary).
 */
export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  const handleLanguageChange = (lang: 'arabic' | 'spanish') => {
    console.log('[LanguageSwitcher] setLanguage', lang);
    console.log('[LanguageSwitcher] current language before:', language);
    setLanguage(lang);
    console.log('[LanguageSwitcher] localStorage after:', localStorage.getItem('language-app-selected-language'));
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleLanguageChange('arabic')}
        className={`
          px-3 py-1.5 rounded-lg text-sm font-medium transition-all
          ${
            language === 'arabic'
              ? 'bg-teal-500/30 text-teal-300 border border-teal-500/50'
              : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white/80'
          }
        `}
      >
        🇪🇬 Arabic
      </button>
      <button
        onClick={() => handleLanguageChange('spanish')}
        className={`
          px-3 py-1.5 rounded-lg text-sm font-medium transition-all
          ${
            language === 'spanish'
              ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
              : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white/80'
          }
        `}
      >
        🇲🇽 Spanish
      </button>
    </div>
  );
}
