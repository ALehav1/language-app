/**
 * Arabic letter data for generating breakdowns on-the-fly.
 * Maps Arabic letters to their names and approximate sounds.
 */

interface ArabicLetterInfo {
    name: string;
    sound: string;
    type: 'letter' | 'diacritic';
}

// Complete Arabic alphabet with names and sounds
const ARABIC_LETTERS: Record<string, ArabicLetterInfo> = {
    // Basic letters
    'ا': { name: 'Alif', sound: 'aa', type: 'letter' },
    'أ': { name: 'Alif + Hamza', sound: 'a', type: 'letter' },
    'إ': { name: 'Alif + Hamza below', sound: 'i', type: 'letter' },
    'آ': { name: 'Alif Madda', sound: 'aa', type: 'letter' },
    'ب': { name: 'Ba', sound: 'b', type: 'letter' },
    'ت': { name: 'Ta', sound: 't', type: 'letter' },
    'ث': { name: 'Tha', sound: 'th', type: 'letter' },
    'ج': { name: 'Jeem', sound: 'j', type: 'letter' },
    'ح': { name: 'Ha', sound: 'ḥ (deep h)', type: 'letter' },
    'خ': { name: 'Kha', sound: 'kh', type: 'letter' },
    'د': { name: 'Dal', sound: 'd', type: 'letter' },
    'ذ': { name: 'Dhal', sound: 'dh/th', type: 'letter' },
    'ر': { name: 'Ra', sound: 'r', type: 'letter' },
    'ز': { name: 'Zay', sound: 'z', type: 'letter' },
    'س': { name: 'Seen', sound: 's', type: 'letter' },
    'ش': { name: 'Sheen', sound: 'sh', type: 'letter' },
    'ص': { name: 'Sad', sound: 'ṣ (emphatic s)', type: 'letter' },
    'ض': { name: 'Dad', sound: 'ḍ (emphatic d)', type: 'letter' },
    'ط': { name: 'Ta', sound: 'ṭ (emphatic t)', type: 'letter' },
    'ظ': { name: 'Dha', sound: 'ẓ (emphatic dh)', type: 'letter' },
    'ع': { name: 'Ayn', sound: 'ʿ (guttural)', type: 'letter' },
    'غ': { name: 'Ghayn', sound: 'gh', type: 'letter' },
    'ف': { name: 'Fa', sound: 'f', type: 'letter' },
    'ق': { name: 'Qaf', sound: 'q (deep k)', type: 'letter' },
    'ك': { name: 'Kaf', sound: 'k', type: 'letter' },
    'ل': { name: 'Lam', sound: 'l', type: 'letter' },
    'م': { name: 'Meem', sound: 'm', type: 'letter' },
    'ن': { name: 'Noon', sound: 'n', type: 'letter' },
    'ه': { name: 'Ha', sound: 'h', type: 'letter' },
    'و': { name: 'Waw', sound: 'w/oo', type: 'letter' },
    'ي': { name: 'Ya', sound: 'y/ee', type: 'letter' },
    'ى': { name: 'Alif Maqsura', sound: 'a', type: 'letter' },
    'ء': { name: 'Hamza', sound: "' (glottal stop)", type: 'letter' },
    'ة': { name: 'Ta Marbuta', sound: 'a/at', type: 'letter' },
    'ئ': { name: 'Hamza on Ya', sound: "'", type: 'letter' },
    'ؤ': { name: 'Hamza on Waw', sound: "'", type: 'letter' },

    // Diacritics (vowel marks)
    'َ': { name: 'Fatha', sound: 'a (short)', type: 'diacritic' },
    'ُ': { name: 'Damma', sound: 'u (short)', type: 'diacritic' },
    'ِ': { name: 'Kasra', sound: 'i (short)', type: 'diacritic' },
    'ّ': { name: 'Shadda', sound: '(double letter)', type: 'diacritic' },
    'ْ': { name: 'Sukun', sound: '(no vowel)', type: 'diacritic' },
    'ً': { name: 'Tanwin Fatha', sound: '-an', type: 'diacritic' },
    'ٌ': { name: 'Tanwin Damma', sound: '-un', type: 'diacritic' },
    'ٍ': { name: 'Tanwin Kasra', sound: '-in', type: 'diacritic' },
};

// Set of diacritic characters
const DIACRITICS = new Set(['َ', 'ُ', 'ِ', 'ّ', 'ْ', 'ً', 'ٌ', 'ٍ']);

export interface LetterBreakdown {
    letter: string;
    name: string;
    sound: string;
    type?: 'letter' | 'diacritic';
}

/**
 * Generates a letter breakdown for any Arabic word.
 * Groups letters with their diacritics for combined pronunciation.
 */
export function generateArabicBreakdown(word: string): LetterBreakdown[] {
    
    let breakdown: LetterBreakdown[] = [];
    const chars = [...word]; // Spread to handle unicode properly
    
    console.log('[generateArabicBreakdown] Input word:', word, 'Chars:', chars);
    console.log('[generateArabicBreakdown] Breakdown array before loop:', breakdown);
    
    for (let i = 0; i < chars.length; i++) {
        const char = chars[i];
        const info = ARABIC_LETTERS[char];
        console.log('[generateArabicBreakdown] Processing char at index', i, ':', char, 'Info:', info);
        
        // Skip spaces
        if (char === ' ') {
            continue;
        }

        if (info && info.type === 'letter') {
            // This is a letter - check for following diacritics
            let combinedLetter = char;
            let combinedName = info.name;
            let combinedSound = info.sound;
            const diacriticsFound: string[] = [];

            // Look ahead for diacritics
            let j = i + 1;
            while (j < chars.length && DIACRITICS.has(chars[j])) {
                const diacriticInfo = ARABIC_LETTERS[chars[j]];
                if (diacriticInfo) {
                    combinedLetter += chars[j];
                    diacriticsFound.push(diacriticInfo.name);

                    // Modify the sound based on diacritic
                    if (chars[j] === 'َ') combinedSound += 'a';
                    else if (chars[j] === 'ُ') combinedSound += 'u';
                    else if (chars[j] === 'ِ') combinedSound += 'i';
                    else if (chars[j] === 'ّ') combinedSound = combinedSound + combinedSound.charAt(0); // double
                    else if (chars[j] === 'ً') combinedSound += 'an';
                    else if (chars[j] === 'ٌ') combinedSound += 'un';
                    else if (chars[j] === 'ٍ') combinedSound += 'in';
                    // Sukun doesn't add a vowel sound
                }
                j++;
            }

            // Add diacritic names to the letter name if any found
            if (diacriticsFound.length > 0) {
                combinedName += ' + ' + diacriticsFound.join(' + ');
            }

            const letterObj = {
                letter: combinedLetter,
                name: combinedName,
                sound: combinedSound,
                type: 'letter' as const,
            };
            breakdown.push(letterObj);
            console.log('[generateArabicBreakdown] Added letter to breakdown:', letterObj);
            console.log('[generateArabicBreakdown] Breakdown array after push:', breakdown);
            console.log('[generateArabicBreakdown] Breakdown length after push:', breakdown.length);

            i = j - 1; // Skip past the diacritics we processed (j-1 because for loop will i++)
        } else if (info && info.type === 'diacritic') {
            // Standalone diacritic (unusual but handle it)
            breakdown.push({
                letter: char,
                name: info.name,
                sound: info.sound,
                type: 'diacritic',
            });
        } else if (/[\u0600-\u06FF]/.test(char)) {
            // Unknown Arabic character - still show it
            breakdown.push({
                letter: char,
                name: 'Unknown',
                sound: '?',
                type: 'letter',
            });
        } else {
            // Non-Arabic character, skip
        }
    }

    console.log('[generateArabicBreakdown] Final breakdown array:', breakdown);
    console.log('[generateArabicBreakdown] Breakdown length:', breakdown.length);
    return breakdown;
}

/**
 * Check if a string contains Arabic characters.
 */
export function containsArabic(text: string): boolean {
    return /[\u0600-\u06FF]/.test(text);
}

export interface WordBreakdown {
    word: string;
    letters: LetterBreakdown[];
}

/**
 * Generates letter breakdowns for each word in a phrase separately.
 * Returns an array of word breakdowns, each containing the original word and its letters.
 */
export function generateArabicBreakdownByWord(phrase: string): WordBreakdown[] {
    // Split by spaces, keeping Arabic words together
    const words = phrase.split(/\s+/).filter(w => w.trim().length > 0);
    
    console.log('[generateArabicBreakdownByWord] Input phrase:', phrase);
    console.log('[generateArabicBreakdownByWord] Split words:', words);
    
    const result = words.map(word => {
        const letters = generateArabicBreakdown(word);
        console.log('[generateArabicBreakdownByWord] Word:', word, 'Letters count:', letters.length);
        return {
            word,
            letters,
        };
    }).filter(wb => wb.letters.length > 0); // Only include words with Arabic letters
    
    console.log('[generateArabicBreakdownByWord] Final result:', result);
    return result;
}
