/**
 * Egyptian Arabic dictionary for common words and phrases
 * This provides a reliable fallback when the API doesn't return Egyptian Arabic
 */

export interface EgyptianEntry {
  msa: string;
  egyptian: string;
  transliteration: string;
}

export const EGYPTIAN_DICTIONARY: Record<string, EgyptianEntry> = {
  // Question words
  'كَيْفَ': { msa: 'كَيْفَ', egyptian: 'إزَّاي', transliteration: 'ezzay' },
  'كَمْ': { msa: 'كَمْ', egyptian: 'بِكَام', transliteration: 'bikam' },
  'مَاذَا': { msa: 'مَاذَا', egyptian: 'إيه', transliteration: 'eih' },
  'أَيْنَ': { msa: 'أَيْنَ', egyptian: 'فين', transliteration: 'fein' },
  'مَتَى': { msa: 'مَتَى', egyptian: 'إمْتَى', transliteration: 'emta' },
  'لِمَاذَا': { msa: 'لِمَاذَا', egyptian: 'ليه', transliteration: 'leih' },
  
  // Common phrases
  'كَمْ السِّعْر': { msa: 'كَمْ السِّعْر', egyptian: 'بِكَام ده', transliteration: 'bikam da' },
  'كَمْ السِّعْرُ': { msa: 'كَمْ السِّعْرُ', egyptian: 'بِكَام ده', transliteration: 'bikam da' },
  'بِكَمْ هَذَا': { msa: 'بِكَمْ هَذَا', egyptian: 'بِكَام ده', transliteration: 'bikam da' },
  'كَيْفَ كَانَتْ عُطْلَتُكَ': { msa: 'كَيْفَ كَانَتْ عُطْلَتُكَ', egyptian: 'إزَّاي كَانِت أَجَازْتَك', transliteration: 'ezzay kanet agaztak' },
  'كَيْفَ كَانَتْ': { msa: 'كَيْفَ كَانَتْ', egyptian: 'إزَّاي كَانِت', transliteration: 'ezzay kanet' },
  
  // Verbs
  'أُرِيدُ': { msa: 'أُرِيدُ', egyptian: 'عَايِز', transliteration: 'aayez' },
  'أُرِيد': { msa: 'أُرِيد', egyptian: 'عَايِز', transliteration: 'aayez' },
  
  // Adjectives
  'سَعِيد': { msa: 'سَعِيد', egyptian: 'مَبْسُوط', transliteration: 'mabsut' },
  'سَعِيدٌ': { msa: 'سَعِيدٌ', egyptian: 'مَبْسُوط', transliteration: 'mabsut' },
  
  // Phrases
  'الْكَلْبُ سَعِيدٌ': { msa: 'الْكَلْبُ سَعِيدٌ', egyptian: 'الكلب مبسوط', transliteration: 'el-kalb mabsut' },
  'الكلب سعيد': { msa: 'الكلب سعيد', egyptian: 'الكلب مبسوط', transliteration: 'el-kalb mabsut' },
  'ذَاهِبٌ': { msa: 'ذَاهِبٌ', egyptian: 'رَايِح', transliteration: 'raayeh' },
  'ذَاهِب': { msa: 'ذَاهِب', egyptian: 'رَايِح', transliteration: 'raayeh' },
  
  // Common words
  'جَيِّد': { msa: 'جَيِّد', egyptian: 'كْوَيِّس', transliteration: 'kwayyis' },
  'جَيِّدٌ': { msa: 'جَيِّدٌ', egyptian: 'كْوَيِّس', transliteration: 'kwayyis' },
  'العَمَل': { msa: 'العَمَل', egyptian: 'الشُغْل', transliteration: 'el-shoghl' },
  'عَمَل': { msa: 'عَمَل', egyptian: 'شُغْل', transliteration: 'shoghl' },
  'الآن': { msa: 'الآن', egyptian: 'دِلْوَقْتِي', transliteration: 'dilwaqti' },
  'الآنَ': { msa: 'الآنَ', egyptian: 'دِلْوَقْتِي', transliteration: 'dilwaqti' },
};

/**
 * Look up Egyptian Arabic equivalent for an MSA word or phrase
 */
export function getEgyptianEquivalent(msaText: string): EgyptianEntry | null {
  // Direct lookup
  if (EGYPTIAN_DICTIONARY[msaText]) {
    return EGYPTIAN_DICTIONARY[msaText];
  }
  
  // Try without diacritics
  const stripped = msaText.replace(/[\u064B-\u0652]/g, '').trim();
  for (const [key, value] of Object.entries(EGYPTIAN_DICTIONARY)) {
    const keyStripped = key.replace(/[\u064B-\u0652]/g, '').trim();
    if (keyStripped === stripped) {
      return value;
    }
  }
  
  return null;
}
