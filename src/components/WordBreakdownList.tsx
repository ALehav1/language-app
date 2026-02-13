/**
 * WordBreakdownList - Canonical component for displaying word-by-word breakdown
 * 
 * UX CONTRACT:
 * 
 * Arabic:
 * - dir="rtl"
 * - One word per row (full-width tiles)
 * - Right-aligned
 * - Vertical stack (space-y-2)
 * 
 * Spanish:
 * - LTR
 * - Compact inline chips (inline-flex, wrap)
 * - Content-sized (not full-width)
 * - Shows: Spanish word (top) + English gloss (bottom, smaller)
 * 
 * Clicking a word triggers onWordClick(word) for page navigation - NEVER saves directly
 */

export interface WordBreakdownWord {
  arabic?: string;
  arabic_egyptian?: string;
  transliteration?: string;
  transliteration_egyptian?: string;
  translation: string;
  part_of_speech?: string;
}

interface WordBreakdownListProps {
  words: WordBreakdownWord[];
  language: 'arabic' | 'spanish';
  dialectPreference?: 'egyptian' | 'standard';
  onWordClick: (word: WordBreakdownWord) => void;
}

export function WordBreakdownList({
  words,
  language,
  dialectPreference = 'egyptian',
  onWordClick,
}: WordBreakdownListProps) {
  const isRTL = language === 'arabic';
  const isSpanish = language === 'spanish';

  // P2-A: Spanish uses inline chips, Arabic uses vertical stack
  if (isSpanish) {
    return (
      <div className="flex flex-wrap gap-2" dir="ltr">
        {words.map((word, idx) => {
          // Spanish: word.arabic contains Spanish text, word.translation contains English
          const spanishWord = word.arabic || word.arabic_egyptian || '';
          const englishGloss = word.translation || '';

          return (
            <button
              key={idx}
              onClick={() => onWordClick(word)}
              className="group relative inline-flex flex-col items-center px-3 py-2 rounded-lg transition-colors bg-white/10 hover:bg-amber-500/20 border border-white/10 hover:border-amber-500/30"
            >
              {/* Spanish word (primary, top) */}
              <div className="text-white font-semibold text-base">
                {spanishWord}
              </div>
              
              {/* English gloss (secondary, bottom, smaller) */}
              <div className="text-white/60 text-xs mt-0.5">
                {englishGloss}
              </div>

              {/* Part of speech (optional, subtle) */}
              {word.part_of_speech && (
                <div className="text-white/30 text-[10px] mt-0.5">
                  {word.part_of_speech}
                </div>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Arabic: vertical stack with full-width rows (original behavior)
  return (
    <div
      className="space-y-2"
      dir="rtl"
    >
      {words.map((word, idx) => {
        // For Arabic, show preferred dialect first
        const primaryText = language === 'arabic'
          ? (dialectPreference === 'egyptian'
              ? (word.arabic_egyptian || word.arabic)
              : (word.arabic || word.arabic_egyptian))
          : word.translation;

        const primaryTranslit = language === 'arabic'
          ? (dialectPreference === 'egyptian'
              ? (word.transliteration_egyptian || word.transliteration)
              : (word.transliteration || word.transliteration_egyptian))
          : undefined;

        // Check if word is saved (simplified - would need actual ID matching in production)
        const isSaved = false; // TODO: implement proper saved state checking

        return (
          <button
            key={idx}
            onClick={() => onWordClick(word)}
            className={`group relative w-full px-4 py-3 rounded-lg transition-colors ${
              isRTL ? 'text-right' : 'text-left'
            } ${
              isSaved
                ? 'bg-green-500/10 border border-green-500/30'
                : 'bg-white/10 hover:bg-amber-500/20 border border-white/10 hover:border-amber-500/30'
            }`}
          >
            {/* Primary text (Arabic or Spanish) */}
            <div
              className={`font-semibold text-white mb-1 ${
                language === 'arabic' ? 'text-2xl font-arabic' : 'text-lg'
              }`}
            >
              {primaryText}
            </div>

            {/* Transliteration (Arabic only) */}
            {primaryTranslit && (
              <div className="text-white/60 text-sm mb-1">
                {primaryTranslit}
              </div>
            )}

            {/* Translation */}
            <div className="text-white/80 text-base">
              {language === 'arabic' ? word.translation : ''}
            </div>

            {/* Part of speech */}
            {word.part_of_speech && (
              <div className="text-white/30 text-xs mt-1">
                {word.part_of_speech}
              </div>
            )}

            {/* Clickable indicator (chevron) */}
            <div
              className={`absolute ${isRTL ? 'left-2' : 'right-2'} top-1/2 -translate-y-1/2 text-white/40 group-hover:text-white/80 transition-colors`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isRTL ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'} />
              </svg>
            </div>
          </button>
        );
      })}
    </div>
  );
}

