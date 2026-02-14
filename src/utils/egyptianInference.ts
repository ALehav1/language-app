/**
 * Egyptian Arabic inference system with caching
 * Automatically infers Egyptian Arabic when not provided by API
 */

import { getEgyptianEquivalent } from './egyptianDictionary';

// In-memory cache for inferred Egyptian Arabic
const inferenceCache = new Map<string, { egyptian: string; transliteration: string }>();

// Persist cache to localStorage
const CACHE_KEY = 'egyptian_inference_cache';

// Load cache from localStorage on startup
function loadCache() {
  try {
    const stored = localStorage.getItem(CACHE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      Object.entries(parsed).forEach(([key, value]) => {
        inferenceCache.set(key, value as any);
      });
    }
  } catch (e) {
    console.error('Failed to load Egyptian inference cache:', e);
  }
}

// Save cache to localStorage
function saveCache() {
  try {
    const obj = Object.fromEntries(inferenceCache.entries());
    localStorage.setItem(CACHE_KEY, JSON.stringify(obj));
  } catch (e) {
    console.error('Failed to save Egyptian inference cache:', e);
  }
}

// Load cache on module initialization
loadCache();

/**
 * Infer Egyptian Arabic for a given MSA word/phrase
 * Uses caching to avoid repeated API calls
 */
export async function inferEgyptianArabic(
  msaText: string
): Promise<{ egyptian: string; transliteration: string } | null> {
  // Strip diacritics for cache key
  const cacheKey = msaText.replace(/[\u064B-\u0652]/g, '').trim();
  
  // Check cache first
  if (inferenceCache.has(cacheKey)) {
    console.log('[inferEgyptianArabic] Cache hit for:', msaText);
    return inferenceCache.get(cacheKey)!;
  }
  
  // Check static dictionary
  const dictEntry = getEgyptianEquivalent(msaText);
  if (dictEntry) {
    const result = { egyptian: dictEntry.egyptian, transliteration: dictEntry.transliteration };
    inferenceCache.set(cacheKey, result);
    saveCache();
    return result;
  }
  
  // TODO: Route through /api/ endpoint if this function is ever used.
  // The raw openai client was removed from the browser bundle (Packet B).
  console.warn('[inferEgyptianArabic] AI inference unavailable — needs a serverless endpoint');
  return null;
}

/**
 * Clear the inference cache (for debugging)
 */
export function clearInferenceCache() {
  inferenceCache.clear();
  localStorage.removeItem(CACHE_KEY);
}
