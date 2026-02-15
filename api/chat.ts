import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  word: string;
  translation: string;
  context?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, word, translation, context } = req.body as ChatRequest;

    if (!messages || !word || !translation) {
      return res.status(400).json({ error: 'Missing required fields: messages, word, translation' });
    }

    const systemPrompt = `You are a helpful Arabic language tutor. The student is learning about the word/phrase "${word}" which means "${translation}".${context ? ` Context: ${context}` : ''} Answer their questions briefly (2-3 sentences max), focusing on practical usage and cultural insights.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      ],
      max_tokens: 150,
    });

    const content = response.choices[0].message.content || 'Sorry, I could not generate a response.';
    return res.status(200).json({ content });
  } catch (error) {
    console.error('[api/chat] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
