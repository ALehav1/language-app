import type { VercelRequest, VercelResponse } from '@vercel/node';
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

interface GenerateImageRequest {
  word: string;
  translation: string;
  customPrompt?: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { word: _word, translation, customPrompt } = req.body as GenerateImageRequest;

    if (!translation) {
      return res.status(400).json({ error: 'Missing required field: translation' });
    }

    // Use custom prompt if provided, otherwise generate default
    let imagePrompt: string;
    if (customPrompt && customPrompt.trim()) {
      imagePrompt = `Create a simple, memorable cartoon illustration: ${customPrompt.trim()}
Style: Flat design, vibrant colors, minimal details, easy to remember at a glance.
No text or words in the image. Clean white or simple gradient background.`;
    } else {
      imagePrompt = `Create a simple, memorable cartoon illustration representing "${translation}".
Style: Flat design, vibrant colors, minimal details, easy to remember at a glance.
The image should be iconic and immediately evoke the concept of "${translation}".
No text or words in the image. Clean white or simple gradient background.
Think: app icon or emoji style, but more detailed.`;
    }

    const response = await withRetry(() =>
      openai.images.generate({
        model: "dall-e-3",
        prompt: imagePrompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        response_format: "b64_json"
      })
    );

    const imageData = response.data?.[0]?.b64_json;
    if (!imageData) {
      return res.status(500).json({ error: 'No image data returned' });
    }

    return res.status(200).json({ imageData });
  } catch (error) {
    console.error('[api/generate-image] Error:', error);
    return res.status(500).json({ error: 'Failed to generate image' });
  }
}
