/**
 * ClickableText - Makes words or sentences in text interactive
 * 
 * Supports two modes:
 * - word: Tokenizes text, makes each word clickable
 * - sentence: Splits text, makes each sentence clickable
 * 
 * Features:
 * - RTL support for Arabic
 * - Mobile-friendly touch targets (48×48px)
 * - Preserves whitespace and punctuation visually
 * - Hover/active states for clickable items
 */

import type { Language } from '../../types';
import type { WordSelectionContext, SentenceSelectionContext } from '../../types/selection';
import { tokenizeWords } from '../../utils/text/tokenizeWords';
import { splitSentences } from '../../utils/text/splitSentences';
import { makeWordSelection, makeSentenceSelection } from '../../types/selection-helpers';

import type { ArabicDialect, SpanishDialect } from '../../types/database';

interface ClickableTextProps {
  text: string;
  language: Language;
  dir: 'rtl' | 'ltr';
  mode: 'word' | 'sentence';
  
  // Context for callbacks
  sourceView?: 'exercise' | 'lookup' | 'vocab' | 'lesson';
  dialect?: ArabicDialect | SpanishDialect;
  contentType?: 'word' | 'sentence' | 'passage' | 'dialog';
  
  // Callbacks
  onWordClick?: (context: WordSelectionContext) => void;
  onSentenceClick?: (context: SentenceSelectionContext) => void;
  
  // Styling
  className?: string;
}

/**
 * ClickableText component
 * 
 * Makes individual words or sentences clickable based on mode.
 * Preserves visual layout while adding interaction.
 */
export function ClickableText({
  text,
  language,
  dir,
  mode,
  sourceView = 'exercise',
  dialect,
  contentType = 'sentence',
  onWordClick,
  onSentenceClick,
  className = '',
}: ClickableTextProps) {
  
  // Word mode: tokenize and make words clickable
  if (mode === 'word') {
    const tokens = tokenizeWords(text, language);
    
    return (
      <div 
        className={`inline ${className}`}
        dir={dir}
      >
        {tokens.map((token, idx) => {
          if (token.type === 'word') {
            return (
              <button
                key={`${token.index}-${idx}`}
                onClick={() => {
                  if (onWordClick) {
                    onWordClick(makeWordSelection(language, {
                      selectedText: token.text,
                      parentSentence: text,
                      sourceView,
                      dialect,
                      contentType,
                    }));
                  }
                }}
                className="
                  inline-block
                  min-w-[48px] min-h-[48px]
                  px-1 py-1
                  text-current
                  hover:bg-amber-500/20 
                  active:bg-amber-500/30
                  rounded
                  transition-colors
                  cursor-pointer
                  touch-manipulation
                "
                style={{ 
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {token.text}
              </button>
            );
          }
          
          // Non-word tokens (punctuation, whitespace) - not clickable
          return (
            <span 
              key={`${token.index}-${idx}`}
              className="inline-block"
            >
              {token.text}
            </span>
          );
        })}
      </div>
    );
  }
  
  // Sentence mode: split and make sentences clickable
  if (mode === 'sentence') {
    const sentences = splitSentences(text, language);
    
    return (
      <div 
        className={`space-y-2 ${className}`}
        dir={dir}
      >
        {sentences.map((sentence, idx) => (
          <button
            key={`${sentence.index}-${idx}`}
            onClick={() => {
              if (onSentenceClick) {
                onSentenceClick(makeSentenceSelection(language, {
                  selectedSentence: sentence.text,
                  parentPassage: text,
                  sourceView,
                  dialect,
                  contentType,
                }));
              }
            }}
            className="
              w-full
              min-h-[48px]
              p-3
              text-left
              text-current
              bg-white/5
              hover:bg-amber-500/20
              active:bg-amber-500/30
              border border-white/10
              hover:border-amber-500/30
              rounded-xl
              transition-colors
              cursor-pointer
              touch-manipulation
            "
            style={{ 
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {sentence.text}
          </button>
        ))}
      </div>
    );
  }
  
  // Fallback: render as plain text
  return (
    <div className={className} dir={dir}>
      {text}
    </div>
  );
}
