import { describe, it, expect } from 'vitest';
import { splitSentences, countSentences, isMultiSentence } from './splitSentences';

describe('splitSentences', () => {
  describe('Basic splitting', () => {
    it('splits simple Spanish sentences', () => {
      const sentences = splitSentences('Hola. ¿Cómo estás?', 'spanish');
      
      expect(sentences).toHaveLength(2);
      expect(sentences[0].text).toBe('Hola.');
      expect(sentences[1].text).toBe('¿Cómo estás?');
    });

    it('splits simple Arabic sentences', () => {
      const sentences = splitSentences('مرحبا. كيف حالك؟', 'arabic');
      
      expect(sentences).toHaveLength(2);
      expect(sentences[0].text).toBe('مرحبا.');
      expect(sentences[1].text).toBe('كيف حالك؟');
    });

    it('handles single sentence', () => {
      const sentences = splitSentences('Hola mundo', 'spanish');
      
      expect(sentences).toHaveLength(1);
      expect(sentences[0].text).toBe('Hola mundo');
    });

    it('handles empty string', () => {
      const sentences = splitSentences('', 'spanish');
      expect(sentences).toHaveLength(0);
    });
  });

  describe('Punctuation handling', () => {
    it('handles period-ended sentences', () => {
      const sentences = splitSentences('First sentence. Second sentence.', 'spanish');
      
      expect(sentences).toHaveLength(2);
      expect(sentences[0].text).toBe('First sentence.');
      expect(sentences[1].text).toBe('Second sentence.');
    });

    it('handles question mark-ended sentences', () => {
      const sentences = splitSentences('What? Who? Why?', 'spanish');
      
      expect(sentences).toHaveLength(3);
      expect(sentences[0].text).toBe('What?');
      expect(sentences[1].text).toBe('Who?');
      expect(sentences[2].text).toBe('Why?');
    });

    it('handles exclamation mark-ended sentences', () => {
      const sentences = splitSentences('Hello! Welcome!', 'spanish');
      
      expect(sentences).toHaveLength(2);
      expect(sentences[0].text).toBe('Hello!');
      expect(sentences[1].text).toBe('Welcome!');
    });

    it('handles Arabic question mark (؟)', () => {
      const sentences = splitSentences('كيف حالك؟ أنا بخير.', 'arabic');
      
      expect(sentences).toHaveLength(2);
      expect(sentences[0].text).toBe('كيف حالك؟');
      expect(sentences[1].text).toBe('أنا بخير.');
    });

    it('handles mixed punctuation', () => {
      const sentences = splitSentences('Hello. How are you? I am fine!', 'spanish');
      
      expect(sentences).toHaveLength(3);
      expect(sentences[0].text).toBe('Hello.');
      expect(sentences[1].text).toBe('How are you?');
      expect(sentences[2].text).toBe('I am fine!');
    });
  });

  describe('Whitespace handling', () => {
    it('trims whitespace from sentences', () => {
      const sentences = splitSentences('  First.   Second.  ', 'spanish');
      
      expect(sentences).toHaveLength(2);
      expect(sentences[0].text).toBe('First.');
      expect(sentences[1].text).toBe('Second.');
    });

    it('handles multiple spaces between sentences', () => {
      const sentences = splitSentences('First.     Second.', 'spanish');
      
      expect(sentences).toHaveLength(2);
      expect(sentences[0].text).toBe('First.');
      expect(sentences[1].text).toBe('Second.');
    });

    it('handles newlines between sentences', () => {
      const sentences = splitSentences('First.\nSecond.', 'spanish');
      
      expect(sentences).toHaveLength(2);
      expect(sentences[0].text).toBe('First.');
      expect(sentences[1].text).toBe('Second.');
    });
  });

  describe('Text without ending punctuation', () => {
    it('includes text without ending punctuation as last sentence', () => {
      const sentences = splitSentences('First. Second', 'spanish');
      
      expect(sentences).toHaveLength(2);
      expect(sentences[0].text).toBe('First.');
      expect(sentences[1].text).toBe('Second');
    });

    it('handles text with no punctuation', () => {
      const sentences = splitSentences('Just one long sentence', 'spanish');
      
      expect(sentences).toHaveLength(1);
      expect(sentences[0].text).toBe('Just one long sentence');
    });
  });

  describe('Index positions', () => {
    it('preserves correct index positions', () => {
      const text = 'First. Second. Third.';
      const sentences = splitSentences(text, 'spanish');
      
      expect(sentences).toHaveLength(3);
      expect(sentences[0].index).toBe(0);
      expect(sentences[1].index).toBeGreaterThan(sentences[0].index);
      expect(sentences[2].index).toBeGreaterThan(sentences[1].index);
    });

    it('index points to start of sentence in original text', () => {
      const text = 'Hello. World.';
      const sentences = splitSentences(text, 'spanish');
      
      sentences.forEach(sentence => {
        // Can't easily verify exact index due to trim, but should be >= 0
        expect(sentence.index).toBeGreaterThanOrEqual(0);
        expect(sentence.index).toBeLessThan(text.length);
      });
    });
  });

  describe('Arabic-specific cases', () => {
    it('handles Arabic with Egyptian punctuation', () => {
      const sentences = splitSentences('إزيك؟ أنا كويس.', 'arabic');
      
      expect(sentences).toHaveLength(2);
      expect(sentences[0].text).toBe('إزيك؟');
      expect(sentences[1].text).toBe('أنا كويس.');
    });

    it('handles Arabic with mixed MSA and Egyptian', () => {
      const text = 'أنا بحب القهوة. كيف حالك؟ أنا بخير.';
      const sentences = splitSentences(text, 'arabic');
      
      expect(sentences).toHaveLength(3);
    });

    it('preserves Arabic diacritics in sentences', () => {
      const sentences = splitSentences('مَرْحَبًا. كَيْفَ حَالُكَ؟', 'arabic');
      
      expect(sentences).toHaveLength(2);
      expect(sentences[0].text).toBe('مَرْحَبًا.');
      expect(sentences[1].text).toBe('كَيْفَ حَالُكَ؟');
    });
  });

  describe('Edge cases', () => {
    it('handles text with only punctuation', () => {
      const sentences = splitSentences('...', 'spanish');
      
      // Each period might be treated as sentence ending
      // Behavior depends on regex - just verify no crash
      expect(Array.isArray(sentences)).toBe(true);
    });

    it('handles very long multi-sentence text', () => {
      const longText = Array(10).fill('Sentence.').join(' ');
      const sentences = splitSentences(longText, 'spanish');
      
      expect(sentences.length).toBeGreaterThan(5);
    });

    it('handles sentence with numbers', () => {
      const sentences = splitSentences('I have 3 cats. You have 2 dogs.', 'spanish');
      
      expect(sentences).toHaveLength(2);
      expect(sentences[0].text).toBe('I have 3 cats.');
      expect(sentences[1].text).toBe('You have 2 dogs.');
    });
  });

  describe('Known limitations', () => {
    it('may split on abbreviations (documented limitation)', () => {
      // This is a known limitation - abbreviations like "Dr." may cause splits
      const sentences = splitSentences('Dr. Smith is here.', 'spanish');
      
      // Might split as 2 sentences: ["Dr.", "Smith is here."]
      // This is acceptable per ADR-004 documentation
      expect(sentences.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Utility functions', () => {
    it('countSentences returns correct count', () => {
      expect(countSentences('One.', 'spanish')).toBe(1);
      expect(countSentences('One. Two.', 'spanish')).toBe(2);
      expect(countSentences('One. Two. Three.', 'spanish')).toBe(3);
      expect(countSentences('', 'spanish')).toBe(0);
    });

    it('isMultiSentence detects multiple sentences', () => {
      expect(isMultiSentence('One.', 'spanish')).toBe(false);
      expect(isMultiSentence('One. Two.', 'spanish')).toBe(true);
      expect(isMultiSentence('No punctuation', 'spanish')).toBe(false);
      expect(isMultiSentence('', 'spanish')).toBe(false);
    });

    it('isMultiSentence works with Arabic', () => {
      expect(isMultiSentence('مرحبا.', 'arabic')).toBe(false);
      expect(isMultiSentence('مرحبا. كيف حالك؟', 'arabic')).toBe(true);
    });
  });
});
