/**
 * Domain-level types for PracticeItem enrichments
 * 
 * Strategy: UI-centric types allowed, DB types excluded
 * 
 * These types represent UX needs rather than DB schemas.
 * We re-export existing app types that are already UI-facing and stable,
 * avoiding direct coupling to database.ts while maintaining strong typing.
 * 
 * See ADR-001 addendum for rationale.
 */

// Re-export UI-facing types that are stable across modalities
// These are defined in types/ but represent UX concepts, not DB schemas
export type {
  HebrewCognate,
  LetterBreakdown,
  ExampleSentence,
} from '../../types/database';

/**
 * Future enrichment types for voice + Spanish will live here:
 * - PronunciationMetadata (confidence, dialect, speaker)
 * - SpeechToTextResult (transcription, confidence, alternatives)
 * - DialectVariation (regional pronunciations)
 * 
 * These will be domain-first types, not DB exports.
 */
