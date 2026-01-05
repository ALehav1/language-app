import OpenAI from 'openai';
import type { Language, MasteryLevel, ContentType, ArabicDialect } from '../types/database';

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
  arabicDialect: ArabicDialect = 'standard'
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

  const prompt = `
    Create a language lesson for ${language} (${level} level) about "${topic}".
    ${dialectInstruction}
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
