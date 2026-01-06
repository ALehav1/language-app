import OpenAI from 'openai';
import type { Language, MasteryLevel, ContentType, ArabicDialect } from '../types/database';
import { findHebrewCognate } from '../utils/hebrewCognates';

// Initialize client (dangerouslyAllowBrowser for P1 demo, backend proxy recommended for prod)
export const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

/**
 * Retry wrapper with exponential backoff for OpenAI API calls.
 * Retries up to 3 times with delays of 1s, 2s, 4s.
 */
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
      
      // Don't retry on certain errors
      if (lastError.message.includes('API key') || lastError.message.includes('401')) {
        throw lastError; // Auth errors won't be fixed by retrying
      }
      
      if (attempt < maxRetries - 1) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Unknown error during API call');
}

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

const CONTENT_TYPE_COUNTS: Record<ContentType, number> = {
  word: 7,
  phrase: 5,
  dialog: 4,
  paragraph: 2,
};

const CONTENT_TYPE_INSTRUCTIONS: Record<ContentType, string> = {
  word: `Generate individual vocabulary WORDS. Each item should be a single word.
    The "word" field contains the target language word.
    The "translation" field contains the English meaning.`,

  phrase: `Generate common PHRASES and expressions. Each item should be a useful phrase (2-6 words).
    Examples: "How are you?", "Nice to meet you", "What time is it?"
    The "word" field contains the target language phrase.
    The "translation" field contains the English equivalent phrase.`,

  dialog: `Generate a SHORT DIALOG/CONVERSATION between two speakers (A and B).
    Each item is one line of dialog. Include "speaker" field ("A" or "B").
    The dialog should tell a coherent mini-story related to the topic.
    The "word" field contains the target language dialog line.
    The "translation" field contains the English translation.
    Include "context" field with brief stage direction if helpful (e.g., "pointing at menu").`,

  paragraph: `Generate SHORT READING PASSAGES (2-4 sentences each).
    Each item is a complete mini-paragraph about the topic.
    The "word" field contains the target language paragraph.
    The "translation" field contains the English translation.
    Make passages progressively more complex.`,
};

export async function generateLessonContent(
  topic: string,
  language: Language,
  level: MasteryLevel,
  contentType: ContentType = 'word',
  arabicDialect: ArabicDialect = 'standard',
  excludeWords: string[] = []  // Words the user has already practiced - avoid these
): Promise<AIContent> {
  const isArabic = language === 'arabic';
  const itemCount = CONTENT_TYPE_COUNTS[contentType];
  
  const dialectName = arabicDialect === 'standard' ? 'Modern Standard Arabic (MSA/Fusha)' : 'Egyptian Arabic (Masri)';

  const hebrewCognateInstructions = isArabic ? `
    CRITICAL - Hebrew Cognates:
    Arabic and Hebrew are both Semitic languages sharing trilateral root systems.
    ONLY include hebrew_root/hebrew_meaning/hebrew_note when there is a GENUINE shared Semitic root.

    FOR PHRASES: Check EACH word in the phrase for cognates. If ANY word has a Hebrew cognate,
    include it and specify which Arabic word it relates to in the hebrew_note field.
    Example: "كيف العمل" - العمل (al-'amal/work) → עמל (amal/labor) - include this cognate!

    Examples of REAL cognates (include these):
    - واحد (wahid/one) → אחד (echad) - same root א-ח-ד / و-ح-د
    - سلام (salam/peace) → שלום (shalom) - same root ש-ל-ם / س-ل-م
    - كتاب (kitab/book) → כתב (ketav/writing) - same root כ-ת-ב / ك-ت-ب
    - لا (la/no) → לא (lo) - identical word
    - عمل ('amal/work) → עמל (amal/labor) - same root ע-מ-ל / ع-م-ل

    Examples of NON-cognates (DO NOT include hebrew fields):
    - شكرا (shukran/thank you) - NOT related to Hebrew שכר (reward). Omit hebrew fields.
    - مرحبا (marhaba/hello) - No Hebrew cognate. Omit hebrew fields.
    - كيف (kayfa/how) - No Hebrew cognate.

    If uncertain or no genuine cognate exists, OMIT all hebrew fields entirely.
    Do not invent connections. Only include well-established Semitic etymologies.
    ` : '';

  const breakdownInstructions = isArabic ? `
    CRITICAL - Arabic Letter Breakdown (WITH VOWELS):
    For "letter_breakdown", provide an array for EACH SYLLABLE in the word.
    IMPORTANT: Include the vowel diacritics (harakat) that appear on each letter!
    
    Structure for each entry:
    - letter: The Arabic letter WITH its vowel mark (e.g., "شُ" not just "ش")
    - name: Letter name + vowel name (e.g., "Sheen + Damma", "Ra + Fatha", "Nun + Sukun")
    - sound: The COMBINED pronunciation (e.g., "shu", "ra", "n")
    
    Arabic vowel marks to include:
    - Fatha (  َ ) = "a" sound
    - Damma (  ُ ) = "u" sound  
    - Kasra (  ِ ) = "i" sound
    - Sukun (  ْ ) = no vowel (just consonant)
    - Tanween Fatha ( ً ) = "-an" ending
    - Tanween Damma ( ٌ ) = "-un" ending
    - Tanween Kasra ( ٍ ) = "-in" ending
    - Shadda (  ّ ) = doubled consonant
    
    Example for "شُكْرًا" (shukran):
    [
      { "letter": "شُ", "name": "Sheen + Damma", "sound": "shu" },
      { "letter": "كْ", "name": "Kaf + Sukun", "sound": "k" },
      { "letter": "رً", "name": "Ra + Tanween Fatha", "sound": "ran" },
      { "letter": "ا", "name": "Alif (silent)", "sound": "-" }
    ]
    ` : '';

  const dialogFields = contentType === 'dialog' ? `,
          "speaker": "A or B",
          "context": "optional stage direction"` : '';

  const dialectInstruction = isArabic ? `
    DIALECT: Use ${dialectName} pronunciation and vocabulary.
    ${arabicDialect === 'egyptian' ? 
      'Egyptian Arabic features: Use "g" for ج (not "j"), "e" vowels common, colloquial expressions.' : 
      'Modern Standard Arabic: Use formal/classical pronunciation and vocabulary.'}
    ` : '';

  // Instruction to avoid already-practiced words
  const excludeInstruction = excludeWords.length > 0 ? `
    IMPORTANT: The user has already practiced these words. DO NOT include them:
    ${excludeWords.slice(0, 50).join(', ')}
    Generate NEW vocabulary the user hasn't seen yet.
    ` : '';

  const prompt = `
    Create a language lesson for ${language} (${level} level) about "${topic}".
    ${dialectInstruction}
    ${excludeInstruction}
    CONTENT TYPE: ${contentType.toUpperCase()}
    ${CONTENT_TYPE_INSTRUCTIONS[contentType]}

    ${hebrewCognateInstructions}
    ${contentType === 'word' ? breakdownInstructions : ''}

    Return ONLY valid JSON with this structure:
    {
      "title": "Lesson Title",
      "description": "Short description",
      "items": [
        {
          "word": "Target language content",
          "translation": "English translation",
          "transliteration": "Latin script pronunciation (Arabic only)"${isArabic && contentType === 'word' ? `,
          "hebrew_root": "Hebrew cognate root (optional)",
          "hebrew_meaning": "Meaning of Hebrew cognate (optional)",
          "hebrew_note": "Note on connection (optional)",
          "letter_breakdown": [
             { "letter": "م", "name": "Meem", "sound": "m" }
          ]` : ''}${dialogFields}
        }
      ]
    }
    Generate exactly ${itemCount} items.
  `;

  const response = await withRetry(() => 
    openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    })
  );

  const content = JSON.parse(response.choices[0].message.content || '{}');
  return content as AIContent;
}

export async function evaluateAnswer(
  userAnswer: string,
  correctAnswer: string,
  language: Language
): Promise<{ correct: boolean; feedback: string }> {
  const prompt = `
    Expected Translation: "${correctAnswer}"
    User Answer: "${userAnswer}"
    Language: ${language}

    Is the user's answer a valid translation? Be GENEROUS - accept:
    - Minor typos and spelling variations
    - Synonyms and semantically equivalent words
    - Alternative meanings (e.g., "salaam" = both "peace" AND "hello")
    - Greetings used interchangeably (hello/hi/hey, goodbye/bye)
    - Different but correct translations for the same word

    IMPORTANT: Many words have multiple valid translations:
    - سلام (salaam) = "peace" OR "hello" (greeting derived from peace)
    - שלום (shalom) = "peace" OR "hello" OR "goodbye"
    - Greetings often derive from words with other meanings

    Mark correct if the user's answer is ANY valid translation of the word.

    Return ONLY JSON:
    {
      "correct": boolean,
      "feedback": "Brief explanation (max 10 words)"
    }
  `;

  const response = await withRetry(() =>
    openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    })
  );

  return JSON.parse(response.choices[0].message.content || '{"correct": false, "feedback": "Error"}');
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
 * Lookup result for a word or phrase.
 */
export interface LookupResult {
  detected_language: 'arabic' | 'english';
  arabic_word: string;  // MSA word WITH harakat (vowel diacritics)
  arabic_word_egyptian?: string;  // Egyptian word if different from MSA
  translation: string;
  pronunciation_standard: string;  // MSA transliteration
  pronunciation_egyptian: string;  // Egyptian transliteration
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
  example_sentences: ExampleSentence[];  // 2-3 example sentences with MSA + Egyptian versions
}

/**
 * Look up any word (Arabic or English) and get full breakdown.
 * Returns Arabic word with both dialect pronunciations, letter breakdown, and Hebrew cognate.
 */
export async function lookupWord(input: string): Promise<LookupResult> {
  const prompt = `
    Analyze this word/phrase: "${input}"
    
    CRITICAL REQUIREMENTS:
    
    1. Detect the language (Arabic or English)
    2. If English: translate to Arabic WITH FULL VOWEL DIACRITICS (harakat)
    3. If Arabic: provide English translation
    
    4. For EGYPTIAN Arabic - provide the ACTUAL WORD Egyptians use, NOT just a pronunciation variant!
       Examples:
       - "work" → MSA: العَمَل (al-'amal), Egyptian: الشُغْل (el-shoghl) - DIFFERENT WORD!
       - "how" → MSA: كَيْفَ (kayfa), Egyptian: إزَّاي (ezzay) - DIFFERENT WORD!
       - "what" → MSA: مَاذَا (matha), Egyptian: إيه (eih) - DIFFERENT WORD!
       - "good" → MSA: جَيِّد (jayyid), Egyptian: كْوَيِّس (kwayyis) - DIFFERENT WORD!
       - "want" → MSA: أُرِيد (ureed), Egyptian: عَايِز (aayez) - DIFFERENT WORD!
       - "now" → MSA: الآن (al-aan), Egyptian: دِلْوَقْتِي (dilwa'ti) - DIFFERENT WORD!
    
    5. Letter breakdown MUST include vowel diacritics:
       - فَتْحَة (fatha) = a
       - كَسْرَة (kasra) = i  
       - ضَمَّة (damma) = u
       - سُكُون (sukun) = no vowel
       - شَدَّة (shadda) = doubled consonant
    
    6. Hebrew cognate - CHECK CAREFULLY for shared Semitic roots! Common examples:
       - כ-ת-ב (k-t-b) = write: Arabic كَتَبَ (kataba), مَكْتَب (maktab), Hebrew כתב (katav), מכתב (michtav)
       - ע-מ-ל (ayin-m-l) = work/labor: Arabic عَمَل ('amal), Hebrew עמל (amal)
       - ש-ל-ם (sh-l-m) = peace/complete: Arabic سَلَام (salaam), Hebrew שלום (shalom)
       - ב-י-ת (b-y-t) = house: Arabic بَيْت (bayt), Hebrew בית (bayit)
       - א-כ-ל (alef-k-l) = eat: Arabic أَكَلَ (akala), Hebrew אכל (achal)
       - ק-ר-א (q-r-alef) = read/call: Arabic قَرَأَ (qara'a), Hebrew קרא (kara)
       - ס-פ-ר (s-p-r) = book/count: Arabic سِفْر (sifr), Hebrew ספר (sefer)
       Include hebrew_cognate if ANY genuine Semitic root connection exists!
    
    7. Provide 2-3 EXAMPLE SENTENCES showing the word in EVERYDAY SPOKEN context:
       - CRITICAL: Provide BOTH MSA and Egyptian Arabic versions of EACH sentence
       - Egyptian version should use the ACTUAL words Egyptians use in daily speech
       - For "work": MSA uses عَمَل but Egyptian uses شُغْل - the WHOLE sentence changes!
       - Focus on practical, everyday situations (not formal/literary)
       - Include transliteration for both versions
       - Add explanation noting key differences between MSA and Egyptian
    
    Return ONLY valid JSON:
    {
      "detected_language": "arabic" | "english",
      "arabic_word": "MSA word WITH harakat (e.g., عَمَل not عمل)",
      "arabic_word_egyptian": "Egyptian word if different (e.g., شُغْل) - REQUIRED if different!",
      "translation": "English translation",
      "pronunciation_standard": "MSA transliteration",
      "pronunciation_egyptian": "Egyptian transliteration (of Egyptian word)",
      "letter_breakdown": [
        { "letter": "عَ", "name": "Ayn with fatha", "sound": "a" },
        { "letter": "مَ", "name": "Meem with fatha", "sound": "ma" },
        { "letter": "ل", "name": "Lam", "sound": "l" }
      ],
      "letter_breakdown_egyptian": [
        { "letter": "شُ", "name": "Sheen with damma", "sound": "shu" },
        { "letter": "غْ", "name": "Ghayn with sukun", "sound": "gh" },
        { "letter": "ل", "name": "Lam", "sound": "l" }
      ],
      "hebrew_cognate": {
        "root": "Hebrew root if exists",
        "meaning": "meaning",
        "notes": "connection notes"
      }, // OMIT if no genuine cognate
      "example_sentences": [
        {
          "arabic_msa": "أَنَا أُحِبُّ العَمَلَ",
          "transliteration_msa": "ana uhibbu al-'amala",
          "arabic_egyptian": "أَنَا بَحِبّ الشُغْل",
          "transliteration_egyptian": "ana bahibb el-shoghl",
          "english": "I love work",
          "explanation": "Egyptian uses بَحِبّ (bahibb) instead of أُحِبُّ, and شُغْل (shoghl) instead of عَمَل"
        }
      ]
    }
  `;

  const response = await withRetry(() =>
    openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    })
  );

  const result = JSON.parse(response.choices[0].message.content || '{}') as LookupResult;
  
  // Override AI's hebrew_cognate with static lookup table (more reliable)
  const arabicWord = result.arabic_word || result.arabic_word_egyptian || input;
  const staticCognate = findHebrewCognate(arabicWord);
  
  if (staticCognate) {
    // Use static lookup - always more reliable than AI
    result.hebrew_cognate = staticCognate;
    console.log('[lookupWord] Found static Hebrew cognate for:', arabicWord, staticCognate);
  } else if (!result.hebrew_cognate) {
    // No static match and AI didn't find one either - that's fine
    console.log('[lookupWord] No Hebrew cognate found for:', arabicWord);
  } else {
    // AI found one but we don't have it in static table - keep AI's but log it
    console.log('[lookupWord] Using AI Hebrew cognate (not in static table):', arabicWord, result.hebrew_cognate);
  }
  
  return result;
}

/**
 * Word breakdown for passage analysis.
 */
export interface PassageWord {
  arabic: string;           // Arabic word with diacritics
  arabic_egyptian?: string; // Egyptian variant if different
  transliteration: string;
  transliteration_egyptian?: string;
  translation: string;
  part_of_speech?: string;  // noun, verb, adjective, etc.
}

/**
 * Sentence breakdown for passage analysis.
 */
export interface PassageSentence {
  arabic_msa: string;
  arabic_egyptian: string;
  transliteration_msa: string;
  transliteration_egyptian: string;
  translation: string;
  words: PassageWord[];
  explanation?: string;
}

/**
 * Result from analyzing a passage.
 */
export interface PassageResult {
  detected_language?: 'arabic' | 'english';
  original_text?: string;
  full_translation: string;
  full_transliteration: string;
  sentences: PassageSentence[];
}

/**
 * Analyze a passage - works with both Arabic and English input.
 * For Arabic: breaks down sentence by sentence, word by word.
 * For English: translates to Arabic and provides full breakdown.
 */
export async function analyzePassage(text: string): Promise<PassageResult> {
  // Detect if input is primarily Arabic or English
  const arabicChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
  const latinChars = (text.match(/[a-zA-Z]/g) || []).length;
  const isArabicInput = arabicChars > latinChars;
  
  const prompt = isArabicInput ? `
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
  ` : `
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

  const response = await withRetry(() =>
    openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" }
    })
  );

  const result = JSON.parse(response.choices[0].message.content || '{}') as PassageResult;
  
  // Apply static Hebrew cognate lookup to each word
  if (result.sentences) {
    for (const sentence of result.sentences) {
      if (sentence.words) {
        for (const word of sentence.words) {
          // We could add hebrew_cognate to words here if needed
          const cognate = findHebrewCognate(word.arabic);
          if (cognate) {
            (word as PassageWord & { hebrew_cognate?: typeof cognate }).hebrew_cognate = cognate;
          }
        }
      }
    }
  }
  
  return result;
}

/**
 * Generate a memory aid image using DALL-E.
 * Creates a simple, cartoon-style illustration to help remember a word or phrase.
 * 
 * @param word - The word or phrase to illustrate
 * @param translation - The English translation/meaning
 * @param customPrompt - Optional custom prompt from user (replaces auto-generated prompt)
 * @returns Base64 image data or null if generation fails
 */
export async function generateMemoryImage(
  word: string,
  translation: string,
  customPrompt?: string
): Promise<string | null> {
  console.log('[OpenAI] Generating memory image for:', word, '->', translation);
  
  // Use custom prompt if provided, otherwise generate default
  let prompt: string;
  if (customPrompt && customPrompt.trim()) {
    // User provided custom prompt - wrap it with style guidelines
    prompt = `Create a simple, memorable cartoon illustration: ${customPrompt.trim()}
Style: Flat design, vibrant colors, minimal details, easy to remember at a glance.
No text or words in the image. Clean white or simple gradient background.`;
  } else {
    // Default auto-generated prompt
    prompt = `Create a simple, memorable cartoon illustration representing "${translation}".
Style: Flat design, vibrant colors, minimal details, easy to remember at a glance. 
The image should be iconic and immediately evoke the concept of "${translation}".
No text or words in the image. Clean white or simple gradient background.
Think: app icon or emoji style, but more detailed.`;
  }

  try {
    const response = await withRetry(() =>
      openai.images.generate({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        response_format: "b64_json"
      })
    );

    const imageData = response.data?.[0]?.b64_json;
    if (!imageData) {
      console.error('[OpenAI] No image data returned');
      return null;
    }

    console.log('[OpenAI] Memory image generated successfully');
    return imageData;
  } catch (error) {
    console.error('[OpenAI] Failed to generate memory image:', error);
    return null;
  }
}
