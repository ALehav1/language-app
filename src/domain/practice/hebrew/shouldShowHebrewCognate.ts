/**
 * Hebrew Cognate Display Gating Logic
 * 
 * Determines whether Hebrew cognate information should be displayed to the user.
 * 
 * Rules:
 * 1. Hebrew is only shown for Arabic content (never Spanish)
 * 2. Hebrew is only shown for single words (contentType === 'word' AND wordTokenCount === 1)
 * 3. Hebrew is only shown when a cognate actually exists
 * 
 * Token-based validation provides defense against misclassification:
 * - Even if contentType is 'word', we verify actual token count
 * - Uses tokenizeWords() to count word tokens (excludes punctuation/whitespace)
 * - Prevents Hebrew from showing on multi-word strings incorrectly classified
 * 
 * The static Hebrew cognate table (hebrewCognates.ts) is the source of truth.
 * If an entry exists in that table, it represents a validated Semitic root connection.
 */

import type { Language } from '../../../types/database';
import type { SelectionContentType } from '../../../types/selection';
import { tokenizeWords, getWordTokens } from '../../../utils/text/tokenizeWords';

export interface HebrewCandidate {
  root: string;
  meaning: string;
  notes?: string;
}

export interface HebrewGatingParams {
  language: Language;
  contentType: 'word' | 'sentence' | 'dialog' | 'passage' | SelectionContentType;
  hebrewCandidate?: HebrewCandidate | null;
  selectedText?: string;  // Optional: for token-based validation
}

/**
 * Determines whether Hebrew cognate should be displayed.
 * 
 * @param params - Language, content type, candidate cognate, and optional text for token validation
 * @returns true if Hebrew should be shown, false otherwise
 */
export function shouldShowHebrewCognate(params: HebrewGatingParams): boolean {
  const { language, contentType, hebrewCandidate, selectedText } = params;

  // Rule 1: Only show for Arabic
  if (language !== 'arabic') {
    return false;
  }

  // Rule 2: Only show for single words
  // contentType must be 'word' - sentences, phrases, passages, dialogs should not show Hebrew
  if (contentType !== 'word') {
    return false;
  }

  // Rule 2b: Token-based validation (defense against misclassification)
  // If selectedText provided, verify it's truly a single word by counting tokens
  if (selectedText !== undefined) {
    const tokens = tokenizeWords(selectedText, language);
    const wordTokens = getWordTokens(tokens);
    
    if (wordTokens.length !== 1) {
      return false;
    }
  }

  // Rule 3: Hebrew candidate must exist and have valid data
  if (!hebrewCandidate?.root) {
    return false;
  }

  // All checks passed
  return true;
}
