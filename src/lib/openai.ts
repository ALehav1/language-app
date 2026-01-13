import OpenAI from 'openai';
import type { Language, MasteryLevel, ArabicDialect, SpanishDialect, ContentType } from '../types/database';
import { findHebrewCognate } from '../utils/hebrewCognates';
import { getEgyptianEquivalent } from '../utils/egyptianDictionary';
import { shouldShowHebrewCognate } from '../domain/practice/hebrew/shouldShowHebrewCognate';

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
  sentence: 5,
  dialog: 4,
  passage: 2,
};

const CONTENT_TYPE_INSTRUCTIONS: Record<ContentType, string> = {
  word: `Generate individual vocabulary WORDS. Each item should be a single word.
    The "word" field contains the target language word.
    The "translation" field contains the English meaning.`,

  sentence: `Generate common SENTENCES and expressions. Each item should be a useful sentence (2-6 words).
    Examples: "How are you?", "Nice to meet you", "What time is it?"
    The "word" field contains the target language sentence.
    The "translation" field contains the English equivalent sentence.`,

  dialog: `Generate a SHORT DIALOG/CONVERSATION between two speakers (A and B).
    Each item is one line of dialog. Include "speaker" field ("A" or "B").
    The dialog should tell a coherent mini-story related to the topic.
    The "word" field contains the target language dialog line.
    The "translation" field contains the English translation.
    Include "context" field with brief stage direction if helpful (e.g., "pointing at menu").`,

  passage: `Generate SHORT READING PASSAGES (2-4 sentences each).
    Each item is a complete mini-passage about the topic.
    The "word" field contains the target language passage.
    The "translation" field contains the English translation.
    Make passages progressively more complex.`,
};

export async function generateLessonContent(
  topic: string,
  language: Language,
  level: MasteryLevel,
  contentType: ContentType = 'word',
  dialect?: ArabicDialect | SpanishDialect,
  excludeWords: string[] = []  // Words the user has already practiced - avoid these
): Promise<AIContent> {
  const isArabic = language === 'arabic';
  const itemCount = CONTENT_TYPE_COUNTS[contentType];
  
  const dialectName = isArabic ? (dialect === 'standard' ? 'Modern Standard Arabic (MSA/Fusha)' : 'Egyptian Arabic (Masri)') : 'Spanish (LatAm)';
  
  const hebrewCognateInstructions = isArabic ? `
    CRITICAL - Hebrew Cognates:
    Arabic and Hebrew are both Semitic languages sharing trilateral root systems.
    ONLY include hebrew_root/hebrew_meaning/hebrew_note when there is a GENUINE shared Semitic root.

    FOR SENTENCES: Check EACH word in the sentence for cognates. If ANY word has a Hebrew cognate,
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
    ${dialect === 'egyptian' ? 
      `CRITICAL - NATIVE EGYPTIAN VOCABULARY ONLY:
      Generate words/sentences that Egyptians ACTUALLY USE in daily conversation.
      
      ⛔ FORBIDDEN - DO NOT USE THESE MSA WORDS:
      - ممكن (mumkin) - Use يمكن (yemken) for "can/possible"
      - مرآة (mir'a) - Use مراية (meraya) for "mirror"  
      - غرفة (ghurfa) - Use أوضة (oda) for "room"
      - سيارة (sayyara) - Use عربية (3arabeyya) for "car"
      - حقيبة (haqiba) - Use شنطة (shanTa) for "bag"
      - مال (maal) - Use فلوس (feloos) for "money"
      - ماذا (madha) - Use ايه (eh) for "what"
      - كيف (kayfa) - Use ازاي (ezzay) for "how"
      - لأن (li'anna) - Use علشان (3alshan) for "because"
      
      ✅ REQUIRED - Native Egyptian words/sentences only:
      - أوضة (oda) for "room"
      - عربية (3arabeyya) for "car"
      - شنطة (shanTa) for "bag"
      - فلوس (feloos) for "money"
      - ايه (eh) for "what"
      - ازاي (ezzay) for "how"
      - علشان (3alshan) for "because"
      - يمكن (yemken) for "can/possible"
      - مراية (meraya) for "mirror"
      
      Pronunciation features:
      - Use "g" for ج (not "j") e.g. جميل = gameel
      - Short vowels often become "e" or "a" sounds
      - ق becomes glottal stop or "2" in chat, not "q"
      - Use colloquial expressions and particles (ya, ba2a, keda, etc.)` : 
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
          "word": "Target language content WITH FULL VOWEL MARKS (harakat) for Arabic",
          "translation": "English translation",
          "transliteration": "Latin script pronunciation (Arabic only)"${isArabic && contentType === 'word' ? `,
          "hebrew_root": "Hebrew cognate root (optional)",
          "hebrew_meaning": "Meaning of Hebrew cognate (optional)",
          "hebrew_note": "Note on connection (optional)",
          "letter_breakdown": [
             { "letter": "مَ", "name": "Meem + Fatha", "sound": "ma" }
          ]` : ''}${dialogFields}
        }
      ]
    }
    
    ${isArabic ? 'CRITICAL FOR ARABIC: Always include vowel diacritics (harakat) in the "word" field: َ ُ ِ ْ ً ٌ ٍ ّ' : ''}
    Generate exactly ${itemCount} items.
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
      messages: [
        { role: "system", content: "Return valid json only." },
        { role: "user", content: prompt }
      ],
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
 * Lookup result for a word or phrase.
 */
export interface LookupResult {
  detected_language: DetectedLanguage;
  arabic_word: string;  // MSA word WITH harakat (vowel diacritics)
  arabic_word_egyptian?: string;  // Egyptian word if different from MSA
  translation: string;
  pronunciation_standard: string;  // MSA transliteration
  pronunciation_egyptian: string;  // Egyptian transliteration
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
  example_sentences: ExampleSentence[];  // 2-3 example sentences with MSA + Egyptian versions
}

/**
 * Look up any word in the selected language.
 * For Arabic: Returns word with dialect pronunciations, letter breakdown, and Hebrew cognate.
 * For Spanish: Returns word with translation only (no transliteration, Hebrew, or letter breakdown).
 */
export async function lookupWord(
  input: string,
  options: { language: Language; dialect?: ArabicDialect | SpanishDialect }
): Promise<LookupResult> {
  const { language } = options;
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
    
    CRITICAL REQUIREMENTS:
    
    1. Detect the language (Spanish or English)
    2. If English: translate to Spanish (LatAm neutral - Mexican/Colombian/Argentine common usage)
    3. If Spanish: provide English translation
    
    4. Context and usage notes (in English):
       - Common usage contexts
       - Register (formal/informal/slang)
       - Regional variations if significant (LatAm vs Spain)
    
    5. Provide 2-3 example sentences in EVERYDAY SPOKEN Spanish:
       - Natural, conversational examples
       - Include English translations
    
    Return ONLY valid JSON:
    {
      "detected_language": "spanish" | "english",
      "arabic_word": "",  // Leave empty for Spanish
      "translation": "English translation",
      "word_context": {
        "root": "",
        "root_meaning": "",
        "egyptian_usage": "Common usage context and notes",
        "msa_comparison": "",
        "cultural_notes": "Regional/register notes"
      },
      "example_sentences": [
        {
          "arabic_msa": "",
          "transliteration_msa": "",
          "arabic_egyptian": "Spanish sentence here",
          "transliteration_egyptian": "",
          "english": "English translation",
          "explanation": "Usage notes"
        }
      ]
    }
    
    DO NOT include: pronunciation_standard, pronunciation_egyptian, letter_breakdown, letter_breakdown_egyptian, hebrew_cognate
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

  const result = JSON.parse(response.choices[0].message.content || '{}') as LookupResult;
  
  // Check Egyptian dictionary for reliable Egyptian equivalents
  if (result.arabic_word) {
    const egyptianEquivalent = getEgyptianEquivalent(result.arabic_word);
    if (egyptianEquivalent) {
      result.arabic_word_egyptian = egyptianEquivalent.egyptian;
      result.pronunciation_egyptian = egyptianEquivalent.transliteration;
      console.log('[lookupWord] Using Egyptian dictionary for:', result.arabic_word, '→', egyptianEquivalent.egyptian);
    }
  }
  
  // Override AI's hebrew_cognate with static lookup table (more reliable)
  // BUT only attach if shouldShowHebrewCognate allows (Arabic + single word)
  // Try BOTH Egyptian and MSA forms (either may have a cognate match)
  let staticCognate = null;
  let matchedForm = null;
  
  // Try Egyptian form first (if available)
  if (result.arabic_word_egyptian) {
    staticCognate = findHebrewCognate(result.arabic_word_egyptian);
    if (staticCognate) {
      matchedForm = 'egyptian';
      console.log('[lookupWord] Found Hebrew cognate for Egyptian form:', result.arabic_word_egyptian);
    }
  }
  
  // If no Egyptian match, try MSA form
  if (!staticCognate && result.arabic_word) {
    staticCognate = findHebrewCognate(result.arabic_word);
    if (staticCognate) {
      matchedForm = 'msa';
      console.log('[lookupWord] Found Hebrew cognate for MSA form:', result.arabic_word);
    }
  }
  
  // Fallback: try raw input if no MSA/Egyptian forms available
  if (!staticCognate && !result.arabic_word && !result.arabic_word_egyptian) {
    staticCognate = findHebrewCognate(input);
    if (staticCognate) {
      matchedForm = 'input';
      console.log('[lookupWord] Found Hebrew cognate for input:', input);
    }
  }
  
  // Gate Hebrew attachment: only for Arabic, single-word inputs
  const shouldAttach = shouldShowHebrewCognate({
    language: result.detected_language === 'arabic' ? 'arabic' : 'spanish',
    contentType: 'word',
    hebrewCandidate: staticCognate || result.hebrew_cognate || null,
    selectedText: input
  });
  
  if (shouldAttach && staticCognate) {
    // Use static lookup - always more reliable than AI
    result.hebrew_cognate = staticCognate;
    console.log('[lookupWord] Attaching Hebrew cognate (matched via', matchedForm, '):', staticCognate);
  } else if (shouldAttach && result.hebrew_cognate) {
    // AI found one but we don't have it in static table - keep AI's but log it
    console.log('[lookupWord] Using AI Hebrew cognate (not in static table)');
  } else {
    // Don't attach Hebrew (either not eligible or no cognate found)
    result.hebrew_cognate = undefined;
    if (!shouldAttach && staticCognate) {
      console.log('[lookupWord] Hebrew cognate found but not eligible (multi-word or non-Arabic):', input);
    } else {
      console.log('[lookupWord] No Hebrew cognate found for input:', input);
    }
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
  detected_language?: DetectedLanguage;
  original_text?: string;
  full_translation: string;
  full_transliteration: string;
  sentences: PassageSentence[];
}

/**
 * Analyze a full passage (multiple sentences).
 * For Arabic: breaks down sentence by sentence, word by word.
 * For Spanish: breaks down sentence by sentence.
 * For English: translates to selected language and provides breakdown.
 */
export async function analyzePassage(
  text: string,
  options: { language: Language; dialect?: ArabicDialect | SpanishDialect }
): Promise<PassageResult> {
  const { language } = options;
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
    // Spanish input -> analyze and translate to English
    prompt = `
    Analyze this Spanish passage and break it down sentence by sentence, word by word.
    
    Text: "${text}"
    
    REQUIREMENTS:
    1. Split into sentences
    2. For EACH sentence provide:
       - Original Spanish
       - English translation
       - Word-by-word breakdown
    
    3. For EACH word in the breakdown:
       - Spanish word
       - English translation
       - Part of speech
    
    Return ONLY valid JSON:
    {
      "detected_language": "spanish",
      "original_text": "${text}",
      "full_translation": "Complete English translation",
      "full_transliteration": "${text}",
      "sentences": [
        {
          "arabic_msa": "${text}",
          "arabic_egyptian": "${text}",
          "transliteration_msa": "${text}",
          "transliteration_egyptian": "${text}",
          "translation": "English translation",
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
    // English input -> translate to Spanish and analyze
    prompt = `
    Translate this English passage to Spanish and break it down sentence by sentence, word by word.
    
    English Text: "${text}"
    
    REQUIREMENTS:
    1. Translate the entire passage to Spanish
    2. Split into sentences
    3. For EACH sentence provide:
       - Spanish translation
       - Original English
       - Word-by-word breakdown of the Spanish
    
    4. For EACH word in the breakdown:
       - Spanish word
       - English translation
       - Part of speech
    
    Return ONLY valid JSON:
    {
      "detected_language": "english",
      "original_text": "${text}",
      "full_translation": "Complete Spanish translation",
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
 * Creates a simple, cartoon-style illustration to help remember a word or sentence.
 * 
 * @param word - The word or sentence to illustrate
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
