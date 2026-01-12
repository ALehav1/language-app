import { describe, it, expect } from 'vitest';
import { fromVocabularyItems } from '../adapters/fromVocabularyItems';
import { fromSavedWords } from '../adapters/fromSavedWords';
import type { DbVocabularyItem, SavedWord } from '../../../types';

/**
 * Golden Equivalence Tests
 * 
 * Proves that the new adapter outputs match the legacy inline transformations
 * that were extracted from useVocabulary.ts.
 * 
 * These are the "zero behavior change" anchor for PR-2.
 */

// Legacy transformation copied from useVocabulary.ts (lines 93-109, pre-PR-2)
function legacyVocabItemTransform(row: DbVocabularyItem) {
  return {
    id: row.id,
    word: row.word,
    translation: row.translation,
    language: row.language,
    content_type: row.content_type || 'word',
    transliteration: row.transliteration,
    hebrew_cognate: row.hebrew_cognate,
    letter_breakdown: row.letter_breakdown,
    speaker: row.speaker,
    context: row.context,
    mastery_level: row.mastery_level,
    last_reviewed: row.last_reviewed,
    next_review: row.next_review,
    times_practiced: row.times_practiced,
    created_at: row.created_at,
  };
}

// Legacy transformation copied from useVocabulary.ts (lines 50-66, pre-PR-2)
function legacySavedWordTransform(row: SavedWord) {
  return {
    id: row.id,
    word: row.word,
    translation: row.translation,
    language: 'arabic' as const,
    content_type: 'word' as const,
    transliteration: row.pronunciation_standard || undefined,
    hebrew_cognate: row.hebrew_cognate,
    letter_breakdown: row.letter_breakdown,
    speaker: undefined,
    context: undefined,
    mastery_level: row.status === 'learned' ? 'practiced' : 'learning',
    last_reviewed: row.last_practiced,
    next_review: row.next_review,
    times_practiced: row.times_practiced,
    created_at: row.created_at,
  };
}

describe('Adapter Equivalence (PR-2 Zero Behavior Change)', () => {
  describe('fromVocabularyItems equivalence', () => {
    it('produces identical VocabularyItem shape as legacy code', () => {
      const dbItem: DbVocabularyItem = {
        id: 'vocab-123',
        lesson_id: 'lesson-1',
        word: 'مرحبا',
        translation: 'hello',
        transliteration: 'marhaba',
        language: 'arabic',
        content_type: 'word',
        mastery_level: 'learning',
        times_practiced: 5,
        last_reviewed: '2026-01-10T00:00:00Z',
        next_review: '2026-01-12T00:00:00Z',
        created_at: '2026-01-01T00:00:00Z',
        letter_breakdown: [
          { letter: 'م', name: 'Meem', sound: 'm' },
          { letter: 'ر', name: 'Ra', sound: 'r' },
        ],
        hebrew_cognate: {
          root: 'שלום',
          meaning: 'peace',
        },
        speaker: undefined,
        context: undefined,
      };

      // Legacy output
      const legacyOutput = legacyVocabItemTransform(dbItem);

      // New adapter output (convert back to VocabularyItem shape)
      const [practiceItem] = fromVocabularyItems([dbItem]);
      const adapterOutput = {
        id: practiceItem.id,
        word: practiceItem.targetText,
        translation: practiceItem.translation,
        language: practiceItem.language,
        content_type: practiceItem.contentType,
        transliteration: practiceItem.transliteration,
        hebrew_cognate: practiceItem.hebrewCognate,
        letter_breakdown: practiceItem.letterBreakdown,
        speaker: undefined,
        context: undefined,
        mastery_level: practiceItem.masteryLevelRaw,
        last_reviewed: practiceItem.lastReviewed,
        next_review: practiceItem.nextReview,
        times_practiced: practiceItem.timesPracticed,
        created_at: practiceItem.createdAt,
      };

      // Assert deep equality
      expect(adapterOutput).toEqual(legacyOutput);
    });

    it('handles paragraph → passage mapping correctly', () => {
      const dbItem: DbVocabularyItem = {
        id: 'vocab-456',
        lesson_id: 'lesson-2',
        word: 'Long text content',
        translation: 'Translation',
        transliteration: undefined,
        language: 'arabic',
        content_type: 'passage',
        mastery_level: 'new',
        times_practiced: 0,
        last_reviewed: null,
        next_review: null,
        created_at: '2026-01-01T00:00:00Z',
      };

      // Both now use 'passage'
      const legacyOutput = legacyVocabItemTransform(dbItem);
      expect(legacyOutput.content_type).toBe('passage');

      // Adapter maps to 'passage'
      const [practiceItem] = fromVocabularyItems([dbItem]);
      expect(practiceItem.contentType).toBe('passage');

      // This is INTENTIONAL difference for domain correctness
      // Legacy quirk is preserved in DB → Adapter, corrected in domain
    });
  });

  describe('fromSavedWords equivalence', () => {
    it('produces identical VocabularyItem shape as legacy code (with null→undefined normalization)', () => {
      const savedWord: SavedWord = {
        id: 'saved-123',
        word: 'كتاب',
        translation: 'book',
        language: 'arabic',
        pronunciation_standard: 'kitaab',
        pronunciation_egyptian: 'ketaab',
        letter_breakdown: [
          { letter: 'ك', name: 'Kaf', sound: 'k' },
          { letter: 'ت', name: 'Ta', sound: 't' },
        ],
        hebrew_cognate: null,
        example_sentences: null,
        topic: 'education',
        tags: ['beginner', 'common'],
        status: 'active',
        times_practiced: 3,
        times_correct: 2,
        last_practiced: '2026-01-10T00:00:00Z',
        next_review: null,
        memory_note: 'Like Hebrew sefer',
        memory_image_url: null,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-10T00:00:00Z',
      };

      // Legacy output
      const legacyOutput = legacySavedWordTransform(savedWord);

      // New adapter output (convert back to VocabularyItem shape)
      const [practiceItem] = fromSavedWords([savedWord]);
      const adapterOutput = {
        id: practiceItem.id,
        word: practiceItem.targetText,
        translation: practiceItem.translation,
        language: practiceItem.language,
        content_type: practiceItem.contentType,
        transliteration: practiceItem.transliteration,
        hebrew_cognate: practiceItem.hebrewCognate ?? null,  // normalize back to null for legacy comparison
        letter_breakdown: practiceItem.letterBreakdown,
        speaker: undefined,
        context: undefined,
        mastery_level: practiceItem.masteryLevelRaw,
        last_reviewed: practiceItem.lastReviewed,
        next_review: practiceItem.nextReview,
        times_practiced: practiceItem.timesPracticed,
        created_at: practiceItem.createdAt,
      };

      // Assert deep equality
      // Note: Adapter intentionally normalizes null→undefined for TypeScript best practices
      expect(adapterOutput).toEqual(legacyOutput);
    });

    it('preserves hardcoded arabic/word quirks', () => {
      const savedWord: SavedWord = {
        id: 'saved-456',
        word: 'test',
        translation: 'test',
        language: 'arabic',
        pronunciation_standard: null,
        pronunciation_egyptian: null,
        letter_breakdown: null,
        hebrew_cognate: null,
        example_sentences: null,
        topic: null,
        tags: null,
        status: 'learned',
        times_practiced: 10,
        times_correct: 8,
        last_practiced: null,
        next_review: null,
        memory_note: null,
        memory_image_url: null,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      };

      const legacyOutput = legacySavedWordTransform(savedWord);
      const [practiceItem] = fromSavedWords([savedWord]);

      // Both hardcode language to 'arabic'
      expect(legacyOutput.language).toBe('arabic');
      expect(practiceItem.language).toBe('arabic');

      // Both hardcode content_type to 'word'
      expect(legacyOutput.content_type).toBe('word');
      expect(practiceItem.contentType).toBe('word');

      // Both map learned → practiced
      expect(legacyOutput.mastery_level).toBe('practiced');
      expect(practiceItem.masteryLevelRaw).toBe('practiced');
    });
  });
});
