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
        // Common vowel variations
        .replace(/aa/g, 'a')
        .replace(/ee/g, 'i')
        .replace(/oo/g, 'u')
        .replace(/ou/g, 'u')
        // Common consonant variations
        .replace(/kh/g, 'x')
        .replace(/gh/g, 'g')
        .replace(/th/g, 't')
        .replace(/dh/g, 'd')
        .replace(/sh/g, 'š')
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
    // Longer phrases get more leeway
    const maxDistance = correctNorm.length <= 5 ? 1
        : correctNorm.length <= 10 ? 2
        : 3;

    // Allow minor typos using Levenshtein distance
    const distance = levenshteinDistance(userNorm, correctNorm);
    if (distance <= maxDistance) {
        return true;
    }

    return false;
}
