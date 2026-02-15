/**
 * Hebrew Cognate Display Gating Logic
 *
 * NOTE: This is a server-side copy for Vercel serverless functions.
 * Source of truth: src/domain/practice/hebrew/shouldShowHebrewCognate.ts
 */

import { tokenizeWords, getWordTokens } from './tokenizeWords';

type Language = 'arabic' | 'spanish';

export interface HebrewCandidate {
  root: string;
  meaning: string;
  notes?: string;
}

export interface HebrewGatingParams {
  language: Language;
  contentType: 'word' | 'sentence' | 'dialog' | 'passage';
  hebrewCandidate?: HebrewCandidate | null;
  selectedText?: string;
}

/**
 * Determines whether Hebrew cognate should be displayed.
 */
export function shouldShowHebrewCognate(params: HebrewGatingParams): boolean {
  const { language, contentType, hebrewCandidate, selectedText } = params;

  // Rule 1: Only show for Arabic
  if (language !== 'arabic') {
    return false;
  }

  // Rule 2: Only show for single words
  if (contentType !== 'word') {
    return false;
  }

  // Rule 2b: Token-based validation
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

  return true;
}
