/**
 * Generate letter breakdown for Arabic words
 */

export interface LetterBreakdown {
  letter: string;
  name: string;
  sound: string;
}

const ARABIC_LETTER_NAMES: Record<string, { name: string; sound: string }> = {
  'ا': { name: 'alif', sound: 'a' },
  'أ': { name: 'alif+hamza', sound: 'a' },
  'إ': { name: 'alif+hamza', sound: 'i' },
  'آ': { name: 'alif madda', sound: 'aa' },
  'ب': { name: 'ba', sound: 'b' },
  'ت': { name: 'ta', sound: 't' },
  'ث': { name: 'tha', sound: 'th' },
  'ج': { name: 'jim', sound: 'j' },
  'ح': { name: 'ha', sound: 'h' },
  'خ': { name: 'kha', sound: 'kh' },
  'د': { name: 'dal', sound: 'd' },
  'ذ': { name: 'dhal', sound: 'dh' },
  'ر': { name: 'ra', sound: 'r' },
  'ز': { name: 'zay', sound: 'z' },
  'س': { name: 'sin', sound: 's' },
  'ش': { name: 'shin', sound: 'sh' },
  'ص': { name: 'sad', sound: 's' },
  'ض': { name: 'dad', sound: 'd' },
  'ط': { name: 'ta', sound: 't' },
  'ظ': { name: 'dha', sound: 'dh' },
  'ع': { name: 'ayn', sound: 'a' },
  'غ': { name: 'ghayn', sound: 'gh' },
  'ف': { name: 'fa', sound: 'f' },
  'ق': { name: 'qaf', sound: 'q' },
  'ك': { name: 'kaf', sound: 'k' },
  'ل': { name: 'lam', sound: 'l' },
  'م': { name: 'mim', sound: 'm' },
  'ن': { name: 'nun', sound: 'n' },
  'ه': { name: 'ha', sound: 'h' },
  'و': { name: 'waw', sound: 'w' },
  'ي': { name: 'ya', sound: 'y' },
  'ى': { name: 'alif maqsura', sound: 'a' },
  'ة': { name: 'ta marbuta', sound: 'a' },
  'ء': { name: 'hamza', sound: "'" },
  // Diacritics
  'َ': { name: 'fatha', sound: 'a' },
  'ُ': { name: 'damma', sound: 'u' },
  'ِ': { name: 'kasra', sound: 'i' },
  'ْ': { name: 'sukun', sound: '' },
  'ّ': { name: 'shadda', sound: 'double' },
  'ً': { name: 'tanwin fatha', sound: 'an' },
  'ٌ': { name: 'tanwin damma', sound: 'un' },
  'ٍ': { name: 'tanwin kasra', sound: 'in' },
};

export function generateArabicBreakdownByWord(arabic: string): LetterBreakdown[][] {
  // Split by spaces to get individual words
  const words = arabic.split(' ');
  
  return words.map(word => {
    const breakdown: LetterBreakdown[] = [];
    
    for (const char of word) {
      const letterInfo = ARABIC_LETTER_NAMES[char];
      if (letterInfo && !['َ', 'ُ', 'ِ', 'ْ', 'ّ', 'ً', 'ٌ', 'ٍ'].includes(char)) {
        breakdown.push({
          letter: char,
          name: letterInfo.name,
          sound: letterInfo.sound
        });
      }
    }
    
    return breakdown;
  });
}
