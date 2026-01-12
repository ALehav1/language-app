/**
 * Selection context types for interactive text
 * 
 * These types capture the context when a user clicks on a word or sentence,
 * providing all necessary information for detail views and save operations.
 * 
 * Used by:
 * - ClickableText component
 * - WordDetailModal
 * - SentenceDetailModal
 * - ExerciseFeedback
 * - Passage/dialog displays
 */

import type { ArabicDialect, SpanishDialect } from './database';

/**
 * Source view identifiers for tracking where word/sentence selections originated
 */
export type SourceView = 'exercise' | 'lookup' | 'vocab' | 'lesson';

/**
 * Content types specific to interactive text selection contexts
 * Separate from database ContentType to avoid coupling selection UI to storage schema
 */
export type SelectionContentType = 'word' | 'sentence' | 'passage' | 'dialog';

/**
 * Map selection content types to database content types for save operations
 */
export function mapSelectionToContentType(selectionType: SelectionContentType): import('./database').ContentType {
  switch (selectionType) {
    case 'word':
      return 'word';
    case 'sentence':
      return 'sentence';
    case 'passage':
      return 'passage';
    case 'dialog':
      return 'dialog';
  }
}

/**
 * Context captured when a user clicks on a word (discriminated union by language)
 */
export type WordSelectionContext = 
  | {
      selectedText: string;
      parentSentence: string;
      sourceView: SourceView;
      language: 'arabic';
      dialect?: ArabicDialect;
      contentType: SelectionContentType;
    }
  | {
      selectedText: string;
      parentSentence: string;
      sourceView: SourceView;
      language: 'spanish';
      dialect?: SpanishDialect;
      contentType: SelectionContentType;
    };

/**
 * Context captured when a user clicks on a sentence (discriminated union by language)
 */
export type SentenceSelectionContext = 
  | {
      selectedSentence: string;
      parentPassage?: string;
      sourceView: SourceView;
      language: 'arabic';
      dialect?: ArabicDialect;
      contentType: SelectionContentType;
    }
  | {
      selectedSentence: string;
      parentPassage?: string;
      sourceView: SourceView;
      language: 'spanish';
      dialect?: SpanishDialect;
      contentType: SelectionContentType;
    };
