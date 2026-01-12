/**
 * Egyptian Arabic inference system with caching
 * Automatically infers Egyptian Arabic when not provided by API
 */

import { openai } from '../lib/openai';
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
  
  try {
    console.log('[inferEgyptianArabic] Inferring Egyptian for:', msaText);
    
    const prompt = `Convert this Modern Standard Arabic (MSA) text to Egyptian Arabic:

MSA: ${msaText}

Provide the Egyptian Arabic version with proper vowel marks and its transliteration.
Egyptian Arabic often uses completely different words than MSA.

Common Egyptian replacements:
- كيف → إزاي (ezzay)
- ماذا → إيه (eih)
- الآن → دلوقتي (dilwa'ti)
- ذاهب → رايح (raayeh)
- أريد → عايز (aayez)
- جيد → كويس (kwayyis)
- العمل → الشغل (el-shoghl)

Return ONLY a JSON object:
{
  "egyptian": "Egyptian Arabic with vowels",
  "transliteration": "pronunciation"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Return valid json only." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3
    });
    
    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    if (result.egyptian && result.transliteration) {
      // Cache the result
      inferenceCache.set(cacheKey, result);
      saveCache();
      console.log('[inferEgyptianArabic] Inferred:', result);
      return result;
    }
  } catch (error) {
    console.error('[inferEgyptianArabic] Failed to infer:', error);
  }
  
  return null;
}

/**
 * Clear the inference cache (for debugging)
 */
export function clearInferenceCache() {
  inferenceCache.clear();
  localStorage.removeItem(CACHE_KEY);
}
