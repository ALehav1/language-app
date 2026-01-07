/**
 * Sound-alike words system for memory aids
 * Tracks words that sound similar across languages to help with memorization
 */

export interface SoundAlike {
  arabic: string;
  soundsLike: {
    english?: string;
    hebrew?: string;
  };
  type: 'cognate' | 'loanword' | 'sound-alike' | 'false-friend';
  notes?: string;
}

export const SOUND_ALIKE_WORDS: SoundAlike[] = [
  // Cat example - sounds like both English and Hebrew AND means the same
  {
    arabic: 'قطة',
    soundsLike: {
      english: 'cat (same meaning)',
      hebrew: 'khatul (חתול - same meaning)'
    },
    type: 'sound-alike',
    notes: 'Arabic qitta sounds like English "cat" and Hebrew "khatul" - all mean cat'
  },
  {
    arabic: 'قِطَّة',
    soundsLike: {
      english: 'cat (same meaning)',
      hebrew: 'khatul (חתול - same meaning)'
    },
    type: 'sound-alike',
    notes: 'Arabic qitta sounds like English "cat" and Hebrew "khatul" - all mean cat'
  },
  // Mabsut - Arabic loanword in Hebrew
  {
    arabic: 'مبسوط',
    soundsLike: {
      hebrew: 'mabsut'
    },
    type: 'loanword',
    notes: 'Same word used in modern Hebrew slang'
  },
  // More examples
  {
    arabic: 'بنك',
    soundsLike: {
      english: 'bank'
    },
    type: 'loanword',
    notes: 'International loanword'
  },
  {
    arabic: 'تلفون',
    soundsLike: {
      english: 'telephone'
    },
    type: 'loanword',
    notes: 'International loanword'
  },
  {
    arabic: 'كمبيوتر',
    soundsLike: {
      english: 'computer'
    },
    type: 'loanword',
    notes: 'Modern technology loanword'
  }
];

/**
 * Find sound-alike words for a given Arabic word
 */
export function findSoundAlike(arabicWord: string): SoundAlike | null {
  // Strip diacritics for comparison
  const stripped = arabicWord.replace(/[\u064B-\u0652]/g, '').trim();
  
  return SOUND_ALIKE_WORDS.find(entry => {
    const entryStripped = entry.arabic.replace(/[\u064B-\u0652]/g, '').trim();
    return entry.arabic === arabicWord || entryStripped === stripped;
  }) || null;
}

/**
 * Format sound-alike information for display
 */
export function formatSoundAlike(soundAlike: SoundAlike): string {
  const parts: string[] = [];
  
  if (soundAlike.soundsLike.english) {
    parts.push(`English: ${soundAlike.soundsLike.english}`);
  }
  
  if (soundAlike.soundsLike.hebrew) {
    parts.push(`Hebrew: ${soundAlike.soundsLike.hebrew}`);
  }
  
  return parts.join(' • ');
}
