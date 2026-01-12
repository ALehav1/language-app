/**
 * Helper functions for constructing discriminated union selection contexts.
 * 
 * These helpers ensure type-safe construction of WordSelectionContext and
 * SentenceSelectionContext without requiring type assertions.
 */

import type { ArabicDialect, SpanishDialect } from './database';
import type { WordSelectionContext, SentenceSelectionContext, SourceView, SelectionContentType } from './selection';

/**
 * Create a WordSelectionContext for Arabic content
 */
export function makeArabicWordSelection(params: {
  selectedText: string;
  parentSentence: string;
  sourceView: SourceView;
  dialect?: ArabicDialect;
  contentType: SelectionContentType;
}): WordSelectionContext {
  return {
    selectedText: params.selectedText,
    parentSentence: params.parentSentence,
    sourceView: params.sourceView,
    language: 'arabic',
    dialect: params.dialect,
    contentType: params.contentType,
  };
}

/**
 * Create a WordSelectionContext for Spanish content
 */
export function makeSpanishWordSelection(params: {
  selectedText: string;
  parentSentence: string;
  sourceView: SourceView;
  dialect?: SpanishDialect;
  contentType: SelectionContentType;
}): WordSelectionContext {
  return {
    selectedText: params.selectedText,
    parentSentence: params.parentSentence,
    sourceView: params.sourceView,
    language: 'spanish',
    dialect: params.dialect,
    contentType: params.contentType,
  };
}

/**
 * Create a SentenceSelectionContext for Arabic content
 */
export function makeArabicSentenceSelection(params: {
  selectedSentence: string;
  parentPassage?: string;
  sourceView: SourceView;
  dialect?: ArabicDialect;
  contentType: SelectionContentType;
}): SentenceSelectionContext {
  return {
    selectedSentence: params.selectedSentence,
    parentPassage: params.parentPassage,
    sourceView: params.sourceView,
    language: 'arabic',
    dialect: params.dialect,
    contentType: params.contentType,
  };
}

/**
 * Create a SentenceSelectionContext for Spanish content
 */
export function makeSpanishSentenceSelection(params: {
  selectedSentence: string;
  parentPassage?: string;
  sourceView: SourceView;
  dialect?: SpanishDialect;
  contentType: SelectionContentType;
}): SentenceSelectionContext {
  return {
    selectedSentence: params.selectedSentence,
    parentPassage: params.parentPassage,
    sourceView: params.sourceView,
    language: 'spanish',
    dialect: params.dialect,
    contentType: params.contentType,
  };
}

/**
 * Generic factory that dispatches to language-specific helpers
 * Use when language is a variable (e.g., from props or state)
 */
export function makeWordSelection(
  language: 'arabic' | 'spanish',
  params: {
    selectedText: string;
    parentSentence: string;
    sourceView: SourceView;
    dialect?: ArabicDialect | SpanishDialect;
    contentType: SelectionContentType;
  }
): WordSelectionContext {
  if (language === 'arabic') {
    return makeArabicWordSelection({
      ...params,
      dialect: params.dialect as ArabicDialect | undefined,
    });
  } else {
    return makeSpanishWordSelection({
      ...params,
      dialect: params.dialect as SpanishDialect | undefined,
    });
  }
}

/**
 * Generic factory that dispatches to language-specific helpers
 * Use when language is a variable (e.g., from props or state)
 */
export function makeSentenceSelection(
  language: 'arabic' | 'spanish',
  params: {
    selectedSentence: string;
    parentPassage?: string;
    sourceView: SourceView;
    dialect?: ArabicDialect | SpanishDialect;
    contentType: SelectionContentType;
  }
): SentenceSelectionContext {
  if (language === 'arabic') {
    return makeArabicSentenceSelection({
      ...params,
      dialect: params.dialect as ArabicDialect | undefined,
    });
  } else {
    return makeSpanishSentenceSelection({
      ...params,
      dialect: params.dialect as SpanishDialect | undefined,
    });
  }
}
