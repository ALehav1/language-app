import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Language, ArabicDialect, SpanishDialect } from '../src/types/database';
import OpenAI from 'openai';
import { findHebrewCognate } from '../src/utils/hebrewCognates';

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

interface AnalyzePassageRequest {
  text: string;
  language: Language;
  dialect?: ArabicDialect | SpanishDialect;
}

interface PassageWord {
  arabic: string;
  arabic_egyptian?: string;
  transliteration: string;
  transliteration_egyptian?: string;
  translation: string;
  part_of_speech?: string;
}

interface PassageSentence {
  arabic_msa: string;
  arabic_egyptian: string;
  transliteration_msa: string;
  transliteration_egyptian: string;
  translation: string;
  words: PassageWord[];
  explanation?: string;
}

interface PassageResult {
  detected_language?: string;
  original_text?: string;
  full_translation: string;
  full_transliteration: string;
  sentences: PassageSentence[];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, language, dialect: _dialect } = req.body as AnalyzePassageRequest;

    if (!text || !language) {
      return res.status(400).json({ error: 'Missing required fields: text, language' });
    }

    const isArabic = language === 'arabic';
    const isSpanish = language === 'spanish';

    // Detect input language
    const arabicChars = (text.match(/[؀-ۿ]/g) || []).length;
    const spanishChars = (text.match(/[áéíóúüñ¿¡]/gi) || []).length;
    const latinChars = (text.match(/[a-zA-Z]/g) || []).length;

    const isArabicInput = isArabic && arabicChars > latinChars;
    const isSpanishInput = isSpanish && (spanishChars > 0 || latinChars > arabicChars);

    let prompt = '';

    if (isSpanish && isSpanishInput) {
      prompt = `
    Analyze this Spanish passage and break it down sentence by sentence, word by word.

    Text: "${text}"

    CRITICAL REQUIREMENTS:
    1. This is SPANISH text - do NOT translate to or mention Arabic
    2. Split into sentences
    3. For EACH sentence provide:
       - Original Spanish text
       - English translation
       - Word-by-word breakdown

    4. For EACH word in the breakdown:
       - Spanish word
       - English translation
       - Part of speech

    Return ONLY valid JSON (use Spanish text in all Spanish fields, NO Arabic):
    {
      "detected_language": "spanish",
      "original_text": "${text}",
      "full_translation": "Complete English translation of ENTIRE passage",
      "full_transliteration": "${text}",
      "sentences": [
        {
          "arabic_msa": "Spanish sentence here",
          "arabic_egyptian": "Spanish sentence here",
          "transliteration_msa": "Spanish sentence here",
          "transliteration_egyptian": "Spanish sentence here",
          "translation": "English translation of this sentence",
          "explanation": "Grammar notes (optional)",
          "words": [
            {
              "arabic": "palabra",
              "arabic_egyptian": "palabra",
              "transliteration": "palabra",
              "transliteration_egyptian": "palabra",
              "translation": "word",
              "part_of_speech": "noun"
            }
          ]
        }
      ]
    }
    `;
    } else if (isSpanish && !isSpanishInput) {
      prompt = `
    Translate this English passage to Spanish and break it down sentence by sentence, word by word.

    English Text: "${text}"

    CRITICAL REQUIREMENTS:
    1. This is for SPANISH learning - do NOT translate to or mention Arabic
    2. Translate the ENTIRE passage to Spanish (not just first sentence)
    3. Split into sentences
    4. For EACH sentence provide:
       - Spanish translation
       - Original English
       - Word-by-word breakdown of the Spanish

    5. For EACH word in the breakdown:
       - Spanish word
       - English translation
       - Part of speech

    Return ONLY valid JSON (use Spanish text in all Spanish fields, NO Arabic):
    {
      "detected_language": "english",
      "original_text": "${text}",
      "full_translation": "Complete Spanish translation of ENTIRE passage",
      "full_transliteration": "Complete Spanish translation",
      "sentences": [
        {
          "arabic_msa": "Spanish sentence",
          "arabic_egyptian": "Spanish sentence",
          "transliteration_msa": "Spanish sentence",
          "transliteration_egyptian": "Spanish sentence",
          "translation": "Original English sentence",
          "explanation": "Grammar notes (optional)",
          "words": [
            {
              "arabic": "palabra",
              "arabic_egyptian": "palabra",
              "transliteration": "palabra",
              "transliteration_egyptian": "palabra",
              "translation": "word",
              "part_of_speech": "noun"
            }
          ]
        }
      ]
    }
    `;
    } else if (isArabicInput) {
      prompt = `
    Analyze this Arabic passage and break it down sentence by sentence, word by word.

    Text: "${text}"

    REQUIREMENTS:
    1. Split into sentences (or treat as one sentence if short)
    2. For EACH sentence provide:
       - MSA version with full vowel diacritics (harakat)
       - Egyptian Arabic version (how Egyptians would actually say it)
       - Transliteration for both
       - English translation
       - Word-by-word breakdown

    3. For EACH word in the breakdown:
       - Arabic with diacritics
       - Egyptian variant if different
       - Transliteration
       - Translation
       - Part of speech (noun, verb, particle, etc.)

    4. Egyptian Arabic should use ACTUAL Egyptian words, not just pronunciation variants:
       - "want" → MSA: أُرِيد, Egyptian: عَايِز
       - "what" → MSA: مَاذَا, Egyptian: إيه
       - "now" → MSA: الآن, Egyptian: دِلْوَقْتِي

    Return ONLY valid JSON:
    {
      "detected_language": "arabic",
      "original_text": "${text}",
      "full_translation": "Complete English translation",
      "full_transliteration": "Full transliteration of the passage",
      "sentences": [
        {
          "arabic_msa": "MSA sentence with harakat",
          "arabic_egyptian": "Egyptian version",
          "transliteration_msa": "MSA transliteration",
          "transliteration_egyptian": "Egyptian transliteration",
          "translation": "English translation",
          "explanation": "Grammar/dialect notes (optional)",
          "words": [
            {
              "arabic": "كَلِمَة",
              "arabic_egyptian": "كِلْمَة",
              "transliteration": "kalima",
              "transliteration_egyptian": "kilma",
              "translation": "word",
              "part_of_speech": "noun"
            }
          ]
        }
      ]
    }
  `;
    } else {
      // English input -> translate to Arabic
      prompt = `
    Translate this English passage to Arabic and break it down sentence by sentence, word by word.

    English Text: "${text}"

    REQUIREMENTS:
    1. Translate the entire passage to Arabic
    2. Split into sentences (matching the English structure)
    3. For EACH sentence provide:
       - MSA version with full vowel diacritics (harakat)
       - Egyptian Arabic version (how Egyptians would ACTUALLY say it - use real Egyptian vocabulary!)
       - Transliteration for both
       - The original English
       - Word-by-word breakdown of the Arabic

    4. For EACH word in the breakdown:
       - Arabic with diacritics
       - Egyptian variant if different
       - Transliteration
       - English translation
       - Part of speech (noun, verb, particle, etc.)

    5. Egyptian Arabic MUST use ACTUAL Egyptian words, not just pronunciation variants:
       - "want" → MSA: أُرِيد, Egyptian: عَايِز
       - "what" → MSA: مَاذَا, Egyptian: إيه
       - "now" → MSA: الآن, Egyptian: دِلْوَقْتِي
       - "work" → MSA: عَمَل, Egyptian: شُغْل
       - "good" → MSA: جَيِّد, Egyptian: كْوَيِّس

    Return ONLY valid JSON:
    {
      "detected_language": "english",
      "original_text": "${text}",
      "full_translation": "Complete Arabic translation (Egyptian version)",
      "full_transliteration": "Full transliteration of the Arabic",
      "sentences": [
        {
          "arabic_msa": "MSA sentence with harakat",
          "arabic_egyptian": "Egyptian version",
          "transliteration_msa": "MSA transliteration",
          "transliteration_egyptian": "Egyptian transliteration",
          "translation": "Original English sentence",
          "explanation": "Grammar/dialect notes (optional)",
          "words": [
            {
              "arabic": "كَلِمَة",
              "arabic_egyptian": "كِلْمَة",
              "transliteration": "kalima",
              "transliteration_egyptian": "kilma",
              "translation": "word",
              "part_of_speech": "noun"
            }
          ]
        }
      ]
    }
  `;
    }

    // Language-specific system instruction
    const systemInstruction = isSpanish
      ? "Return valid JSON only. CRITICAL: This is for SPANISH learning. Do NOT include Arabic text, Arabic characters, or Arabic translations. Only Spanish and English."
      : "Return valid json only.";

    const response = await withRetry(() =>
      openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      })
    );

    const result = JSON.parse(response.choices[0].message.content || '{}') as PassageResult;

    // Validate that we got at least one sentence
    if (!result.sentences || result.sentences.length === 0) {
      console.error('[api/analyze-passage] Invalid result: empty sentences array', { text, language });
      return res.status(500).json({ error: 'Translation failed: API returned empty sentence list. Please try again.' });
    }

    // Validate each sentence has required fields
    for (const sentence of result.sentences) {
      const primaryText = sentence.arabic_msa || sentence.arabic_egyptian;
      if (!primaryText || !sentence.translation) {
        console.error('[api/analyze-passage] Invalid sentence: missing primary_text or translation');
        return res.status(500).json({ error: 'Translation failed: incomplete sentence data. Please try again.' });
      }
    }

    // Validate Spanish mode response - reject if contains Arabic characters
    if (isSpanish && result.full_translation) {
      const hasArabicChars = /[؀-ۿ]/.test(result.full_translation);
      if (hasArabicChars) {
        console.error('[api/analyze-passage] Spanish mode returned Arabic characters - retrying');
        const retryResponse = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: "Return valid JSON only. CRITICAL: You are analyzing SPANISH text for Spanish learners. Do NOT produce Arabic characters or Arabic translations under any circumstances. Only Spanish and English." },
            { role: "user", content: prompt + "\n\nIMPORTANT: Output SPANISH text only (and English translations). NO Arabic characters." }
          ],
          response_format: { type: "json_object" }
        });
        const retryResult = JSON.parse(retryResponse.choices[0].message.content || '{}') as PassageResult;
        return res.status(200).json(retryResult);
      }
    }

    // Apply static Hebrew cognate lookup to each word
    if (result.sentences) {
      for (const sentence of result.sentences) {
        if (sentence.words) {
          for (const word of sentence.words) {
            const cognate = findHebrewCognate(word.arabic);
            if (cognate) {
              (word as PassageWord & { hebrew_cognate?: typeof cognate }).hebrew_cognate = cognate;
            }
          }
        }
      }
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('[api/analyze-passage] Error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ error: message });
  }
}
