/**
 * Canonical surface components - THE ONLY renderers for words/sentences
 * 
 * INVARIANT: All word/sentence rendering goes through these surfaces.
 * Never import WordDisplay or SentenceDisplay directly.
 */

export { WordSurface, WordSurfaceCard, type WordSurfaceProps } from './WordSurface';
export { SentenceSurface, SentenceSurfaceCompact, type SentenceSurfaceProps, type SentenceData, type SentenceWord } from './SentenceSurface';
