import type { Language, MasteryLevel, ArabicDialect, SpanishDialect, ContentType } from '../types/database';
import {
  apiLookupWord,
  apiAnalyzePassage,
  apiGenerateLessonContent,
  apiEvaluateAnswer,
  apiGenerateMemoryImage,
} from './api';

export interface AIContent {
  title: string;
  description: string;
  items: Array<{
    word: string;
    translation: string;
    transliteration?: string;
    hebrew_root?: string;
    hebrew_meaning?: string;
    hebrew_note?: string;
    letter_breakdown?: Array<{
      letter: string;
      name: string;
      sound: string;
    }>;
    // For dialog content type
    speaker?: string;
    context?: string;
  }>;
}

export async function generateLessonContent(
  topic: string,
  language: Language,
  level: MasteryLevel,
  contentType: ContentType = 'word',
  dialect?: ArabicDialect | SpanishDialect,
  excludeWords: string[] = []
): Promise<AIContent> {
  return apiGenerateLessonContent(topic, language, level, contentType, dialect, excludeWords);
}

export async function evaluateAnswer(
  userAnswer: string,
  correctAnswer: string,
  language: Language
): Promise<{ correct: boolean; feedback: string }> {
  return apiEvaluateAnswer(userAnswer, correctAnswer, language);
}

/**
 * Example sentence showing the word in context - with both MSA and Egyptian versions.
 */
export interface ExampleSentence {
  // MSA (formal) version
  arabic_msa: string;              // MSA sentence with harakat
  transliteration_msa: string;     // MSA pronunciation
  // Egyptian (spoken) version - THIS IS THE PRIMARY VERSION
  arabic_egyptian: string;         // Egyptian Arabic sentence
  transliteration_egyptian: string; // Egyptian pronunciation
  // Shared
  english: string;                 // English translation
  explanation?: string;            // Usage note - when to use Egyptian vs MSA
}

/**
 * Word context information
 */
export interface WordContext {
  root?: string;
  root_meaning?: string;
  egyptian_usage: string;
  msa_comparison: string;
  cultural_notes?: string;
}

/**
 * Detected input language from lookup/analysis.
 */
export type DetectedLanguage = 'english' | 'arabic' | 'spanish';

/**
 * Spanish-specific context (NO Arabic field overloading)
 */
export interface SpanishWordContext {
  usage_notes?: string;      // Common usage contexts
  register?: 'formal' | 'informal' | 'slang' | 'neutral';
  latam_notes?: string;      // LatAm-specific notes
  spain_notes?: string;      // Spain-specific notes
  etymology?: string;        // Brief word origin
}

/**
 * Spanish example sentence (NO Arabic field overloading)
 */
export interface SpanishExampleSentence {
  spanish_latam: string;     // LatAm Spanish sentence
  spanish_spain?: string;    // Spain variant (if different)
  english: string;           // English translation
  explanation?: string;      // Usage context or dialect note
}

/**
 * Spanish lookup result - EXPLICIT Spanish fields, NO Arabic overloading
 */
export interface SpanishLookupResult {
  detected_language: 'spanish' | 'english';
  spanish_latam: string;           // Primary Spanish form (LatAm neutral)
  spanish_spain?: string;          // Spain variant (if different)
  translation_en: string;          // English translation
  pronunciation?: string;          // IPA or phonetic guide (optional)
  part_of_speech?: string;         // noun, verb, adjective, etc.
  word_context?: SpanishWordContext;
  example_sentences?: SpanishExampleSentence[];
  memory_aid?: {
    mnemonic?: string;             // Memory trick or association
    visual_cue?: string;           // Memorable image concept
  };
}

/**
 * Arabic lookup result - EXPLICIT Arabic fields.
 * Alias for the existing LookupResult; use this name in new code.
 */
export type ArabicLookupResult = LookupResult;

/**
 * Discriminated union of Arabic and Spanish lookup results.
 * Use structural type guards (isSpanishLookupResult / isArabicLookupResult) to narrow.
 */
export type LookupWordResult = ArabicLookupResult | SpanishLookupResult;

export function isSpanishLookupResult(r: LookupWordResult): r is SpanishLookupResult {
  return 'spanish_latam' in r;
}

export function isArabicLookupResult(r: LookupWordResult): r is ArabicLookupResult {
  return 'arabic_word' in r;
}

/**
 * Arabic lookup result for a word or phrase.
 * @deprecated Use ArabicLookupResult in new code. Kept for backward compatibility.
 */
export interface LookupResult {
  detected_language: DetectedLanguage;
  arabic_word: string;  // MSA word WITH harakat (Arabic) OR primary Spanish form (LatAm)
  arabic_word_egyptian?: string;  // Egyptian word (Arabic) OR Spain Spanish variant
  translation: string;
  pronunciation_standard: string;  // MSA transliteration (Arabic) OR IPA/phonetic (Spanish)
  pronunciation_egyptian: string;  // Egyptian transliteration (Arabic) OR empty (Spanish)
  word_context?: WordContext;
  letter_breakdown: Array<{
    letter: string;  // Letter WITH diacritics
    name: string;
    sound: string;
  }>;
  letter_breakdown_egyptian?: Array<{  // Egyptian word letter breakdown
    letter: string;
    name: string;
    sound: string;
  }>;
  hebrew_cognate?: {
    root: string;
    meaning: string;
    notes?: string;
  };
  example_sentences: ExampleSentence[];  // 2-3 example sentences with MSA + Egyptian (Arabic) OR LatAm + Spain (Spanish)
  memory_aid?: {  // P2-C: Spanish parity
    mnemonic?: string;
    visual_cue?: string;
  };
}

/**
 * Look up any word in the selected language.
 * Delegates to serverless function at /api/lookup.
 */
export async function lookupWord(
  input: string,
  options: { language: Language; dialect?: ArabicDialect | SpanishDialect }
): Promise<LookupWordResult> {
  return apiLookupWord(input, options);
}

/**
 * Arabic word breakdown for passage analysis.
 */
export interface ArabicPassageWord {
  arabic: string;           // Arabic word with diacritics
  arabic_egyptian?: string; // Egyptian variant if different
  transliteration: string;
  transliteration_egyptian?: string;
  translation: string;
  part_of_speech?: string;
  hebrew_cognate?: { root: string; meaning: string; notes?: string };
}

/**
 * Spanish word breakdown for passage analysis (NO Arabic field overloading).
 */
export interface SpanishPassageWord {
  spanish_latam: string;
  spanish_spain?: string;
  pronunciation?: string;
  translation: string;
  part_of_speech?: string;
}

export type PassageWord = ArabicPassageWord | SpanishPassageWord;

/**
 * Arabic sentence breakdown for passage analysis.
 */
export interface ArabicPassageSentence {
  arabic_msa: string;
  arabic_egyptian: string;
  transliteration_msa: string;
  transliteration_egyptian: string;
  translation: string;
  words: ArabicPassageWord[];
  explanation?: string;
}

/**
 * Spanish sentence breakdown for passage analysis (NO Arabic field overloading).
 */
export interface SpanishPassageSentence {
  spanish_latam: string;
  spanish_spain?: string;
  pronunciation?: string;
  translation: string;
  words: SpanishPassageWord[];
  explanation?: string;
}

export type PassageSentence = ArabicPassageSentence | SpanishPassageSentence;

export function isArabicPassageSentence(s: PassageSentence): s is ArabicPassageSentence {
  return 'arabic_msa' in s;
}

export function isSpanishPassageSentence(s: PassageSentence): s is SpanishPassageSentence {
  return 'spanish_latam' in s;
}

/**
 * Result from analyzing a passage.
 */
export interface PassageResult {
  detected_language?: DetectedLanguage;
  original_text?: string;
  full_translation: string;
  full_transliteration: string;
  sentences: PassageSentence[];
}

/**
 * Analyze a full passage (multiple sentences).
 * Delegates to serverless function at /api/analyze-passage.
 */
export async function analyzePassage(
  text: string,
  options: { language: Language; dialect?: ArabicDialect | SpanishDialect }
): Promise<PassageResult> {
  return apiAnalyzePassage(text, options);
}

/**
 * Generate a memory aid image using DALL-E.
 * Delegates to serverless function at /api/generate-image.
 */
export async function generateMemoryImage(
  word: string,
  translation: string,
  customPrompt?: string
): Promise<string | null> {
  return apiGenerateMemoryImage(word, translation, customPrompt);
}
