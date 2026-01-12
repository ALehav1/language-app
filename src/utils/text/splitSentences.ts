/**
 * Sentence splitting utility for clickable text
 * 
 * Splits multi-sentence text into individual sentences while preserving:
 * - Punctuation with each sentence
 * - Position indices for click handling
 * 
 * Used by ClickableText component in sentence mode to make each sentence clickable.
 */

import type { Language } from '../../types';

export interface Sentence {
  text: string;
  index: number;  // Position in original string
}

/**
 * Splits text into sentences based on language-specific punctuation.
 * 
 * Rules:
 * - Arabic: Split on [.!?؟] followed by whitespace or end of string
 * - Spanish: Split on [.!?¿¡] followed by whitespace or end of string
 * - Punctuation kept with sentence
 * - Edge cases: Handles abbreviations on best-effort basis
 * 
 * Known limitations:
 * - Does not handle abbreviations perfectly (e.g., "Dr." may cause split)
 * - Spanish inverted punctuation (¿¡) at start not used as split point
 * 
 * @param text - Text to split into sentences
 * @param language - Language for punctuation rules (currently unused, reserved for future)
 * @returns Array of sentences with position indices
 */
export function splitSentences(text: string, _language: Language): Sentence[] {
  // Note: _language parameter currently unused but reserved for future language-specific rules
  
  if (!text || text.length === 0) {
    return [];
  }

  const sentences: Sentence[] = [];
  
  // Sentence-ending punctuation (Arabic and Spanish)
  // Match punctuation followed by whitespace or end of string
  const sentenceEndRegex = /[.!?؟](?:\s+|$)/g;
  
  let lastIndex = 0;
  let match;
  
  while ((match = sentenceEndRegex.exec(text)) !== null) {
    const endIndex = match.index + match[0].length;
    const sentenceText = text.slice(lastIndex, endIndex).trim();
    
    if (sentenceText.length > 0) {
      sentences.push({
        text: sentenceText,
        index: lastIndex,
      });
    }
    
    lastIndex = endIndex;
  }
  
  // Handle remaining text if it doesn't end with sentence punctuation
  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex).trim();
    if (remainingText.length > 0) {
      sentences.push({
        text: remainingText,
        index: lastIndex,
      });
    }
  }
  
  return sentences;
}

/**
 * Counts the number of sentences in text.
 * Useful for contentType classification (1 sentence vs multiple).
 */
export function countSentences(text: string, language: Language): number {
  return splitSentences(text, language).length;
}

/**
 * Checks if text contains multiple sentences.
 */
export function isMultiSentence(text: string, language: Language): boolean {
  return countSentences(text, language) > 1;
}
