import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Language } from '../src/types/database';
import OpenAI from 'openai';

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

interface EvaluateAnswerRequest {
  userAnswer: string;
  correctAnswer: string;
  language: Language;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userAnswer, correctAnswer, language } = req.body as EvaluateAnswerRequest;

    if (!userAnswer || !correctAnswer || !language) {
      return res.status(400).json({ error: 'Missing required fields: userAnswer, correctAnswer, language' });
    }

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

    const result = JSON.parse(response.choices[0].message.content || '{"correct": false, "feedback": "Error"}');
    return res.status(200).json(result);
  } catch (error) {
    console.error('[api/evaluate-answer] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
