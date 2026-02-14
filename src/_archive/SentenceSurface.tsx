/**
 * SentenceSurface - THE CANONICAL sentence renderer for the entire app
 * 
 * INVARIANT: This is the ONLY sentence renderer used across:
 * - Lookup results (sentence tiles)
 * - Saved sentences view
 * - Exercise feedback
 * 
 * Contract:
 * - Whole sentence = one tile
 * - Arabic: Full-width display with word breakdown as rows
 * - Spanish: Inline chips (LTR), each chip shows Spanish token + English gloss
 * - Clicking a word/chip navigates to WordSurface route (NOT a modal)
 * 
 * This component does NOT render WordSurface directly.
 * Word clicks trigger navigation to the word detail page.
 */

import { useNavigate } from 'react-router-dom';
import type { Language } from '../../types';

/**
 * Word data within a sentence
 */
export interface SentenceWord {
  text: string;           // Primary form (Arabic or Spanish)
  translation: string;    // English gloss
  textAlt?: string;       // Alternate form (Egyptian Arabic or Spain Spanish)
  transliteration?: string;
}

/**
 * Core sentence data structure
 */
export interface SentenceData {
  // Primary sentence text
  text: string;
  textAlt?: string;       // Alternate dialect (Egyptian Arabic, Spain Spanish)
  
  // Translation
  translation: string;
  
  // Transliteration (Arabic only)
  transliteration?: string;
  transliterationAlt?: string;
  
  // Word breakdown for interactive chips
  words?: SentenceWord[];
  
  // Optional explanation
  explanation?: string;
}

/**
 * Props for SentenceSurface
 */
export interface SentenceSurfaceProps {
  sentence: SentenceData;
  language: Language;
  
  // Display options
  dialectPreference?: 'primary' | 'secondary';
  showWordBreakdown?: boolean;
  showTransliteration?: boolean;
  showExplanation?: boolean;
  
  // Actions
  onSave?: () => void;
  isSaved?: boolean;
}

/**
 * SentenceSurface - Canonical sentence renderer
 */
export function SentenceSurface({
  sentence,
  language,
  dialectPreference = 'primary',
  showWordBreakdown = true,
  showTransliteration = true,
  showExplanation = true,
}: SentenceSurfaceProps) {
  const navigate = useNavigate();
  const isArabic = language === 'arabic';
  
  // Get display text based on dialect preference
  const displayText = dialectPreference === 'secondary' && sentence.textAlt
    ? sentence.textAlt
    : sentence.text;
  
  const displayTransliteration = dialectPreference === 'secondary' && sentence.transliterationAlt
    ? sentence.transliterationAlt
    : sentence.transliteration;

  // Handle word chip click - navigate to word detail page
  const handleWordClick = (word: SentenceWord) => {
    navigate(`/vocabulary/word?from=lookup&text=${encodeURIComponent(word.text)}`, {
      state: {
        wordData: {
          arabic: isArabic ? word.text : undefined,
          arabic_egyptian: isArabic ? word.textAlt : undefined,
          spanish_latam: !isArabic ? word.text : undefined,
          spanish_spain: !isArabic ? word.textAlt : undefined,
          translation: word.translation,
          transliteration: word.transliteration,
        },
        language,
        parentSentence: sentence.text,
      }
    });
  };

  return (
    <div className="glass-card p-4 space-y-3">
      {/* Main sentence text */}
      <div className={`text-xl font-semibold text-white leading-relaxed ${isArabic ? 'text-right font-arabic' : ''}`} dir={isArabic ? 'rtl' : 'ltr'}>
        {displayText}
      </div>
      
      {/* Transliteration (Arabic only) */}
      {isArabic && showTransliteration && displayTransliteration && (
        <div className="text-white/60 text-sm italic">
          {displayTransliteration}
        </div>
      )}
      
      {/* Translation */}
      <div className="text-white/80">
        {sentence.translation}
      </div>
      
      {/* Word breakdown - chips for Spanish, rows for Arabic */}
      {showWordBreakdown && sentence.words && sentence.words.length > 0 && (
        <div className={`pt-2 border-t border-white/10 ${isArabic ? 'space-y-2' : 'flex flex-wrap gap-2'}`}>
          {sentence.words.map((word, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleWordClick(word)}
              className={isArabic 
                ? 'w-full text-right p-2 rounded-lg bg-white/5 hover:bg-teal-500/20 transition-colors border border-transparent hover:border-teal-500/30'
                : 'inline-flex flex-col items-center px-3 py-2 rounded-lg bg-white/10 hover:bg-amber-500/20 transition-colors border border-white/10 hover:border-amber-500/30'
              }
            >
              {isArabic ? (
                // Arabic: Full-width row
                <div className="flex items-center justify-between gap-4" dir="rtl">
                  <span className="text-white font-arabic text-lg">{word.text}</span>
                  <span className="text-white/60 text-sm">{word.translation}</span>
                </div>
              ) : (
                // Spanish: Compact chip
                <>
                  <span className="text-white font-semibold">{word.text}</span>
                  <span className="text-white/60 text-xs">{word.translation}</span>
                </>
              )}
            </button>
          ))}
        </div>
      )}
      
      {/* Explanation */}
      {showExplanation && sentence.explanation && (
        <div className="text-xs text-purple-300/70 italic pt-2 border-t border-white/10">
          💡 {sentence.explanation}
        </div>
      )}
    </div>
  );
}

/**
 * SentenceSurfaceCard - Already includes card styling
 * Use when you don't want the default glass-card
 */
export function SentenceSurfaceCompact(props: SentenceSurfaceProps) {
  return (
    <div className="p-3">
      <SentenceSurface {...props} />
    </div>
  );
}
