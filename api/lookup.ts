import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Language, ArabicDialect, SpanishDialect } from '../src/types/database';
import OpenAI from 'openai';
import { findHebrewCognate } from './_lib/hebrewCognates';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`OpenAI API attempt ${attempt + 1} failed:`, lastError.message);

      if (lastError.message.includes('API key') || lastError.message.includes('401')) {
        throw lastError;
      }

      if (attempt < maxRetries - 1) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Unknown error during API call');
}
import { getEgyptianEquivalent } from './_lib/egyptianDictionary';
import { shouldShowHebrewCognate } from './_lib/shouldShowHebrewCognate';

interface LookupRequest {
  input: string;
  language: Language;
  dialect?: ArabicDialect | SpanishDialect;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { input, language } = req.body as LookupRequest;

    if (!input || !language) {
      return res.status(400).json({ error: 'Missing required fields: input, language' });
    }

    const isArabic = language === 'arabic';

    const prompt = isArabic ? `
    Analyze this word or sentence: "${input}"

    CRITICAL REQUIREMENTS:

    1. Detect the language (Arabic or English)
    2. If English: translate to Arabic WITH FULL VOWEL DIACRITICS (harakat)
    3. If Arabic: provide English translation

    4. Provide BOTH MSA (Modern Standard Arabic) and Egyptian Arabic versions:
       - arabic_word = MSA with full harakat
       - arabic_word_egyptian = Egyptian variant (REQUIRED if different from MSA)
       - pronunciation_standard = MSA transliteration
       - pronunciation_egyptian = Egyptian transliteration

    5. Letter breakdown for the MSA word:
       - Break down each letter with its diacritic
       - Include letter name and sound
       Example: عَمَل → [{ letter: "عَ", name: "Ayn with fatha", sound: "a" }, ...]

    6. Context and usage (word_context):
       - root: Trilateral root if applicable
       - egyptian_usage: How Egyptians use this in daily speech
       - msa_comparison: Key differences between MSA and Egyptian usage
       - cultural_notes: Any cultural context

    7. Example sentences (2-3 sentences, BOTH MSA and Egyptian):
       - arabic_msa: MSA sentence with harakat
       - arabic_egyptian: Egyptian sentence (actual daily speech)
       - transliteration_msa: MSA pronunciation
       - transliteration_egyptian: Egyptian pronunciation
       - english: English translation
       - explanation: Note key dialect differences

    Return ONLY valid JSON:
    {
      "detected_language": "arabic" | "english",
      "arabic_word": "MSA word WITH harakat",
      "arabic_word_egyptian": "Egyptian word (if different)",
      "translation": "English translation",
      "pronunciation_standard": "MSA transliteration",
      "pronunciation_egyptian": "Egyptian transliteration",
      "letter_breakdown": [
        { "letter": "عَ", "name": "Ayn with fatha", "sound": "a" }
      ],
      "word_context": {
        "root": "trilateral root",
        "egyptian_usage": "usage notes",
        "msa_comparison": "dialect differences",
        "cultural_notes": "cultural context"
      },
      "example_sentences": [
        {
          "arabic_msa": "MSA sentence with harakat",
          "transliteration_msa": "MSA pronunciation",
          "arabic_egyptian": "Egyptian sentence",
          "transliteration_egyptian": "Egyptian pronunciation",
          "english": "English translation",
          "explanation": "dialect notes"
        }
      ]
    }` : `
    Analyze this Spanish/English word or sentence: "${input}"

    SPANISH DATA CONTRACT - NO ARABIC FIELDS:

    1. Detect the language (Spanish or English)
    2. If English: translate to Spanish (LatAm neutral)
    3. If Spanish: provide English translation

    4. Return BOTH dialect variants with SPANISH field names:
       - spanish_latam: Primary form (Mexican/Colombian neutral)
       - spanish_spain: Castilian variant (if different)

    5. Context and usage (word_context):
       - usage_notes: Common contexts
       - register: formal | informal | slang | neutral
       - latam_notes: LatAm-specific notes
       - spain_notes: Spain-specific notes
       - etymology: Brief word origin

    6. Example sentences (2-3) with SPANISH field names:
       - spanish_latam: LatAm Spanish sentence
       - spanish_spain: Spain variant (if different)
       - english: English translation
       - explanation: Usage context

    7. Memory aid:
       - mnemonic: Memory trick (in English)
       - visual_cue: Memorable image description

    Return ONLY valid JSON with SPANISH field names (NOT arabic_*):
    {
      "detected_language": "spanish" | "english",
      "spanish_latam": "PRIMARY SPANISH FORM (LatAm neutral)",
      "spanish_spain": "SPAIN VARIANT (if different, else omit)",
      "translation_en": "English translation",
      "pronunciation": "IPA or phonetic guide (optional)",
      "part_of_speech": "noun | verb | adjective | etc.",
      "word_context": {
        "usage_notes": "Common usage contexts",
        "register": "formal | informal | slang | neutral",
        "latam_notes": "LatAm-specific notes",
        "spain_notes": "Spain-specific notes",
        "etymology": "Brief origin if relevant"
      },
      "example_sentences": [
        {
          "spanish_latam": "LatAm Spanish sentence",
          "spanish_spain": "Spain variant (if different)",
          "english": "English translation",
          "explanation": "Context or dialect note"
        }
      ],
      "memory_aid": {
        "mnemonic": "Memory trick or word association",
        "visual_cue": "Memorable image concept description"
      }
    }

    CRITICAL: Use spanish_latam/spanish_spain fields, NOT arabic_*/arabic_msa/arabic_egyptian
  `;

    const response = await withRetry(() =>
      openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "Return valid json only." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      })
    );

    const rawResult = JSON.parse(response.choices[0].message.content || '{}');

    // Spanish path: normalize to SpanishLookupResult shape
    if (!isArabic) {
      interface SpanishExSentence {
        spanish_latam?: string;
        arabic_msa?: string;
        spanish_spain?: string;
        arabic_egyptian?: string;
        english?: string;
        explanation?: string;
      }

      const spanishResult = {
        detected_language: rawResult.detected_language || 'spanish',
        spanish_latam: rawResult.spanish_latam || rawResult.arabic_word || '',
        spanish_spain: rawResult.spanish_spain || rawResult.arabic_word_egyptian,
        translation_en: rawResult.translation_en || rawResult.translation || '',
        pronunciation: rawResult.pronunciation || rawResult.pronunciation_standard,
        part_of_speech: rawResult.part_of_speech,
        word_context: rawResult.word_context ? {
          usage_notes: rawResult.word_context.usage_notes,
          register: rawResult.word_context.register,
          latam_notes: rawResult.word_context.latam_notes,
          spain_notes: rawResult.word_context.spain_notes,
          etymology: rawResult.word_context.etymology,
        } : undefined,
        example_sentences: rawResult.example_sentences?.map((s: SpanishExSentence) => ({
          spanish_latam: s.spanish_latam || s.arabic_msa || '',
          spanish_spain: s.spanish_spain || s.arabic_egyptian,
          english: s.english || '',
          explanation: s.explanation,
        })),
        memory_aid: rawResult.memory_aid,
      };
      return res.status(200).json(spanishResult);
    }

    // Arabic path: apply post-processing
    const result = rawResult;

    // Check Egyptian dictionary for reliable Egyptian equivalents
    if (result.arabic_word) {
      const egyptianEquivalent = getEgyptianEquivalent(result.arabic_word);
      if (egyptianEquivalent) {
        result.arabic_word_egyptian = egyptianEquivalent.egyptian;
        result.pronunciation_egyptian = egyptianEquivalent.transliteration;
      }
    }

    // Override AI's hebrew_cognate with static lookup table (more reliable)
    let staticCognate = null;

    // Try Egyptian form first (if available)
    if (result.arabic_word_egyptian) {
      staticCognate = findHebrewCognate(result.arabic_word_egyptian);
    }

    // If no Egyptian match, try MSA form
    if (!staticCognate && result.arabic_word) {
      staticCognate = findHebrewCognate(result.arabic_word);
    }

    // Fallback: try raw input
    if (!staticCognate && !result.arabic_word && !result.arabic_word_egyptian) {
      staticCognate = findHebrewCognate(input);
    }

    // Gate Hebrew attachment: only for Arabic, single-word inputs
    const shouldAttach = shouldShowHebrewCognate({
      language: result.detected_language === 'arabic' ? 'arabic' : 'spanish',
      contentType: 'word',
      hebrewCandidate: staticCognate || result.hebrew_cognate || null,
      selectedText: input
    });

    if (shouldAttach && staticCognate) {
      result.hebrew_cognate = staticCognate;
    } else if (!shouldAttach || !result.hebrew_cognate) {
      result.hebrew_cognate = undefined;
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('[api/lookup] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
