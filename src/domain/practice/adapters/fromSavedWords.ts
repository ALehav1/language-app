/**
 * Adapter: SavedWord → PracticeItem
 * 
 * Extracted from useVocabulary.ts lines 50-66.
 * Reproduces exact current behavior including quirks.
 * 
 * Source: saved_words table (user-saved content)
 */

import type { PracticeItem } from '../PracticeItem';
import type { SavedWord } from '../../../types';

export function fromSavedWords(items: SavedWord[]): PracticeItem[] {
  return items.map((row) => {
    // Map saved_words.status to raw mastery (preserving current quirk)
    // Current logic: 'learned' → 'practiced', everything else → 'learning'
    const masteryLevelRaw = row.status === 'learned' ? 'practiced' : 'learning';
    
    return {
      // Identity
      id: row.id,
      language: 'arabic',  // PRESERVED QUIRK: hardcoded in original (line 54)
      contentType: 'word', // PRESERVED QUIRK: hardcoded in original (line 55)
      
      // Core content
      targetText: row.word,
      translation: row.translation,
      transliteration: row.pronunciation_standard || undefined,
      
      // Exercise framing (current behavior: show target, answer translation)
      promptType: 'show_target',
      answerType: 'text_translation',
      
      // Learning state (raw from saved_words)
      masteryLevelRaw,
      timesPracticed: row.times_practiced,
      timesCorrect: undefined,  // not tracked in saved_words
      lastReviewed: row.last_practiced,
      nextReview: row.next_review,
      
      // Provenance
      origin: {
        type: 'saved_word',
        id: row.id,
      },
      linkage: {
        savedWordId: row.id,
        vocabularyItemId: undefined,  // not linked in saved_words
        lessonId: undefined,
      },
      
      // Enrichments (preserve from DB, convert null to undefined)
      letterBreakdown: row.letter_breakdown ?? undefined,
      hebrewCognate: row.hebrew_cognate ?? undefined,
      exampleSentences: row.example_sentences ?? undefined,  // not in saved_words
      
      // Memory aids (from saved_words)
      memoryNote: row.memory_note || null,
      memoryImageUrl: row.memory_image_url || null,
      
      // Timestamps
      createdAt: row.created_at,
    };
  });
}
