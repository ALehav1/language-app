import { useState } from 'react';
import { findHebrewCognate } from '../utils/hebrewCognates';
import { SaveDecisionPanel, type SaveDecision } from './SaveDecisionPanel';
import type { HebrewCognate } from '../types';
import { generateArabicBreakdownByWord } from '../utils/arabicBreakdown';

/**
 * Letter breakdown structure
 */
export interface WordBreakdown {
  letter: string;
  name: string;
  sound: string;
}

/**
 * Example sentence structure - both dialects
 */
export interface ExampleSentence {
  arabic_msa: string;
  arabic_egyptian: string;
  transliteration_msa: string;
  transliteration_egyptian: string;
  english: string;
  explanation?: string;
}

/**
 * Memory aid structure
 */
export interface MemoryAid {
  note?: string;
  imageUrl?: string;
}

/**
 * Core word data - the canonical structure for Arabic words throughout the app.
 * All components that display words should accept this interface.
 */
export interface ArabicWordData {
  // Required
  arabic: string;              // MSA with harakat (vowel diacritics)
  translation: string;
  
  // Optional - dialect variants
  arabicEgyptian?: string;     // Egyptian variant if different from MSA
  transliteration?: string;    // MSA transliteration
  transliterationEgyptian?: string;
  
  // Optional - enrichments (can be fetched or provided)
  hebrewCognate?: HebrewCognate | null;
  letterBreakdown?: WordBreakdown[];
  exampleSentences?: ExampleSentence[];
  
  // Optional - metadata
  partOfSpeech?: string;
}

/**
 * Props for WordDisplay component
 */
interface WordDisplayProps {
  // Core word data
  word: ArabicWordData;
  
  // Display options
  size?: 'compact' | 'normal' | 'large';
  showHebrewCognate?: boolean;
  showLetterBreakdown?: boolean;
  showExampleSentences?: boolean;
  showSaveOption?: boolean;
  showPronunciations?: boolean;
  dialectPreference?: 'egyptian' | 'standard';
  
  // State (for already-saved words)
  isSaved?: boolean;
  savedStatus?: 'active' | 'learned';
  savedMemoryAid?: MemoryAid;
  
  // Callbacks
  onSave?: (decision: SaveDecision, memoryAid?: MemoryAid) => void;
  onTap?: () => void;
}

/**
 * Font size mappings for different display sizes
 */
const FONT_SIZES = {
  compact: {
    arabic: 'text-2xl',
    translation: 'text-sm',
    transliteration: 'text-sm',
    hebrew: 'text-sm',
  },
  normal: {
    arabic: 'text-4xl',
    translation: 'text-lg',
    transliteration: 'text-base',
    hebrew: 'text-base',
  },
  large: {
    arabic: 'text-5xl',
    translation: 'text-xl',
    transliteration: 'text-lg',
    hebrew: 'text-lg',
  },
};

/**
 * WordDisplay - Unified component for displaying Arabic words.
 * 
 * Used everywhere a word needs to be displayed:
 * - Exercise feedback
 * - Lookup results (single word or word breakdown)
 * - My Vocabulary list and detail
 * - Passage word breakdowns
 * - Example sentence word breakdowns
 * 
 * Features:
 * - Arabic text with proper RTL and font sizing
 * - Egyptian pronunciation shown first (larger), MSA second (smaller)
 * - Hebrew cognate displayed inline when available
 * - Letter breakdown (horizontal RTL)
 * - Example sentences (clickable to expand)
 * - Save decision panel integration
 * - Memory aid support
 */
export function WordDisplay({
  word,
  size = 'normal',
  showHebrewCognate = true,
  showLetterBreakdown = false,
  showExampleSentences = false,
  showSaveOption = false,
  showPronunciations = true,
  dialectPreference = 'egyptian',
  isSaved = false,
  savedStatus,
  savedMemoryAid,
  onSave,
  onTap,
}: WordDisplayProps) {
  const fonts = FONT_SIZES[size];
  
  // State for expanded sections
  const [showSentenceModal, setShowSentenceModal] = useState<ExampleSentence | null>(null);
  
  // Determine which dialect to show first based on preference
  const primaryArabic = dialectPreference === 'egyptian' 
    ? (word.arabicEgyptian || word.arabic) 
    : word.arabic;
    
  // Determine Hebrew cognate - use provided or lookup from static table for both MSA and Egyptian
  const hebrewCognate = word.hebrewCognate !== undefined 
    ? word.hebrewCognate 
    : (findHebrewCognate(word.arabic) || findHebrewCognate(word.arabicEgyptian || ''));
  
  // Generate letter breakdown if needed and not provided
  console.log('[WordDisplay] Before generating breakdown:', {
    'word.letterBreakdown': word.letterBreakdown,
    showLetterBreakdown,
    primaryArabic,
    'should generate': showLetterBreakdown && primaryArabic && !word.letterBreakdown
  });
  
  const letterBreakdown = word.letterBreakdown || 
    (showLetterBreakdown && primaryArabic ? generateArabicBreakdownByWord(primaryArabic) : []);
  
  console.log('[WordDisplay] After generating breakdown:', {
    letterBreakdown,
    'letterBreakdown.length': letterBreakdown.length,
    'letterBreakdown type': typeof letterBreakdown,
    'is array': Array.isArray(letterBreakdown),
    'first item': letterBreakdown[0],
    'first item letters': (letterBreakdown[0] as any)?.letters
  });
  
  const primaryTranslit = dialectPreference === 'egyptian'
    ? (word.transliterationEgyptian || word.transliteration)
    : word.transliteration;
  const secondaryTranslit = dialectPreference === 'egyptian'
    ? (word.transliterationEgyptian !== word.transliteration ? word.transliteration : null)
    : (word.transliterationEgyptian && word.transliterationEgyptian !== word.transliteration ? word.transliterationEgyptian : null);

  // Wrapper element - button if tappable, div otherwise
  const Wrapper = onTap ? 'button' : 'div';
  const wrapperProps = onTap ? { onClick: onTap, className: 'w-full text-left' } : {};

  return (
    <>
      <Wrapper {...wrapperProps}>
        <div className="space-y-3">
          {/* Main word display - Egyptian Arabic centered and prominent */}
          <div className="space-y-4">
            {/* Arabic word - LARGE and CENTERED */}
            <div className="text-center">
              <div className={`${fonts.arabic} font-arabic font-bold text-white leading-tight`} dir="rtl">
                {primaryArabic}
              </div>
            </div>
            
            {/* Translation and Transliteration aligned */}
            <div className="text-center space-y-2">
              {/* Translation */}
              <div className={`${fonts.translation} text-white/90 font-medium`}>
                {word.translation}
              </div>
              
              {/* Pronunciations */}
              {showPronunciations && (primaryTranslit || secondaryTranslit) && (
                <div className="space-y-1">
                  {/* Primary dialect pronunciation */}
                  {primaryTranslit && (
                    <div className="text-amber-400">
                      <span className="text-amber-400/60 text-sm">
                        {dialectPreference === 'egyptian' ? '🇪🇬' : '📖'}
                      </span>{' '}
                      <span className={`${fonts.transliteration} font-medium`}>'{primaryTranslit}</span>
                    </div>
                  )}
                  {/* Secondary dialect pronunciation - smaller */}
                  {secondaryTranslit && (
                    <div className="text-white/40 text-sm">
                      <span className="text-white/30 text-xs">
                        {dialectPreference === 'egyptian' ? '📖' : '🇪🇬'}
                      </span>{' '}
                      <span className="text-sm">'{secondaryTranslit}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Hebrew cognate - smaller, less prominent */}
            {showHebrewCognate && hebrewCognate && (
              <div className="text-center">
                <div className="inline-flex items-center gap-2 text-blue-300/60">
                  <span className={`${fonts.hebrew} font-hebrew`}>
                    {hebrewCognate.root}
                  </span>
                  <span className="text-sm text-white/40">
                    ({hebrewCognate.meaning})
                  </span>
                </div>
                {hebrewCognate.notes && (
                  <div className="text-xs text-white/30 italic mt-1">
                    {hebrewCognate.notes}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Letter breakdown */}
          {showLetterBreakdown && (
            <div className="glass-card p-3">
              <div className="text-teal-400/70 text-xs font-bold uppercase tracking-wider mb-2">
                Letter Breakdown
              </div>
              {letterBreakdown && letterBreakdown.length > 0 ? (
                <div className="space-y-2">
                  {letterBreakdown.map((wordBreakdown: any, wordIdx: number) => (
                    <div key={wordIdx} className="flex flex-wrap justify-end gap-1" dir="rtl">
                      {(wordBreakdown.letters || []).map((letter: any, letterIdx: number) => (
                        <div 
                          key={letterIdx}
                          className="flex flex-col items-center bg-white/5 rounded-lg px-3 py-2 min-w-[50px]"
                        >
                          <span className="text-2xl font-arabic text-white mb-1">{letter.letter}</span>
                          <span className="text-xs text-white/60 text-center leading-tight">{letter.name}</span>
                          <span className="text-sm text-teal-400/80 font-mono">/{letter.sound}/</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-white/40 text-sm italic">
                  No letter breakdown available
                </div>
              )}
            </div>
          )}
          
          {/* Example sentences */}
          {showExampleSentences && word.exampleSentences && word.exampleSentences.length > 0 && (
            <div className="glass-card p-3">
              <div className="text-purple-400/70 text-xs font-bold uppercase tracking-wider mb-2">
                Example Sentences
              </div>
              <div className="space-y-2">
                {word.exampleSentences.map((sentence, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowSentenceModal(sentence);
                    }}
                    className="w-full text-left bg-white/5 rounded-xl p-3 hover:bg-white/10 transition-colors"
                  >
                    {/* Egyptian version first - LARGER */}
                    <div className="text-2xl font-arabic text-white text-right mb-2" dir="rtl">
                      {sentence.arabic_egyptian}
                    </div>
                    <div className="text-base text-amber-400/80 italic mb-1">
                      {sentence.transliteration_egyptian}
                    </div>
                    <div className="text-white/80 text-base">
                      {sentence.english}
                    </div>
                    <div className="text-xs text-purple-300/50 text-center mt-2">
                      Tap to view details
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Save decision panel */}
          {showSaveOption && onSave && (
            <SaveDecisionPanel
              primaryText={word.arabic}
              translation={word.translation}
              onDecision={onSave}
              alreadySaved={isSaved}
              currentStatus={savedStatus}
              existingMemoryAid={savedMemoryAid}
            />
          )}
        </div>
      </Wrapper>
      
      {/* Sentence detail modal */}
      {showSentenceModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
          onClick={() => setShowSentenceModal(null)}
        >
          <div 
            className="glass-card p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold">Sentence Details</h3>
              <button 
                onClick={() => setShowSentenceModal(null)}
                className="text-white/50 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>

            {/* Egyptian (spoken) - PRIMARY */}
            <div className="border-l-4 border-amber-500 pl-4 py-2">
              <div className="text-amber-400/70 text-xs font-bold uppercase tracking-wider mb-2">
                🇪🇬 Egyptian Arabic (Spoken)
              </div>
              <div className="text-3xl font-arabic text-white text-right leading-relaxed" dir="rtl">
                {showSentenceModal.arabic_egyptian}
              </div>
              <div className="text-lg text-amber-400/80 italic mt-2">
                {showSentenceModal.transliteration_egyptian}
              </div>
            </div>

            {/* MSA (formal) */}
            <div className="border-l-4 border-teal-500/50 pl-4 py-2 opacity-80">
              <div className="text-teal-400/70 text-xs font-bold uppercase tracking-wider mb-2">
                📖 Modern Standard Arabic (Formal)
              </div>
              <div className="text-2xl font-arabic text-white/80 text-right leading-relaxed" dir="rtl">
                {showSentenceModal.arabic_msa}
              </div>
              <div className="text-base text-teal-400/70 italic mt-2">
                {showSentenceModal.transliteration_msa}
              </div>
            </div>

            {/* English translation */}
            <div className="bg-white/5 rounded-xl p-4">
              <div className="text-white/50 text-xs font-bold uppercase tracking-wider mb-2">
                English
              </div>
              <div className="text-white text-lg">
                {showSentenceModal.english}
              </div>
            </div>

            {/* Explanation if present */}
            {showSentenceModal.explanation && (
              <div className="bg-purple-500/10 rounded-xl p-4 border border-purple-500/20">
                <div className="text-purple-400/70 text-xs font-bold uppercase tracking-wider mb-2">
                  💡 Grammar Note
                </div>
                <div className="text-white/80 text-sm">
                  {showSentenceModal.explanation}
                </div>
              </div>
            )}

            {/* Close button */}
            <button
              onClick={() => setShowSentenceModal(null)}
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
 * WordDisplayCard - WordDisplay wrapped in a card container.
 * Use this when you want the word displayed in a standalone card.
 */
export function WordDisplayCard(props: WordDisplayProps & { className?: string }) {
  const { className = '', ...wordProps } = props;
  return (
    <div className={`glass-card p-4 ${className}`}>
      <WordDisplay {...wordProps} />
    </div>
  );
}
