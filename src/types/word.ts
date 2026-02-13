/**
 * Language-agnostic word data types
 * Replaces field overloading (arabic_word for Spanish) with proper type unions
 */

/**
 * Spanish word data - dialect variants + learning depth
 */
export interface SpanishWordData {
  language: 'spanish';
  
  // Primary forms (dialect variants)
  spanish_latam: string;      // LatAm Spanish (Mexican/Colombian neutral)
  spanish_spain?: string;      // Spain variant (if significantly different)
  
  // Translation
  translation: string;
  
  // Pronunciation (optional IPA or phonetic)
  pronunciation?: string;
  
  // Part of speech
  partOfSpeech?: string;
  
  // Context and usage
  wordContext?: {
    usage_notes?: string;      // Common usage contexts
    register?: 'formal' | 'informal' | 'slang' | 'neutral';
    latam_notes?: string;      // LatAm-specific notes
    spain_notes?: string;      // Spain-specific notes
    etymology?: string;        // Brief word origin
  };
  
  // Example sentences (LatAm + Spain variants)
  exampleSentences?: Array<{
    spanish_latam: string;
    spanish_spain?: string;    // Spain variant if different
    english: string;
    explanation?: string;      // Usage context or dialect note
  }>;
  
  // Memory aid
  memoryAid?: {
    mnemonic?: string;         // Memory trick or association
    visual_cue?: string;       // Memorable image concept
  };
}

/**
 * Arabic word data - existing structure
 */
export interface ArabicWordData {
  language: 'arabic';
  
  // MSA with harakat
  arabic: string;
  
  // Egyptian variant
  arabicEgyptian?: string;
  
  // Translation
  translation: string;
  
  // Pronunciations
  transliteration?: string;
  transliterationEgyptian?: string;
  
  // Part of speech
  partOfSpeech?: string;
  
  // Context
  wordContext?: {
    root?: string;
    root_meaning?: string;
    egyptian_usage: string;
    msa_comparison: string;
    cultural_notes?: string;
  };
  
  // Letter breakdown
  letterBreakdown?: Array<{
    word: string;
    letters: Array<{
      letter: string;
      name: string;
      sound: string;
    }>;
  }>;
  
  // Hebrew cognate
  hebrewCognate?: {
    root: string;
    meaning: string;
    notes?: string;
  } | null;
  
  // Example sentences
  exampleSentences?: Array<{
    arabic_msa: string;
    arabic_egyptian: string;
    transliteration_msa: string;
    transliteration_egyptian: string;
    english: string;
    explanation?: string;
  }>;
}

/**
 * Unified word data - language-agnostic union type
 * Use this for components that support both languages
 */
export type WordData = ArabicWordData | SpanishWordData;

/**
 * Type guard for Arabic word data
 */
export function isArabicWord(word: WordData): word is ArabicWordData {
  return word.language === 'arabic';
}

/**
 * Type guard for Spanish word data
 */
export function isSpanishWord(word: WordData): word is SpanishWordData {
  return word.language === 'spanish';
}

/**
 * Get primary text for any word (for display/sorting)
 */
export function getPrimaryText(word: WordData, dialectPreference?: 'primary' | 'secondary'): string {
  if (isArabicWord(word)) {
    return dialectPreference === 'primary' || !word.arabicEgyptian
      ? word.arabic
      : word.arabicEgyptian;
  } else {
    return dialectPreference === 'secondary' && word.spanish_spain
      ? word.spanish_spain
      : word.spanish_latam;
  }
}
