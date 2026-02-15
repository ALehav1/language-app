/**
 * Word tokenization utility for clickable text
 *
 * NOTE: This is a server-side copy for Vercel serverless functions.
 * Source of truth: src/utils/text/tokenizeWords.ts
 */

type Language = 'arabic' | 'spanish';

export interface Token {
  text: string;
  type: 'word' | 'punctuation' | 'whitespace';
  index: number;  // Position in original string
}

/**
 * Tokenizes text into words, punctuation, and whitespace.
 */
export function tokenizeWords(text: string, _language: Language): Token[] {
  if (!text || text.length === 0) {
    return [];
  }

  const tokens: Token[] = [];
  let currentIndex = 0;

  const punctuationRegex = /[.!?,;:؟،]/;

  const segments = text.split(/(\s+)/);

  for (const segment of segments) {
    if (!segment) continue;

    if (/^\s+$/.test(segment)) {
      tokens.push({
        text: segment,
        type: 'whitespace',
        index: currentIndex,
      });
      currentIndex += segment.length;
      continue;
    }

    let remaining = segment;
    let segmentIndex = 0;

    while (remaining.length > 0) {
      const punctMatch = remaining.match(punctuationRegex);

      if (punctMatch && punctMatch.index !== undefined) {
        if (punctMatch.index > 0) {
          const wordText = remaining.slice(0, punctMatch.index);
          tokens.push({
            text: wordText,
            type: 'word',
            index: currentIndex + segmentIndex,
          });
          segmentIndex += wordText.length;
        }

        tokens.push({
          text: punctMatch[0],
          type: 'punctuation',
          index: currentIndex + segmentIndex,
        });
        segmentIndex += punctMatch[0].length;

        remaining = remaining.slice(punctMatch.index + punctMatch[0].length);
      } else {
        if (remaining.length > 0) {
          tokens.push({
            text: remaining,
            type: 'word',
            index: currentIndex + segmentIndex,
          });
        }
        break;
      }
    }

    currentIndex += segment.length;
  }

  return tokens;
}

/**
 * Extracts only word tokens from tokenized text.
 */
export function getWordTokens(tokens: Token[]): Token[] {
  return tokens.filter(token => token.type === 'word');
}
