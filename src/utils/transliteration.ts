/**
 * Transliteration validation utilities for Arabic pronunciation checking.
 */

/**
 * Calculate Levenshtein distance between two strings.
 * Used for fuzzy matching to allow minor typos.
 */
function levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j] + 1      // deletion
                );
            }
        }
    }

    return matrix[b.length][a.length];
}

/**
 * Normalize transliteration for comparison.
 * Handles common variations in Arabic transliteration.
 */
function normalizeTransliteration(s: string): string {
    return s
        .toLowerCase()
        .trim()
        // Normalize apostrophes and glottal stops
        .replace(/['`ʼ'']/g, "'")
        // Arabic chat/number transliterations (common online)
        .replace(/7/g, 'h')      // ح
        .replace(/5/g, 'kh')     // خ
        .replace(/3/g, "'")      // ع
        .replace(/2/g, "'")      // ء
        .replace(/9/g, 's')      // ص
        .replace(/6/g, 't')      // ط
        // Common vowel variations
        .replace(/aa/g, 'a')
        .replace(/ee/g, 'i')
        .replace(/oo/g, 'u')
        .replace(/ou/g, 'u')
        .replace(/ai/g, 'ay')    // normalize ai to ay
        .replace(/ei/g, 'ay')    // normalize ei to ay
        // Common consonant variations
        .replace(/kh/g, 'x')
        .replace(/gh/g, 'g')
        .replace(/th/g, 't')
        .replace(/dh/g, 'd')
        .replace(/sh/g, 'š')
        // Q and K are often interchangeable in transliteration
        .replace(/q/g, 'k')
        // Double consonants can be written as single
        .replace(/tt/g, 't')
        .replace(/dd/g, 'd')
        .replace(/ss/g, 's')
        .replace(/ll/g, 'l')
        .replace(/mm/g, 'm')
        .replace(/nn/g, 'n')
        .replace(/rr/g, 'r')
        .replace(/bb/g, 'b')
        // Remove hyphens and extra spaces
        .replace(/-/g, ' ')
        .replace(/\s+/g, ' ');
}

/**
 * Validate user's transliteration against the correct answer.
 * Allows for common variations and minor typos.
 *
 * @param userInput - User's transliteration attempt
 * @param correct - Correct transliteration from database
 * @returns true if the transliteration is acceptable
 */
export function validateTransliteration(userInput: string, correct: string): boolean {
    const userNorm = normalizeTransliteration(userInput);
    const correctNorm = normalizeTransliteration(correct);

    // Exact match after normalization
    if (userNorm === correctNorm) {
        return true;
    }

    // Calculate allowed typo threshold based on word length
    // Be generous - transliteration is hard and varies widely
    const maxDistance = correctNorm.length <= 5 ? 2
        : correctNorm.length <= 10 ? 3
        : correctNorm.length <= 15 ? 4
        : 5;

    // Allow typos using Levenshtein distance
    const distance = levenshteinDistance(userNorm, correctNorm);
    if (distance <= maxDistance) {
        return true;
    }

    // Also try comparing without spaces (handles hyphen/space confusion)
    const userNoSpace = userNorm.replace(/\s/g, '');
    const correctNoSpace = correctNorm.replace(/\s/g, '');
    const distanceNoSpace = levenshteinDistance(userNoSpace, correctNoSpace);
    if (distanceNoSpace <= maxDistance) {
        return true;
    }

    return false;
}
