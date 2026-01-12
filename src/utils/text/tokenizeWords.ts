/**
 * Word tokenization utility for clickable text
 * 
 * Splits text into tokens (words, punctuation, whitespace) while preserving:
 * - RTL rendering for Arabic
 * - Visual layout (whitespace)
 * - Punctuation as separate tokens
 * 
 * Used by ClickableText component to make individual words clickable.
 */

import type { Language } from '../../types';

export interface Token {
  text: string;
  type: 'word' | 'punctuation' | 'whitespace';
  index: number;  // Position in original string
}

/**
 * Tokenizes text into words, punctuation, and whitespace.
 * 
 * Rules:
 * - Arabic: Split on whitespace, preserve diacritics and joined forms
 * - Spanish: Split on whitespace, treat punctuation as separate tokens
 * - Punctuation: . ! ? , ; : ¿ ¡ ؟ ، (Spanish & Arabic punctuation included)
 * - Whitespace: Preserved for layout
 * 
 * @param text - Text to tokenize
 * @param language - Language for tokenization rules (currently unused, reserved for future language-specific logic)
 * @returns Array of tokens with type and position
 */
export function tokenizeWords(text: string, _language: Language): Token[] {
  // Note: _language parameter currently unused but reserved for future Spanish-specific rules
  if (!text || text.length === 0) {
    return [];
  }

  const tokens: Token[] = [];
  let currentIndex = 0;

  // Punctuation patterns (Arabic and English)
  const punctuationRegex = /[.!?,;:؟،]/;
  
  // Split on whitespace while preserving whitespace tokens
  const segments = text.split(/(\s+)/);
  
  for (const segment of segments) {
    if (!segment) continue;
    
    // Check if this segment is whitespace
    if (/^\s+$/.test(segment)) {
      tokens.push({
        text: segment,
        type: 'whitespace',
        index: currentIndex,
      });
      currentIndex += segment.length;
      continue;
    }
    
    // For non-whitespace segments, split out punctuation
    let remaining = segment;
    let segmentIndex = 0;
    
    while (remaining.length > 0) {
      const punctMatch = remaining.match(punctuationRegex);
      
      if (punctMatch && punctMatch.index !== undefined) {
        // Add word before punctuation (if any)
        if (punctMatch.index > 0) {
          const wordText = remaining.slice(0, punctMatch.index);
          tokens.push({
            text: wordText,
            type: 'word',
            index: currentIndex + segmentIndex,
          });
          segmentIndex += wordText.length;
        }
        
        // Add punctuation
        tokens.push({
          text: punctMatch[0],
          type: 'punctuation',
          index: currentIndex + segmentIndex,
        });
        segmentIndex += punctMatch[0].length;
        
        // Continue with rest
        remaining = remaining.slice(punctMatch.index + punctMatch[0].length);
      } else {
        // No more punctuation - rest is a word
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
 * Useful for getting just the clickable words.
 */
export function getWordTokens(tokens: Token[]): Token[] {
  return tokens.filter(token => token.type === 'word');
}

/**
 * Reconstructs original text from tokens (for testing).
 */
export function reconstructText(tokens: Token[]): string {
  return tokens.map(t => t.text).join('');
}
