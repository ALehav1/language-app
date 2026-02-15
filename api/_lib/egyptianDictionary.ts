/**
 * Egyptian Arabic dictionary for common words and phrases
 * This provides a reliable fallback when the API doesn't return Egyptian Arabic
 *
 * NOTE: This is a server-side copy for Vercel serverless functions.
 * Source of truth: src/utils/egyptianDictionary.ts
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

  // Nouns - Transportation
  'سَيَّارَة': { msa: 'سَيَّارَة', egyptian: 'عَرَبِيَّة', transliteration: 'arabiyya' },
  'السَّيَّارَة': { msa: 'السَّيَّارَة', egyptian: 'العَرَبِيَّة', transliteration: 'el-arabiyya' },
  'السَّيَّارَةُ': { msa: 'السَّيَّارَةُ', egyptian: 'العَرَبِيَّة', transliteration: 'el-arabiyya' },
  'سَيَّارَتِي': { msa: 'سَيَّارَتِي', egyptian: 'عَرَبِيَّتِي', transliteration: 'arabiyyeti' },

  // Nouns - House & Home
  'بَيْت': { msa: 'بَيْت', egyptian: 'بيت', transliteration: 'beit' },
  'البَيْت': { msa: 'البَيْت', egyptian: 'البيت', transliteration: 'el-beit' },
  'بَيْتِي': { msa: 'بَيْتِي', egyptian: 'بيتي', transliteration: 'beiti' },
  'مَنْزِل': { msa: 'مَنْزِل', egyptian: 'بيت', transliteration: 'beit' },
  'المَنْزِل': { msa: 'المَنْزِل', egyptian: 'البيت', transliteration: 'el-beit' },
  'مَنْزِلِي': { msa: 'مَنْزِلِي', egyptian: 'بيتي', transliteration: 'beiti' },

  // Nouns - Bedroom & Furniture
  'سَرِير': { msa: 'سَرِير', egyptian: 'سرير', transliteration: 'sereer' },
  'السَرِير': { msa: 'السَرِير', egyptian: 'السرير', transliteration: 'el-sereer' },
  'سَرِيرِي': { msa: 'سَرِيرِي', egyptian: 'سريري', transliteration: 'sereeri' },
  'غُرْفَة': { msa: 'غُرْفَة', egyptian: 'أوضة', transliteration: 'oda' },
  'الغُرْفَة': { msa: 'الغُرْفَة', egyptian: 'الأوضة', transliteration: 'el-oda' },
  'غُرْفَتِي': { msa: 'غُرْفَتِي', egyptian: 'أوضتي', transliteration: 'odti' },

  // Nouns - Food & Drink
  'مَاء': { msa: 'مَاء', egyptian: 'مَيَّة', transliteration: 'mayya' },
  'المَاء': { msa: 'المَاء', egyptian: 'المَيَّة', transliteration: 'el-mayya' },
  'طَعَام': { msa: 'طَعَام', egyptian: 'أكل', transliteration: 'akl' },
  'الطَعَام': { msa: 'الطَعَام', egyptian: 'الأكل', transliteration: 'el-akl' },
  'خُبْز': { msa: 'خُبْز', egyptian: 'عيش', transliteration: 'eish' },
  'الخُبْز': { msa: 'الخُبْز', egyptian: 'العيش', transliteration: 'el-eish' },

  // Nouns - Family
  'وَلَد': { msa: 'وَلَد', egyptian: 'ولد', transliteration: 'walad' },
  'وَلَدِي': { msa: 'وَلَدِي', egyptian: 'ولدي', transliteration: 'waladi' },
  'بِنْت': { msa: 'بِنْت', egyptian: 'بنت', transliteration: 'bint' },
  'بِنْتِي': { msa: 'بِنْتِي', egyptian: 'بنتي', transliteration: 'binti' },
  'أُمّ': { msa: 'أُمّ', egyptian: 'أم', transliteration: 'omm' },
  'أُمِّي': { msa: 'أُمِّي', egyptian: 'أمي', transliteration: 'ommi' },
  'أَب': { msa: 'أَب', egyptian: 'أب', transliteration: 'ab' },
  'أَبِي': { msa: 'أَبِي', egyptian: 'أبويا', transliteration: 'aboya' },

  // Nouns - Common Objects
  'كِتَاب': { msa: 'كِتَاب', egyptian: 'كتاب', transliteration: 'ketab' },
  'الكِتَاب': { msa: 'الكِتَاب', egyptian: 'الكتاب', transliteration: 'el-ketab' },
  'كِتَابِي': { msa: 'كِتَابِي', egyptian: 'كتابي', transliteration: 'ketabi' },
  'قَلَم': { msa: 'قَلَم', egyptian: 'قلم', transliteration: 'alam' },
  'القَلَم': { msa: 'القَلَم', egyptian: 'القلم', transliteration: 'el-alam' },
  'قَلَمِي': { msa: 'قَلَمِي', egyptian: 'قلمي', transliteration: 'alami' },
  'هَاتِف': { msa: 'هَاتِف', egyptian: 'تليفون', transliteration: 'telefon' },
  'الهَاتِف': { msa: 'الهَاتِف', egyptian: 'التليفون', transliteration: 'el-telefon' },
  'هَاتِفِي': { msa: 'هَاتِفِي', egyptian: 'تليفوني', transliteration: 'telefoni' },

  // Verbs - Want/Need
  'أُرِيدُ': { msa: 'أُرِيدُ', egyptian: 'عَايِز', transliteration: 'aayez' },
  'أُرِيد': { msa: 'أُرِيد', egyptian: 'عَايِز', transliteration: 'aayez' },
  'تُرِيد': { msa: 'تُرِيد', egyptian: 'عَايِز', transliteration: 'aayez' },
  'تُرِيدِين': { msa: 'تُرِيدِين', egyptian: 'عَايْزَة', transliteration: 'aayza' },

  // Verbs - Go/Come
  'ذَاهِبٌ': { msa: 'ذَاهِبٌ', egyptian: 'رَايِح', transliteration: 'raayeh' },
  'ذَاهِب': { msa: 'ذَاهِب', egyptian: 'رَايِح', transliteration: 'raayeh' },
  'ذَاهِبَة': { msa: 'ذَاهِبَة', egyptian: 'رَايْحَة', transliteration: 'rayha' },
  'أَذْهَب': { msa: 'أَذْهَب', egyptian: 'أَرُوح', transliteration: 'arooh' },
  'تَذْهَب': { msa: 'تَذْهَب', egyptian: 'تَرُوح', transliteration: 'tarooh' },

  // Verbs - Eat/Drink
  'آكُل': { msa: 'آكُل', egyptian: 'باكُل', transliteration: 'bakol' },
  'تَأْكُل': { msa: 'تَأْكُل', egyptian: 'بتاكُل', transliteration: 'betakol' },
  'أَشْرَب': { msa: 'أَشْرَب', egyptian: 'بَشْرَب', transliteration: 'bashrab' },
  'تَشْرَب': { msa: 'تَشْرَب', egyptian: 'بتِشْرَب', transliteration: 'betishrab' },

  // Verbs - Say/Speak
  'أَقُول': { msa: 'أَقُول', egyptian: 'بَقُول', transliteration: 'baool' },
  'تَقُول': { msa: 'تَقُول', egyptian: 'بتِقُول', transliteration: 'betool' },
  'أَتَكَلَّم': { msa: 'أَتَكَلَّم', egyptian: 'بَتْكَلِّم', transliteration: 'batkallim' },
  'تَتَكَلَّم': { msa: 'تَتَكَلَّم', egyptian: 'بتِتْكَلِّم', transliteration: 'bettkallim' },

  // Adjectives - Emotions
  'سَعِيد': { msa: 'سَعِيد', egyptian: 'مَبْسُوط', transliteration: 'mabsut' },
  'سَعِيدٌ': { msa: 'سَعِيدٌ', egyptian: 'مَبْسُوط', transliteration: 'mabsut' },
  'سَعِيدَة': { msa: 'سَعِيدَة', egyptian: 'مَبْسُوطَة', transliteration: 'mabsuta' },
  'حَزِين': { msa: 'حَزِين', egyptian: 'زَعْلَان', transliteration: 'zaelan' },
  'حَزِينَة': { msa: 'حَزِينَة', egyptian: 'زَعْلَانَة', transliteration: 'zaelana' },
  'تَعْبَان': { msa: 'تَعْبَان', egyptian: 'تَعْبَان', transliteration: 'taeban' },
  'مَرِيض': { msa: 'مَرِيض', egyptian: 'عَيَّان', transliteration: 'ayyan' },

  // Adjectives - Size/Quality
  'كَبِير': { msa: 'كَبِير', egyptian: 'كَبِير', transliteration: 'kebeer' },
  'كَبِيرَة': { msa: 'كَبِيرَة', egyptian: 'كَبِيرَة', transliteration: 'kebeera' },
  'صَغِير': { msa: 'صَغِير', egyptian: 'صُغَيَّر', transliteration: 'soghayar' },
  'صَغِيرَة': { msa: 'صَغِيرَة', egyptian: 'صُغَيَّرَة', transliteration: 'soghayara' },
  'جَمِيل': { msa: 'جَمِيل', egyptian: 'جَمِيل', transliteration: 'gameel' },
  'جَمِيلَة': { msa: 'جَمِيلَة', egyptian: 'جَمِيلَة', transliteration: 'gameela' },
  'جَيِّد': { msa: 'جَيِّد', egyptian: 'كْوَيِّس', transliteration: 'kwayyis' },
  'جَيِّدٌ': { msa: 'جَيِّدٌ', egyptian: 'كْوَيِّس', transliteration: 'kwayyis' },
  'جَيِّدَة': { msa: 'جَيِّدَة', egyptian: 'كْوَيِّسَة', transliteration: 'kwayyisa' },

  // Phrases - Common Sentences
  'الْكَلْبُ سَعِيدٌ': { msa: 'الْكَلْبُ سَعِيدٌ', egyptian: 'الكلب مبسوط', transliteration: 'el-kalb mabsut' },
  'الكلب سعيد': { msa: 'الكلب سعيد', egyptian: 'الكلب مبسوط', transliteration: 'el-kalb mabsut' },
  'بَيْتِي كَبِير': { msa: 'بَيْتِي كَبِير', egyptian: 'بيتي كَبِير', transliteration: 'beiti kebeer' },
  'بيتي كبير': { msa: 'بيتي كبير', egyptian: 'بيتي كَبِير', transliteration: 'beiti kebeer' },

  // Common words - Time/Work
  'العَمَل': { msa: 'العَمَل', egyptian: 'الشُغْل', transliteration: 'el-shoghl' },
  'عَمَل': { msa: 'عَمَل', egyptian: 'شُغْل', transliteration: 'shoghl' },
  'الآن': { msa: 'الآن', egyptian: 'دِلْوَقْتِي', transliteration: 'dilwaqti' },
  'الآنَ': { msa: 'الآنَ', egyptian: 'دِلْوَقْتِي', transliteration: 'dilwaqti' },
  'اليَوْم': { msa: 'اليَوْم', egyptian: 'النَهَارْدَة', transliteration: 'ennaharda' },
  'غَداً': { msa: 'غَداً', egyptian: 'بُكْرَة', transliteration: 'bokra' },
  'أَمْس': { msa: 'أَمْس', egyptian: 'إمْبَارِح', transliteration: 'embareh' },

  // Colors
  'أَحْمَر': { msa: 'أَحْمَر', egyptian: 'أَحْمَر', transliteration: 'ahmar' },
  'حَمْرَاء': { msa: 'حَمْرَاء', egyptian: 'حَمْرَا', transliteration: 'hamra' },
  'أَزْرَق': { msa: 'أَزْرَق', egyptian: 'أَزْرَق', transliteration: 'azraa' },
  'زَرْقَاء': { msa: 'زَرْقَاء', egyptian: 'زَرْقَا', transliteration: 'zaraa' },
  'أَخْضَر': { msa: 'أَخْضَر', egyptian: 'أَخْضَر', transliteration: 'akhdar' },
  'خَضْرَاء': { msa: 'خَضْرَاء', egyptian: 'خَضْرَا', transliteration: 'khadra' },
  'أَصْفَر': { msa: 'أَصْفَر', egyptian: 'أَصْفَر', transliteration: 'asfar' },
  'صَفْرَاء': { msa: 'صَفْرَاء', egyptian: 'صَفْرَا', transliteration: 'safra' },
  'أَبْيَض': { msa: 'أَبْيَض', egyptian: 'أَبْيَض', transliteration: 'abyad' },
  'بَيْضَاء': { msa: 'بَيْضَاء', egyptian: 'بَيْضَا', transliteration: 'bayda' },
  'أَسْوَد': { msa: 'أَسْوَد', egyptian: 'أَسْوَد', transliteration: 'eswed' },
  'سَوْدَاء': { msa: 'سَوْدَاء', egyptian: 'سُودَا', transliteration: 'soda' },

  // Numbers (1-10)
  'وَاحِد': { msa: 'وَاحِد', egyptian: 'وَاحِد', transliteration: 'wahed' },
  'اِثْنَان': { msa: 'اِثْنَان', egyptian: 'اِتْنِين', transliteration: 'etnein' },
  'ثَلَاثَة': { msa: 'ثَلَاثَة', egyptian: 'تَلَاتَة', transliteration: 'talata' },
  'أَرْبَعَة': { msa: 'أَرْبَعَة', egyptian: 'أَرْبَعَة', transliteration: 'arbaa' },
  'خَمْسَة': { msa: 'خَمْسَة', egyptian: 'خَمْسَة', transliteration: 'khamsa' },
  'سِتَّة': { msa: 'سِتَّة', egyptian: 'سِتَّة', transliteration: 'setta' },
  'سَبْعَة': { msa: 'سَبْعَة', egyptian: 'سَبْعَة', transliteration: 'sabaa' },
  'ثَمَانِيَة': { msa: 'ثَمَانِيَة', egyptian: 'تَمَانْيَة', transliteration: 'tamanya' },
  'تِسْعَة': { msa: 'تِسْعَة', egyptian: 'تِسْعَة', transliteration: 'tesaa' },
  'عَشَرَة': { msa: 'عَشَرَة', egyptian: 'عَشَرَة', transliteration: 'ashara' },

  // Places
  'مَدْرَسَة': { msa: 'مَدْرَسَة', egyptian: 'مَدْرَسَة', transliteration: 'madrasa' },
  'المَدْرَسَة': { msa: 'المَدْرَسَة', egyptian: 'المَدْرَسَة', transliteration: 'el-madrasa' },
  'مَدْرَسَتِي': { msa: 'مَدْرَسَتِي', egyptian: 'مَدْرَسْتِي', transliteration: 'madraseti' },
  'مَكْتَب': { msa: 'مَكْتَب', egyptian: 'مَكْتَب', transliteration: 'maktab' },
  'المَكْتَب': { msa: 'المَكْتَب', egyptian: 'المَكْتَب', transliteration: 'el-maktab' },
  'مَطْعَم': { msa: 'مَطْعَم', egyptian: 'مَطْعَم', transliteration: 'mataam' },
  'المَطْعَم': { msa: 'المَطْعَم', egyptian: 'المَطْعَم', transliteration: 'el-mataam' },
  'مَحَل': { msa: 'مَحَل', egyptian: 'مَحَل', transliteration: 'mahal' },
  'المَحَل': { msa: 'المَحَل', egyptian: 'المَحَل', transliteration: 'el-mahal' },
  'شَارِع': { msa: 'شَارِع', egyptian: 'شَارِع', transliteration: 'sharea' },
  'الشَارِع': { msa: 'الشَارِع', egyptian: 'الشَارِع', transliteration: 'el-sharea' },
  'مَدِينَة': { msa: 'مَدِينَة', egyptian: 'مَدِينَة', transliteration: 'madeena' },
  'المَدِينَة': { msa: 'المَدِينَة', egyptian: 'المَدِينَة', transliteration: 'el-madeena' },

  // Activities/Actions
  'دِرَاسَة': { msa: 'دِرَاسَة', egyptian: 'مُذَاكَرَة', transliteration: 'mozakra' },
  'أَدْرُس': { msa: 'أَدْرُس', egyptian: 'بَذَاكِر', transliteration: 'bazaker' },
  'تَدْرُس': { msa: 'تَدْرُس', egyptian: 'بتِذَاكِر', transliteration: 'betezaker' },
  'أَعْمَل': { msa: 'أَعْمَل', egyptian: 'بَشْتَغَل', transliteration: 'bashtaghal' },
  'تَعْمَل': { msa: 'تَعْمَل', egyptian: 'بتِشْتَغَل', transliteration: 'beteshtaghal' },
  'نَوْم': { msa: 'نَوْم', egyptian: 'نُوم', transliteration: 'nom' },
  'أَنَام': { msa: 'أَنَام', egyptian: 'بَنَام', transliteration: 'banam' },
  'تَنَام': { msa: 'تَنَام', egyptian: 'بتِنَام', transliteration: 'betenam' },
  'لَعِب': { msa: 'لَعِب', egyptian: 'لَعِب', transliteration: 'leab' },
  'أَلْعَب': { msa: 'أَلْعَب', egyptian: 'بَلْعَب', transliteration: 'balаab' },
  'تَلْعَب': { msa: 'تَلْعَب', egyptian: 'بتِلْعَب', transliteration: 'betеlаab' },

  // Common Expressions
  'مَرْحَباً': { msa: 'مَرْحَباً', egyptian: 'أَهْلاً', transliteration: 'ahlan' },
  'شُكْراً': { msa: 'شُكْراً', egyptian: 'شُكْراً', transliteration: 'shokran' },
  'مِنْ فَضْلِك': { msa: 'مِنْ فَضْلِك', egyptian: 'مِنْ فَضْلَك', transliteration: 'men fadlak' },
  'نَعَم': { msa: 'نَعَم', egyptian: 'أَيْوَة', transliteration: 'aywa' },
  'لَا': { msa: 'لَا', egyptian: 'لَأ', transliteration: 'laa' },
  'اِسْمِي': { msa: 'اِسْمِي', egyptian: 'اِسْمِي', transliteration: 'esmi' },
  'اِسْمُك': { msa: 'اِسْمُك', egyptian: 'اِسْمَك', transliteration: 'esmak' },
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
