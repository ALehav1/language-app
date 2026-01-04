import OpenAI from 'openai';
import type { Language, MasteryLevel, ContentType } from '../types';

// Initialize client (dangerouslyAllowBrowser for P1 demo, backend proxy recommended for prod)
export const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

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
  contentType: ContentType = 'word'
): Promise<AIContent> {
  const isArabic = language === 'arabic';
  const itemCount = CONTENT_TYPE_COUNTS[contentType];

  const hebrewCognateInstructions = isArabic ? `
    CRITICAL - Hebrew Cognates:
    Arabic and Hebrew are both Semitic languages sharing trilateral root systems.
    ONLY include hebrew_root/hebrew_meaning/hebrew_note when there is a GENUINE shared Semitic root.

    Examples of REAL cognates (include these):
    - واحد (wahid/one) → אחד (echad) - same root א-ח-ד / و-ح-د
    - سلام (salam/peace) → שלום (shalom) - same root ש-ל-ם / س-ل-م
    - كتاب (kitab/book) → כתב (ketav/writing) - same root כ-ת-ב / ك-ت-ب
    - لا (la/no) → לא (lo) - identical word

    Examples of NON-cognates (DO NOT include hebrew fields):
    - شكرا (shukran/thank you) - NOT related to Hebrew שכר (reward). Omit hebrew fields.
    - مرحبا (marhaba/hello) - No Hebrew cognate. Omit hebrew fields.
    - من فضلك (min fadlak/please) - No Hebrew cognate. Omit hebrew fields.

    If uncertain or no genuine cognate exists, OMIT all hebrew fields entirely.
    Do not invent connections. Only include well-established Semitic etymologies.
    ` : '';

  const breakdownInstructions = isArabic ? `
    CRITICAL - Arabic Letter Breakdown:
    For "letter_breakdown", provide an array of objects for each letter in the word.
    - letter: The distinct arabic letter form used
    - name: The name of the letter (e.g. Alif, Ba, Meem)
    - sound: The English sound approximation (e.g. 'm', 'b', 'aa')
    ` : '';

  const dialogFields = contentType === 'dialog' ? `,
          "speaker": "A or B",
          "context": "optional stage direction"` : '';

  const prompt = `
    Create a language lesson for ${language} (${level} level) about "${topic}".

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

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" }
  });

  const content = JSON.parse(response.choices[0].message.content || '{}');
  return content as AIContent;
}

export async function evaluateAnswer(
  userAnswer: string,
  correctAnswer: string,
  language: Language
): Promise<{ correct: boolean; feedback: string }> {
  const prompt = `
    Target Word: "${correctAnswer}"
    User Input: "${userAnswer}"
    Language: ${language}
    
    Is the user input a correct translation or semantically equivalent? 
    Accept minor typos.
    
    Return ONLY JSON:
    {
      "correct": boolean,
      "feedback": "Short explanation (max 10 words)"
    }
  `;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" }
  });

  return JSON.parse(response.choices[0].message.content || '{"correct": false, "feedback": "Error"}');
}
