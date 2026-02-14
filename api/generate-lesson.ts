import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Language, MasteryLevel, ContentType, ArabicDialect, SpanishDialect } from '../src/types/database';
import { openai, withRetry } from './_shared/openai-client';

interface GenerateLessonRequest {
  topic: string;
  language: Language;
  level: MasteryLevel;
  contentType?: ContentType;
  dialect?: ArabicDialect | SpanishDialect;
  excludeWords?: string[];
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      topic,
      language,
      level,
      contentType = 'word',
      dialect,
      excludeWords = [],
    } = req.body as GenerateLessonRequest;

    if (!topic || !language || !level) {
      return res.status(400).json({ error: 'Missing required fields: topic, language, level' });
    }

    const isArabic = language === 'arabic';
    const itemCount = CONTENT_TYPE_COUNTS[contentType];

    const dialectName = isArabic
      ? (dialect === 'standard' ? 'Modern Standard Arabic (MSA/Fusha)' : 'Egyptian Arabic (Masri)')
      : 'Spanish (LatAm)';

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
    return res.status(200).json(content);
  } catch (error) {
    console.error('[api/generate-lesson] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
