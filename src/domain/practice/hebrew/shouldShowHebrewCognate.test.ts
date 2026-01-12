import { describe, it, expect } from 'vitest';
import { shouldShowHebrewCognate, type HebrewCandidate } from './shouldShowHebrewCognate';

describe('shouldShowHebrewCognate', () => {
  const validHebrewCandidate: HebrewCandidate = {
    root: 'שלום',
    meaning: 'peace',
    notes: 'Semitic root connection'
  };

  describe('Arabic word content', () => {
    it('returns true for Arabic word with valid Hebrew cognate', () => {
      const result = shouldShowHebrewCognate({
        language: 'arabic',
        contentType: 'word',
        hebrewCandidate: validHebrewCandidate
      });

      expect(result).toBe(true);
    });

    it('returns true for Arabic single word with token validation', () => {
      const result = shouldShowHebrewCognate({
        language: 'arabic',
        contentType: 'word',
        hebrewCandidate: validHebrewCandidate,
        selectedText: 'سلام'
      });

      expect(result).toBe(true);
    });

    it('returns false for Arabic multi-word string even if contentType is word', () => {
      const result = shouldShowHebrewCognate({
        language: 'arabic',
        contentType: 'word',
        hebrewCandidate: validHebrewCandidate,
        selectedText: 'مرحبا كيف حالك'
      });

      expect(result).toBe(false);
    });

    it('returns false for multi-word with punctuation even if contentType is word', () => {
      const result = shouldShowHebrewCognate({
        language: 'arabic',
        contentType: 'word',
        hebrewCandidate: validHebrewCandidate,
        selectedText: 'مرحبا، كيف حالك؟'
      });

      expect(result).toBe(false);
    });

    it('returns false for Arabic word without Hebrew cognate', () => {
      const result = shouldShowHebrewCognate({
        language: 'arabic',
        contentType: 'word',
        hebrewCandidate: null
      });

      expect(result).toBe(false);
    });

    it('returns false for Arabic word with undefined Hebrew candidate', () => {
      const result = shouldShowHebrewCognate({
        language: 'arabic',
        contentType: 'word',
        hebrewCandidate: undefined
      });

      expect(result).toBe(false);
    });

    it('returns false for Arabic word with Hebrew candidate missing root', () => {
      const result = shouldShowHebrewCognate({
        language: 'arabic',
        contentType: 'word',
        hebrewCandidate: { root: '', meaning: 'peace' }
      });

      expect(result).toBe(false);
    });
  });

  describe('Multi-word content (contentType gating)', () => {
    it('returns false for Arabic sentence even with valid Hebrew candidate', () => {
      const result = shouldShowHebrewCognate({
        language: 'arabic',
        contentType: 'sentence',
        hebrewCandidate: validHebrewCandidate
      });

      expect(result).toBe(false);
    });

    it('returns false for Arabic sentence even with valid Hebrew candidate', () => {
      const result = shouldShowHebrewCognate({
        language: 'arabic',
        contentType: 'sentence',
        hebrewCandidate: validHebrewCandidate
      });

      expect(result).toBe(false);
    });

    it('returns false for Arabic passage even with valid Hebrew candidate', () => {
      const result = shouldShowHebrewCognate({
        language: 'arabic',
        contentType: 'passage',
        hebrewCandidate: validHebrewCandidate
      });

      expect(result).toBe(false);
    });

    it('returns false for Arabic dialog even with valid Hebrew candidate', () => {
      const result = shouldShowHebrewCognate({
        language: 'arabic',
        contentType: 'dialog',
        hebrewCandidate: validHebrewCandidate
      });

      expect(result).toBe(false);
    });

    it('returns false for Arabic passage even with valid Hebrew candidate', () => {
      const result = shouldShowHebrewCognate({
        language: 'arabic',
        contentType: 'passage',
        hebrewCandidate: validHebrewCandidate
      });

      expect(result).toBe(false);
    });
  });

  describe('Spanish content (language gating)', () => {
    it('returns false for Spanish word even with valid Hebrew candidate', () => {
      const result = shouldShowHebrewCognate({
        language: 'spanish',
        contentType: 'word',
        hebrewCandidate: validHebrewCandidate
      });

      expect(result).toBe(false);
    });

    it('returns false for Spanish sentence with Hebrew candidate', () => {
      const result = shouldShowHebrewCognate({
        language: 'spanish',
        contentType: 'sentence',
        hebrewCandidate: validHebrewCandidate
      });

      expect(result).toBe(false);
    });

    it('returns false for Spanish passage with Hebrew candidate', () => {
      const result = shouldShowHebrewCognate({
        language: 'spanish',
        contentType: 'passage',
        hebrewCandidate: validHebrewCandidate
      });

      expect(result).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('returns false when all conditions fail', () => {
      const result = shouldShowHebrewCognate({
        language: 'spanish',
        contentType: 'sentence',
        hebrewCandidate: null
      });

      expect(result).toBe(false);
    });

    it('handles Hebrew candidate with only root (minimal valid data)', () => {
      const result = shouldShowHebrewCognate({
        language: 'arabic',
        contentType: 'word',
        hebrewCandidate: { root: 'כתב', meaning: '' }
      });

      expect(result).toBe(true); // root exists, meaning can be empty
    });

    it('returns true for single word with trailing punctuation', () => {
      const result = shouldShowHebrewCognate({
        language: 'arabic',
        contentType: 'word',
        hebrewCandidate: validHebrewCandidate,
        selectedText: 'سلام.'
      });

      expect(result).toBe(true); // punctuation excluded from token count
    });

    it('returns false for empty string even if contentType is word', () => {
      const result = shouldShowHebrewCognate({
        language: 'arabic',
        contentType: 'word',
        hebrewCandidate: validHebrewCandidate,
        selectedText: ''
      });

      expect(result).toBe(false);
    });
  });
});
