/**
 * Adapter: DbVocabularyItem → PracticeItem
 * 
 * Extracted from useVocabulary.ts lines 93-109.
 * Reproduces exact current behavior including quirks.
 * 
 * Source: vocabulary_items table (lesson-driven content)
 */

import type { PracticeItem } from '../PracticeItem';
import type { DbVocabularyItem } from '../../../types';

export function fromVocabularyItems(items: DbVocabularyItem[]): PracticeItem[] {
  return items.map((row) => {
    // Database now uses canonical names (sentence, passage)
    const contentType = row.content_type || 'word';
    
    return {
      // Identity
      id: row.id,
      language: row.language === 'arabic' ? 'arabic' : 
                row.language === 'spanish' ? 'spanish' :
                row.language === 'hebrew' ? 'hebrew' : 'english',
      contentType,
    
    // Core content
    targetText: row.word,
    translation: row.translation,
    transliteration: row.transliteration,
    
    // Exercise framing (current behavior: show target, answer translation)
    promptType: 'show_target',
    answerType: 'text_translation',
    
    // Learning state (raw from vocabulary_items)
    masteryLevelRaw: row.mastery_level,
    timesPracticed: row.times_practiced,
    timesCorrect: undefined,  // not tracked in vocabulary_items
    lastReviewed: row.last_reviewed,
    nextReview: row.next_review,
    
    // Provenance
    origin: {
      type: 'lesson_vocab_item',
      id: row.id,
    },
    linkage: {
      vocabularyItemId: row.id,
      lessonId: undefined,  // lesson_id not included in public VocabularyItem
    },
    
    // Enrichments (preserve from DB, convert null to undefined)
    letterBreakdown: row.letter_breakdown ?? undefined,
    hebrewCognate: row.hebrew_cognate ?? undefined,
    exampleSentences: undefined,  // not stored in vocabulary_items
    
    // Memory aids (not in vocabulary_items)
    memoryNote: null,
    memoryImageUrl: null,
    
    // Timestamps
    createdAt: row.created_at,
    };
  });
}
