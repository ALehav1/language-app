import { useState } from 'react';
import { WordDisplay, type ArabicWordData } from './WordDisplay';
import { findHebrewCognate } from '../utils/hebrewCognates';
import type { SaveDecision } from './SaveDecisionPanel';

/**
 * Core sentence data - the canonical structure for Arabic sentences throughout the app.
 * All components that display sentences should accept this interface.
 */
export interface ArabicSentenceData {
  // Required - both dialects
  arabicMsa: string;
  arabicEgyptian: string;
  transliterationMsa: string;
  transliterationEgyptian: string;
  english: string;
  
  // Optional
  explanation?: string;
  
  // Word breakdown - each word in the sentence
  words?: ArabicWordData[];
}

/**
 * Props for SentenceDisplay component
 */
interface SentenceDisplayProps {
  // Core sentence data
  sentence: ArabicSentenceData;
  
  // Display options
  size?: 'compact' | 'normal' | 'large';
  dialectPreference?: 'egyptian' | 'standard';
  showWordBreakdown?: boolean;
  showSaveOption?: boolean;
  showExplanation?: boolean;
  
  // State
  isSaved?: boolean;
  
  // Callbacks
  onSave?: () => void;
  onWordTap?: (word: ArabicWordData) => void;
  onWordSave?: (word: ArabicWordData, decision: SaveDecision) => void;
  onTap?: () => void;
}

/**
 * Font size mappings for different display sizes
 */
const FONT_SIZES = {
  compact: {
    arabicPrimary: 'text-xl',
    arabicSecondary: 'text-lg',
    transliteration: 'text-sm',
    english: 'text-sm',
  },
  normal: {
    arabicPrimary: 'text-2xl',
    arabicSecondary: 'text-xl',
    transliteration: 'text-base',
    english: 'text-base',
  },
  large: {
    arabicPrimary: 'text-3xl',
    arabicSecondary: 'text-2xl',
    transliteration: 'text-lg',
    english: 'text-lg',
  },
};

/**
 * SentenceDisplay - Unified component for displaying Arabic sentences.
 * 
 * Used everywhere a sentence needs to be displayed:
 * - Exercise feedback example sentences
 * - Lookup example sentences
 * - Lookup passage sentences
 * - My Sentences list and detail
 * 
 * Features:
 * - Shows preferred dialect first (Egyptian by default)
 * - Both dialect versions visible
 * - Word-by-word breakdown with tap-to-save
 * - Each word shows Hebrew cognate inline
 * - Save sentence option
 * - Explanation/grammar notes
 */
export function SentenceDisplay({
  sentence,
  size = 'normal',
  dialectPreference = 'egyptian',
  showWordBreakdown = false,
  showSaveOption = false,
  showExplanation = true,
  isSaved = false,
  onSave,
  onWordTap,
  onWordSave,
  onTap,
}: SentenceDisplayProps) {
  const fonts = FONT_SIZES[size];
  
  // State for expanded word modal
  const [expandedWord, setExpandedWord] = useState<ArabicWordData | null>(null);
  
  // Determine which dialect to show first based on preference
  const primaryArabic = dialectPreference === 'egyptian' 
    ? sentence.arabicEgyptian 
    : sentence.arabicMsa;
  const secondaryArabic = dialectPreference === 'egyptian' 
    ? sentence.arabicMsa 
    : sentence.arabicEgyptian;
  const primaryTranslit = dialectPreference === 'egyptian'
    ? sentence.transliterationEgyptian
    : sentence.transliterationMsa;
  const secondaryTranslit = dialectPreference === 'egyptian'
    ? sentence.transliterationMsa
    : sentence.transliterationEgyptian;
  const primaryLabel = dialectPreference === 'egyptian' ? '🇪🇬 Egyptian (Spoken)' : '📖 MSA (Formal)';
  const secondaryLabel = dialectPreference === 'egyptian' ? '📖 MSA (Formal)' : '🇪🇬 Egyptian (Spoken)';

  // Handle word tap - either use callback or show modal
  const handleWordTap = (word: ArabicWordData) => {
    if (onWordTap) {
      onWordTap(word);
    } else {
      setExpandedWord(word);
    }
  };

  // Wrapper element - button if tappable, div otherwise
  const Wrapper = onTap ? 'button' : 'div';
  const wrapperProps = onTap ? { onClick: onTap, className: 'w-full text-left' } : {};

  return (
    <>
      <Wrapper {...wrapperProps}>
        <div className="space-y-3">
          {/* Primary dialect (Egyptian by default) */}
          <div className="border-l-4 border-amber-500/50 pl-4">
            <div className="text-amber-400/60 text-xs font-bold uppercase tracking-wider mb-1">
              {primaryLabel}
            </div>
            <div className={`${fonts.arabicPrimary} font-arabic text-white text-right leading-relaxed`} dir="rtl">
              {primaryArabic}
            </div>
            <div className={`${fonts.transliteration} text-amber-400/80 italic mt-1`}>
              {primaryTranslit}
            </div>
          </div>
          
          {/* Secondary dialect (MSA by default) */}
          <div className="border-l-4 border-teal-500/30 pl-4 opacity-70">
            <div className="text-teal-400/60 text-xs font-bold uppercase tracking-wider mb-1">
              {secondaryLabel}
            </div>
            <div className={`${fonts.arabicSecondary} font-arabic text-white/80 text-right leading-relaxed`} dir="rtl">
              {secondaryArabic}
            </div>
            <div className={`text-sm text-teal-400/60 italic mt-1`}>
              {secondaryTranslit}
            </div>
          </div>
          
          {/* English translation */}
          <div className={`${fonts.english} text-white/80`}>
            {sentence.english}
          </div>
          
          {/* Explanation/grammar notes */}
          {showExplanation && sentence.explanation && (
            <div className="text-sm text-white/50 italic border-t border-white/10 pt-2">
              💡 {sentence.explanation}
            </div>
          )}
          
          {/* Word-by-word breakdown */}
          {showWordBreakdown && sentence.words && sentence.words.length > 0 && (
            <div className="pt-2">
              <div className="text-purple-400/70 text-xs font-bold uppercase tracking-wider mb-3">
                Word Breakdown
              </div>
              <div className="space-y-2">
                {sentence.words.map((word, idx) => {
                  // Get Hebrew cognate for this word
                  const hebrewCognate = findHebrewCognate(word.arabic) || 
                    findHebrewCognate(word.arabicEgyptian || '');
                  
                  return (
                    <button
                      key={idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleWordTap(word);
                      }}
                      className="w-full relative p-3 rounded-xl text-left bg-white/5 hover:bg-amber-500/20 border border-white/10 hover:border-amber-500/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          {/* Arabic word */}
                          <div className="text-3xl font-arabic text-white mb-1" dir="rtl">
                            {dialectPreference === 'egyptian' 
                              ? (word.arabicEgyptian || word.arabic)
                              : word.arabic}
                          </div>
                          {/* Translation */}
                          <div className="text-white/80 text-base mb-1">
                            {word.translation}
                          </div>
                          {/* Transliteration */}
                          <div className="text-amber-400/80 text-sm">
                            {dialectPreference === 'egyptian'
                              ? (word.transliterationEgyptian || word.transliteration)
                              : word.transliteration}
                          </div>
                          {word.partOfSpeech && (
                            <div className="text-white/30 text-xs mt-1">
                              {word.partOfSpeech}
                            </div>
                          )}
                        </div>
                        {/* Hebrew cognate inline */}
                        {hebrewCognate && (
                          <div className="text-right flex-shrink-0">
                            <div className="text-xl font-hebrew text-blue-300">
                              {hebrewCognate.root}
                            </div>
                            <div className="text-xs text-white/40">
                              {hebrewCognate.meaning}
                            </div>
                          </div>
                        )}
                      </div>
                      {/* Tap indicator */}
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-500/80 rounded-full flex items-center justify-center text-xs text-white">
                        👆
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Save sentence option */}
          {showSaveOption && onSave && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSave();
              }}
              disabled={isSaved}
              className={`w-full py-3 rounded-xl text-sm font-medium transition-colors ${
                isSaved
                  ? 'bg-green-500/20 text-green-400 cursor-default'
                  : 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30'
              }`}
            >
              {isSaved ? '✓ Saved to My Sentences' : '💬 Save Sentence'}
            </button>
          )}
        </div>
      </Wrapper>
      
      {/* Expanded word modal */}
      {expandedWord && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => setExpandedWord(null)}
        >
          <div 
            className="glass-card p-5 max-w-md w-full max-h-[85vh] overflow-y-auto space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Word Details</h3>
              <button 
                onClick={() => setExpandedWord(null)}
                className="text-white/50 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>
            
            {/* Word display */}
            <WordDisplay
              word={expandedWord}
              size="large"
              showHebrewCognate={true}
              showLetterBreakdown={true}
              showSaveOption={!!onWordSave}
              dialectPreference={dialectPreference}
              onSave={onWordSave ? (decision) => {
                onWordSave(expandedWord, decision);
                setExpandedWord(null);
              } : undefined}
            />
            
            {/* Close button */}
            <button
              onClick={() => setExpandedWord(null)}
              className="w-full py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * SentenceDisplayCard - SentenceDisplay wrapped in a card container.
 * Use this when you want the sentence displayed in a standalone card.
 */
export function SentenceDisplayCard(props: SentenceDisplayProps & { className?: string }) {
  const { className = '', ...sentenceProps } = props;
  return (
    <div className={`glass-card p-4 ${className}`}>
      <SentenceDisplay {...sentenceProps} />
    </div>
  );
}
