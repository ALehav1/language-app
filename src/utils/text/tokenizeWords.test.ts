import { describe, it, expect } from 'vitest';
import { tokenizeWords, getWordTokens, reconstructText } from './tokenizeWords';

describe('tokenizeWords', () => {
  describe('Basic tokenization', () => {
    it('tokenizes simple Spanish sentence', () => {
      const tokens = tokenizeWords('Hola mundo', 'spanish');
      
      expect(tokens).toHaveLength(3);
      expect(tokens[0]).toEqual({ text: 'Hola', type: 'word', index: 0 });
      expect(tokens[1]).toEqual({ text: ' ', type: 'whitespace', index: 4 });
      expect(tokens[2]).toEqual({ text: 'mundo', type: 'word', index: 5 });
    });

    it('tokenizes simple Arabic sentence', () => {
      const tokens = tokenizeWords('مرحبا العالم', 'arabic');
      
      expect(tokens).toHaveLength(3);
      expect(tokens[0]).toEqual({ text: 'مرحبا', type: 'word', index: 0 });
      expect(tokens[1]).toEqual({ text: ' ', type: 'whitespace', index: 5 });
      expect(tokens[2]).toEqual({ text: 'العالم', type: 'word', index: 6 });
    });

    it('handles single word', () => {
      const tokens = tokenizeWords('Hola', 'spanish');
      
      expect(tokens).toHaveLength(1);
      expect(tokens[0]).toEqual({ text: 'Hola', type: 'word', index: 0 });
    });

    it('handles empty string', () => {
      const tokens = tokenizeWords('', 'spanish');
      expect(tokens).toHaveLength(0);
    });
  });

  describe('Punctuation handling', () => {
    it('separates Spanish punctuation from words', () => {
      const tokens = tokenizeWords('Hola, mundo!', 'spanish');
      
      expect(tokens).toHaveLength(5);
      expect(tokens[0]).toEqual({ text: 'Hola', type: 'word', index: 0 });
      expect(tokens[1]).toEqual({ text: ',', type: 'punctuation', index: 4 });
      expect(tokens[2]).toEqual({ text: ' ', type: 'whitespace', index: 5 });
      expect(tokens[3]).toEqual({ text: 'mundo', type: 'word', index: 6 });
      expect(tokens[4]).toEqual({ text: '!', type: 'punctuation', index: 11 });
    });

    it('separates Arabic punctuation from words', () => {
      const tokens = tokenizeWords('مرحبا، كيف حالك؟', 'arabic');
      
      const wordTokens = getWordTokens(tokens);
      expect(wordTokens).toHaveLength(3);
      expect(wordTokens[0].text).toBe('مرحبا');
      expect(wordTokens[1].text).toBe('كيف');
      expect(wordTokens[2].text).toBe('حالك');
      
      const punctTokens = tokens.filter(t => t.type === 'punctuation');
      expect(punctTokens).toHaveLength(2);
      expect(punctTokens[0].text).toBe('،');
      expect(punctTokens[1].text).toBe('؟');
    });

    it('handles multiple punctuation marks', () => {
      const tokens = tokenizeWords('Hello... World!?', 'spanish');
      
      const wordTokens = getWordTokens(tokens);
      expect(wordTokens).toHaveLength(2);
      
      const punctTokens = tokens.filter(t => t.type === 'punctuation');
      expect(punctTokens.length).toBeGreaterThan(0);
    });

    it('handles word ending with period', () => {
      const tokens = tokenizeWords('Hola.', 'spanish');
      
      expect(tokens).toHaveLength(2);
      expect(tokens[0]).toEqual({ text: 'Hola', type: 'word', index: 0 });
      expect(tokens[1]).toEqual({ text: '.', type: 'punctuation', index: 4 });
    });
  });

  describe('Whitespace preservation', () => {
    it('preserves single space', () => {
      const tokens = tokenizeWords('Hello world', 'spanish');
      const whitespace = tokens.filter(t => t.type === 'whitespace');
      
      expect(whitespace).toHaveLength(1);
      expect(whitespace[0].text).toBe(' ');
    });

    it('preserves multiple spaces', () => {
      const tokens = tokenizeWords('Hello   world', 'spanish');
      const whitespace = tokens.filter(t => t.type === 'whitespace');
      
      expect(whitespace).toHaveLength(1);
      expect(whitespace[0].text).toBe('   ');
    });

    it('preserves leading/trailing whitespace', () => {
      const tokens = tokenizeWords(' Hello world ', 'spanish');
      
      expect(tokens[0].type).toBe('whitespace');
      expect(tokens[tokens.length - 1].type).toBe('whitespace');
    });
  });

  describe('Arabic-specific cases', () => {
    it('preserves Arabic diacritics', () => {
      const tokens = tokenizeWords('مَرْحَبًا', 'arabic');
      
      expect(tokens).toHaveLength(1);
      expect(tokens[0].text).toBe('مَرْحَبًا');
      expect(tokens[0].type).toBe('word');
    });

    it('handles Arabic sentence with mixed punctuation', () => {
      const text = 'أنا بحب القهوة. كيف حالك؟';
      const tokens = tokenizeWords(text, 'arabic');
      
      const wordTokens = getWordTokens(tokens);
      expect(wordTokens.length).toBeGreaterThan(0);
      
      // Verify original text can be reconstructed
      expect(reconstructText(tokens)).toBe(text);
    });

    it('handles Egyptian Arabic colloquial text', () => {
      const tokens = tokenizeWords('إزيك يا صاحبي', 'arabic');
      
      const wordTokens = getWordTokens(tokens);
      expect(wordTokens).toHaveLength(3);
    });
  });

  describe('Mixed content', () => {
    it('handles numbers in text', () => {
      const tokens = tokenizeWords('Tengo 3 gatos', 'spanish');
      
      const wordTokens = getWordTokens(tokens);
      expect(wordTokens).toHaveLength(3);
      expect(wordTokens[1].text).toBe('3');
    });

    it('handles hyphenated words', () => {
      const tokens = tokenizeWords('bien-conocido', 'spanish');
      
      // Hyphen not in punctuation list, so treated as part of word
      const wordTokens = getWordTokens(tokens);
      expect(wordTokens.length).toBeGreaterThan(0);
    });
  });

  describe('Utility functions', () => {
    it('getWordTokens filters to only words', () => {
      const tokens = tokenizeWords('Hola, mundo!', 'spanish');
      const wordTokens = getWordTokens(tokens);
      
      expect(wordTokens).toHaveLength(2);
      expect(wordTokens.every(t => t.type === 'word')).toBe(true);
    });

    it('reconstructText rebuilds original string', () => {
      const original = 'Hola, mundo! كيف حالك؟';
      const tokens = tokenizeWords(original, 'spanish');
      const reconstructed = reconstructText(tokens);
      
      expect(reconstructed).toBe(original);
    });

    it('preserves index positions correctly', () => {
      const tokens = tokenizeWords('Hola, mundo!', 'spanish');
      
      // Verify each token index matches its position in original
      tokens.forEach(token => {
        const originalSubstr = 'Hola, mundo!'.substring(token.index, token.index + token.text.length);
        expect(originalSubstr).toBe(token.text);
      });
    });
  });

  describe('Edge cases', () => {
    it('handles text with only punctuation', () => {
      const tokens = tokenizeWords('...', 'spanish');
      
      expect(tokens.every(t => t.type === 'punctuation')).toBe(true);
    });

    it('handles text with only whitespace', () => {
      const tokens = tokenizeWords('   ', 'spanish');
      
      expect(tokens).toHaveLength(1);
      expect(tokens[0].type).toBe('whitespace');
    });

    it('handles very long Arabic word', () => {
      const longWord = 'مَرْحَبًامَرْحَبًامَرْحَبًا';
      const tokens = tokenizeWords(longWord, 'arabic');
      
      expect(tokens).toHaveLength(1);
      expect(tokens[0].text).toBe(longWord);
    });
  });
});
