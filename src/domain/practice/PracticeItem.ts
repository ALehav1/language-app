/**
 * PracticeItem - Canonical domain abstraction for learnable content
 * 
 * Language and modality agnostic representation supporting:
 * - Multiple languages (Arabic, Spanish, Hebrew)
 * - Multiple input modes (text, speech)
 * - Multiple sources (lessons, saved words, lookup, voice)
 * 
 * See ADR-001 for design decisions and rationale.
 */

import type { HebrewCognate, LetterBreakdown, ExampleSentence } from './types';

export type PracticeLanguage = 'arabic' | 'spanish' | 'hebrew' | 'english';

export type PracticeContentType = 'word' | 'sentence' | 'passage' | 'dialog';

export type PracticeSource =
  | 'lesson_vocab_item'     // vocabulary_items (lesson-driven)
  | 'saved_word'            // saved_words
  | 'lookup_result'         // lookup flow (future-proof)
  | 'voice_turn';           // voice conversation (future-proof)

export type PromptType =
  | 'show_target'           // show target language content
  | 'show_translation'      // show English, user answers target
  | 'play_audio'            // user hears prompt (voice)
  | 'show_context';         // sentence/dialog context prompt

export type AnswerType =
  | 'text_translation'      // current behavior: user types English translation
  | 'text_target'           // user types target language
  | 'speech'                // user speaks (future)
  | 'transliteration';      // user provides transliteration (current dual-input path)

export interface PracticeOrigin {
  type: PracticeSource;
  id?: string;              // the primary record id for the origin, if any
}

export interface PracticeLinkage {
  lessonId?: string;
  vocabularyItemId?: string;
  savedWordId?: string;
}

/**
 * PracticeItem - Single abstraction for all practice content
 * 
 * Design principles:
 * - Language explicit (never hardcoded)
 * - Source tracking (origin + linkage)
 * - Raw state preservation (no mastery translation in PR-2)
 * - Prompt/answer framing (voice-ready)
 * - Optional enrichments (not all sources provide all fields)
 */
export interface PracticeItem {
  // Identity
  id: string;
  language: PracticeLanguage;
  contentType: PracticeContentType;

  // Core content
  targetText: string;        // "سلام", "¿Dónde está...?", etc.
  translation: string;       // English meaning (current exercises use this as correctAnswer)
  transliteration?: string;

  // Exercise framing (voice + Spanish-ready)
  promptType: PromptType;
  answerType: AnswerType;

  // Learning state (carry raw states; avoid translation in PR-2)
  // These fields allow PR-4 to define canon later.
  masteryLevelRaw?: string;  // e.g. vocabulary_items.mastery_level or saved_words.status
  timesPracticed?: number;
  timesCorrect?: number;
  lastReviewed?: string | null;
  nextReview?: string | null;

  // Provenance
  origin: PracticeOrigin;
  linkage?: PracticeLinkage;

  // Enrichments (optional - domain-level types, not DB schemas)
  letterBreakdown?: LetterBreakdown[];    // Arabic/Hebrew letter breakdown with vowels
  hebrewCognate?: HebrewCognate;          // Hebrew cognate information (if applicable)
  exampleSentences?: ExampleSentence[];   // Example sentences showing usage

  // Memory aids (optional)
  memoryNote?: string | null;
  memoryImageUrl?: string | null;

  // Timestamps (optional for non-DB sources)
  createdAt?: string;
}
