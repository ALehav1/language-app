import { describe, it, expect } from 'vitest';
import { fromVocabularyItems } from '../adapters/fromVocabularyItems';
import { fromSavedWords } from '../adapters/fromSavedWords';
import type { DbVocabularyItem, SavedWord } from '../../../types';

describe('PracticeItem Adapters (PR-2 Baseline)', () => {
  describe('fromVocabularyItems', () => {
    it('preserves all core fields from DbVocabularyItem', () => {
      const input: DbVocabularyItem = {
        id: 'vocab-1',
        lesson_id: 'lesson-1',
        word: 'مرحبا',
        translation: 'hello',
        transliteration: 'marhaba',
        language: 'arabic',
        content_type: 'word',
        mastery_level: 'learning',
        times_practiced: 3,
        last_reviewed: '2026-01-10T00:00:00Z',
        next_review: null,
        created_at: '2026-01-01T00:00:00Z',
      };

      const [result] = fromVocabularyItems([input]);

      expect(result.id).toBe('vocab-1');
      expect(result.targetText).toBe('مرحبا');
      expect(result.translation).toBe('hello');
      expect(result.language).toBe('arabic');
      expect(result.masteryLevelRaw).toBe('learning');
      expect(result.timesPracticed).toBe(3);
    });

    it('maps paragraph → passage content type', () => {
      const input: DbVocabularyItem = {
        id: 'test',
        lesson_id: 'lesson-1',
        word: 'text',
        translation: 'text',
        language: 'arabic',
        content_type: 'passage',
        mastery_level: 'new',
        times_practiced: 0,
        last_reviewed: null,
        next_review: null,
        created_at: '2026-01-01T00:00:00Z',
      };

      const [result] = fromVocabularyItems([input]);
      expect(result.contentType).toBe('passage');
    });

    it('sets origin to lesson_vocab_item', () => {
      const input: DbVocabularyItem = {
        id: 'vocab-123',
        lesson_id: 'lesson-1',
        word: 'test',
        translation: 'test',
        language: 'arabic',
        content_type: 'word',
        mastery_level: 'new',
        times_practiced: 0,
        last_reviewed: null,
        next_review: null,
        created_at: '2026-01-01T00:00:00Z',
      };

      const [result] = fromVocabularyItems([input]);
      expect(result.origin.type).toBe('lesson_vocab_item');
      expect(result.origin.id).toBe('vocab-123');
    });
  });

  describe('fromSavedWords', () => {
    it('preserves all core fields from SavedWord', () => {
      const input: SavedWord = {
        id: 'saved-1',
        word: 'مرحبا',
        translation: 'hello',
        language: 'arabic',
        pronunciation_standard: 'marhaba',
        pronunciation_egyptian: null,
        letter_breakdown: null,
        hebrew_cognate: null,
        example_sentences: null,
        topic: null,
        tags: null,
        status: 'active',
        times_practiced: 5,
        times_correct: 3,
        last_practiced: '2026-01-10T00:00:00Z',
        next_review: null,
        memory_note: 'My note',
        memory_image_url: null,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-10T00:00:00Z',
      };

      const [result] = fromSavedWords([input]);

      expect(result.id).toBe('saved-1');
      expect(result.targetText).toBe('مرحبا');
      expect(result.translation).toBe('hello');
      expect(result.timesPracticed).toBe(5);
      expect(result.memoryNote).toBe('My note');
    });

    it('PRESERVES QUIRK: hardcodes language to arabic', () => {
      const input: SavedWord = {
        id: 'saved-1',
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
        status: 'active',
        times_practiced: 0,
        times_correct: 0,
        last_practiced: null,
        next_review: null,
        memory_note: null,
        memory_image_url: null,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      };

      const [result] = fromSavedWords([input]);
      expect(result.language).toBe('arabic');
    });

    it('maps learned status → practiced mastery', () => {
      const input: SavedWord = {
        id: 'saved-1',
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
        times_practiced: 0,
        times_correct: 0,
        last_practiced: null,
        next_review: null,
        memory_note: null,
        memory_image_url: null,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      };

      const [result] = fromSavedWords([input]);
      expect(result.masteryLevelRaw).toBe('practiced');
    });

    it('sets origin to saved_word', () => {
      const input: SavedWord = {
        id: 'saved-123',
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
        status: 'active',
        times_practiced: 0,
        times_correct: 0,
        last_practiced: null,
        next_review: null,
        memory_note: null,
        memory_image_url: null,
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-01-01T00:00:00Z',
      };

      const [result] = fromSavedWords([input]);
      expect(result.origin.type).toBe('saved_word');
      expect(result.origin.id).toBe('saved-123');
    });
  });
});
