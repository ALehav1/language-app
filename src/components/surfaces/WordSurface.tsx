/**
 * WordSurface - THE CANONICAL word renderer for the entire app
 * 
 * INVARIANT: This is the ONLY word renderer used across:
 * - Lookup results
 * - Vocabulary detail
 * - Exercise feedback
 * - Sentence word breakdowns
 * 
 * Internally delegates to language-specific bodies:
 * - WordDisplay (Arabic) - RTL, transliterations, Hebrew cognates, letter breakdown
 * - SpanishWordBody - LTR, LatAm/Spain variants, usage notes, memory aids
 * 
 * All call sites use WordSurface. Never import WordDisplay directly.
 */

import { WordDisplay, type ArabicWordData, type ExampleSentence, type MemoryAid } from '../WordDisplay';
import { SpanishWordBody, type SpanishExampleSentence, type MemoryAid as SpanishMemoryAid } from '../SpanishWordBody';
import type { WordData, SpanishWordData } from '../../types/word';
import type { SaveDecision } from '../SaveDecisionPanel';

/**
 * Props for WordSurface - accepts any language word data
 */
export interface WordSurfaceProps {
  // Word data - either Arabic or Spanish
  word: WordData | ArabicWordData;
  language: 'arabic' | 'spanish';
  
  // Display options
  size?: 'compact' | 'normal' | 'large';
  showHebrewCognate?: boolean;      // Arabic only
  showLetterBreakdown?: boolean;    // Arabic only
  showExampleSentences?: boolean;
  showSaveOption?: boolean;
  showPronunciations?: boolean;     // Arabic only (Spanish uses different display)
  dialectPreference?: 'egyptian' | 'standard' | 'latam' | 'spain';
  
  // State
  isSaved?: boolean;
  savedStatus?: 'active' | 'learned';
  savedMemoryAid?: MemoryAid | SpanishMemoryAid;
  
  // Callbacks
  onSave?: (decision: SaveDecision, memoryAid?: MemoryAid) => void;
  onSaveSentence?: (sentence: ExampleSentence | SpanishExampleSentence) => void;
  isSentenceSaved?: (sentenceText: string) => boolean;
  onTap?: () => void;
}

/**
 * WordSurface - The canonical word renderer
 * 
 * Detects language and delegates to the appropriate body component.
 * This is the ONLY word renderer used across the app.
 */
export function WordSurface({
  word,
  language,
  size = 'normal',
  showHebrewCognate = false,
  showLetterBreakdown = false,
  showExampleSentences = false,
  showSaveOption = false,
  showPronunciations = true,
  dialectPreference,
  isSaved = false,
  savedStatus,
  savedMemoryAid,
  onSave,
  onSaveSentence,
  isSentenceSaved,
  onTap,
}: WordSurfaceProps) {
  
  // Determine language from explicit prop or word data
  const wordLanguage = 'language' in word ? word.language : language;
  const isSpanish = wordLanguage === 'spanish';
  
  // Map dialect preference to language-appropriate value
  const arabicDialect = dialectPreference === 'egyptian' || dialectPreference === 'standard'
    ? dialectPreference
    : 'egyptian';
  const spanishDialect = dialectPreference === 'latam' || dialectPreference === 'spain'
    ? dialectPreference
    : 'latam';
  
  // Wrapper for tap handling
  const Wrapper = onTap ? 'button' : 'div';
  const wrapperProps = onTap 
    ? { onClick: onTap, className: 'w-full text-left', type: 'button' as const }
    : {};

  return (
    <Wrapper {...wrapperProps}>
      {isSpanish ? (
        // Spanish body
        <SpanishWordBody
          word={word as SpanishWordData}
          size={size}
          showExampleSentences={showExampleSentences}
          showSaveOption={showSaveOption}
          dialectPreference={spanishDialect}
          isSaved={isSaved}
          savedStatus={savedStatus}
          savedMemoryAid={savedMemoryAid as SpanishMemoryAid}
          onSave={onSave}
          onSaveSentence={onSaveSentence as ((sentence: SpanishExampleSentence) => void) | undefined}
          isSentenceSaved={isSentenceSaved}
        />
      ) : (
        // Arabic body (existing WordDisplay)
        <WordDisplay
          word={word as ArabicWordData}
          size={size}
          showHebrewCognate={showHebrewCognate}
          showLetterBreakdown={showLetterBreakdown}
          showExampleSentences={showExampleSentences}
          showSaveOption={showSaveOption}
          showPronunciations={showPronunciations}
          dialectPreference={arabicDialect}
          isSaved={isSaved}
          savedStatus={savedStatus}
          savedMemoryAid={savedMemoryAid as MemoryAid}
          onSave={onSave}
          onSaveSentence={onSaveSentence as ((sentence: ExampleSentence) => void) | undefined}
          isSentenceSaved={isSentenceSaved}
        />
      )}
    </Wrapper>
  );
}

/**
 * WordSurfaceCard - WordSurface wrapped in a card container
 */
export function WordSurfaceCard(props: WordSurfaceProps & { className?: string }) {
  const { className = '', ...displayProps } = props;
  return (
    <div className={`glass-card p-4 ${className}`}>
      <WordSurface {...displayProps} />
    </div>
  );
}
