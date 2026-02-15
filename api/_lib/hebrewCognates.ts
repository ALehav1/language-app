/**
 * Hebrew Cognate Lookup Table
 * Static mapping of Arabic words/roots to Hebrew cognates.
 * Much more reliable than AI inference for Semitic root connections.
 *
 * NOTE: This is a server-side copy for Vercel serverless functions.
 * Source of truth: src/utils/hebrewCognates.ts
 */

export interface HebrewCognate {
    root: string;
    meaning: string;
    notes?: string;
}

// Map Arabic words to Hebrew cognates (key: Arabic word without diacritics)
const COGNATE_MAP: Record<string, HebrewCognate> = {
    // Writing (כ-ת-ב)
    'كتب': { root: 'כתב', meaning: 'write', notes: 'Root k-t-b' },
    'كتاب': { root: 'כתב', meaning: 'write', notes: 'kitab = book' },
    'مكتب': { root: 'כתב', meaning: 'write', notes: 'maktab/michtav - office/letter' },
    'مكتبة': { root: 'כתב', meaning: 'write', notes: 'maktaba = library' },
    // Peace (ש-ל-ם)
    'سلام': { root: 'שלום', meaning: 'peace', notes: 'salaam/shalom' },
    'سلم': { root: 'שלם', meaning: 'peace/complete' },
    'مسلم': { root: 'שלם', meaning: 'peace/submit' },
    // House (ב-י-ת)
    'بيت': { root: 'בית', meaning: 'house', notes: 'bayt/bayit' },
    // One (א-ח-ד)
    'واحد': { root: 'אחד', meaning: 'one', notes: 'wahid/echad' },
    // Water (מ-י-ם)
    'ماء': { root: 'מים', meaning: 'water', notes: 'maa/mayim' },
    'مياه': { root: 'מים', meaning: 'water' },
    // Day/Night
    'يوم': { root: 'יום', meaning: 'day', notes: 'yawm/yom' },
    'ليل': { root: 'לילה', meaning: 'night', notes: 'layl/layla' },
    'ليلة': { root: 'לילה', meaning: 'night' },
    // Heart
    'قلب': { root: 'לב', meaning: 'heart', notes: 'qalb/lev' },
    // King (מ-ל-ך)
    'ملك': { root: 'מלך', meaning: 'king', notes: 'malik/melech' },
    'ملكة': { root: 'מלכה', meaning: 'queen' },
    'مملكة': { root: 'ממלכה', meaning: 'kingdom' },
    // Work (ע-מ-ל)
    'عمل': { root: 'עמל', meaning: 'work/toil', notes: 'amal/amal' },
    'عامل': { root: 'עמל', meaning: 'worker' },
    'شغل': { root: 'עמל', meaning: 'work', notes: 'Egyptian: shughl' },
    // Earth/Land
    'أرض': { root: 'ארץ', meaning: 'earth/land', notes: 'ard/eretz' },
    'ارض': { root: 'ארץ', meaning: 'earth/land' },
    // Sky
    'سماء': { root: 'שמים', meaning: 'sky/heaven', notes: 'samaa/shamayim' },
    // Sun/Moon
    'شمس': { root: 'שמש', meaning: 'sun', notes: 'shams/shemesh' },
    'قمر': { root: 'קמר', meaning: 'moon', notes: 'qamar' },
    // Name
    'اسم': { root: 'שם', meaning: 'name', notes: 'ism/shem' },
    // Family
    'أم': { root: 'אם', meaning: 'mother', notes: 'umm/em' },
    'أب': { root: 'אב', meaning: 'father', notes: 'ab/av' },
    'أخ': { root: 'אח', meaning: 'brother', notes: 'akh/ach' },
    'أخت': { root: 'אחות', meaning: 'sister' },
    'ابن': { root: 'בן', meaning: 'son', notes: 'ibn/ben' },
    'بنت': { root: 'בת', meaning: 'daughter', notes: 'bint/bat' },
    'ولد': { root: 'ילד', meaning: 'child', notes: 'walad/yeled' },
    // Body parts
    'رأس': { root: 'ראש', meaning: 'head', notes: 'ras/rosh' },
    'يد': { root: 'יד', meaning: 'hand', notes: 'yad/yad' },
    'عين': { root: 'עין', meaning: 'eye', notes: 'ayn/ayin' },
    'فم': { root: 'פה', meaning: 'mouth', notes: 'fam/peh' },
    'دم': { root: 'דם', meaning: 'blood', notes: 'dam/dam' },
    'سن': { root: 'שן', meaning: 'tooth', notes: 'sinn/shen' },
    'لسان': { root: 'לשון', meaning: 'tongue', notes: 'lisan/lashon' },
    'أنف': { root: 'אף', meaning: 'nose', notes: 'anf/af' },
    'أذن': { root: 'אוזן', meaning: 'ear', notes: 'udhun/ozen' },
    'شعر': { root: 'שער', meaning: 'hair', notes: 'shaar/sear' },
    'عظم': { root: 'עצם', meaning: 'bone', notes: 'azm/etzem' },
    'رجل': { root: 'רגל', meaning: 'foot/leg', notes: 'rijl/regel' },
    // Actions
    'سمع': { root: 'שמע', meaning: 'hear', notes: 'samia/shama' },
    'رأى': { root: 'ראה', meaning: 'see', notes: 'raa/raah' },
    'أكل': { root: 'אכל', meaning: 'eat', notes: 'akala/achal' },
    'قام': { root: 'קום', meaning: 'stand/rise', notes: 'qama/kum' },
    'قرأ': { root: 'קרא', meaning: 'read/call', notes: 'qaraa/kara' },
    'بنى': { root: 'בנה', meaning: 'build', notes: 'bana/bana' },
    'فتح': { root: 'פתח', meaning: 'open', notes: 'fataha/patach' },
    'ذكر': { root: 'זכר', meaning: 'remember', notes: 'dhakara/zachar' },
    'ضحك': { root: 'צחק', meaning: 'laugh', notes: 'dahika/tzachak' },
    'بكى': { root: 'בכה', meaning: 'cry', notes: 'baka/bacha' },
    // Life/Death
    'موت': { root: 'מות', meaning: 'death', notes: 'mawt/mavet' },
    'مات': { root: 'מת', meaning: 'died' },
    'حياة': { root: 'חיים', meaning: 'life', notes: 'hayat/chayim' },
    'حي': { root: 'חי', meaning: 'alive' },
    // Religion
    'الله': { root: 'אלוה', meaning: 'God', notes: 'Allah/Eloha' },
    'إله': { root: 'אל', meaning: 'god' },
    'نبي': { root: 'נביא', meaning: 'prophet', notes: 'nabi/navi' },
    'بركة': { root: 'ברכה', meaning: 'blessing', notes: 'baraka/bracha' },
    // Time
    'زمن': { root: 'זמן', meaning: 'time', notes: 'zaman/zman' },
    'سنة': { root: 'שנה', meaning: 'year', notes: 'sana/shana' },
    'أسبوع': { root: 'שבוע', meaning: 'week', notes: 'usbuu/shavua' },
    'ساعة': { root: 'שעה', meaning: 'hour', notes: 'saa/shaah' },
    'اليوم': { root: 'היום', meaning: 'today', notes: 'al-yawm/hayom' },
    // Place
    'مكان': { root: 'מקום', meaning: 'place', notes: 'makan/makom' },
    'سوق': { root: 'שוק', meaning: 'market', notes: 'suq/shuk' },
    'مدرسة': { root: 'מדרש', meaning: 'study', notes: 'madrasa/midrash' },
    // Nature
    'ذهب': { root: 'זהב', meaning: 'gold', notes: 'dhahab/zahav' },
    'ملح': { root: 'מלח', meaning: 'salt', notes: 'milh/melach' },
    'زيتون': { root: 'זית', meaning: 'olive', notes: 'zaytun/zayit' },
    'زيت': { root: 'זית', meaning: 'oil' },
    'عنب': { root: 'ענב', meaning: 'grape', notes: 'inab/anav' },
    'تين': { root: 'תאנה', meaning: 'fig', notes: 'tin/teena' },
    'تمر': { root: 'תמר', meaning: 'date', notes: 'tamr/tamar' },
    'رمان': { root: 'רימון', meaning: 'pomegranate' },
    'شعير': { root: 'שעורה', meaning: 'barley' },
    // Animals
    'كلب': { root: 'כלב', meaning: 'dog', notes: 'kalb/kelev' },
    'بقرة': { root: 'בקר', meaning: 'cattle', notes: 'baqara/bakar' },
    'جمل': { root: 'גמל', meaning: 'camel', notes: 'jamal/gamal' },
    // Spirit/Soul
    'روح': { root: 'רוח', meaning: 'spirit/wind', notes: 'ruh/ruach' },
    'نفس': { root: 'נפש', meaning: 'soul/self', notes: 'nafs/nefesh' },
    // Adjectives
    'جديد': { root: 'חדש', meaning: 'new', notes: 'jadid/chadash' },
    'كبير': { root: 'כביר', meaning: 'great', notes: 'kabir/kabir' },
    'طيب': { root: 'טוב', meaning: 'good', notes: 'tayyib/tov' },
    'أحمر': { root: 'אדום', meaning: 'red', notes: 'ahmar/adom' },
    'لبن': { root: 'לבן', meaning: 'white/milk', notes: 'laban/lavan' },
    'قصير': { root: 'קצר', meaning: 'short', notes: 'qasir/katzar' },
    'قديم': { root: 'קדום', meaning: 'ancient', notes: 'qadim/kadum' },
    'قريب': { root: 'קרוב', meaning: 'near', notes: 'qarib/karov' },
    'حار': { root: 'חם', meaning: 'hot', notes: 'haar/cham' },
    // Directions
    'يمين': { root: 'ימין', meaning: 'right', notes: 'yamin/yamin' },
    'شمال': { root: 'שמאל', meaning: 'left/north', notes: 'shimal/smol' },
    'غرب': { root: 'מערב', meaning: 'west', notes: 'gharb/maarav' },
    'مساء': { root: 'ערב', meaning: 'evening', notes: 'masaa/erev' },
    // Abstract
    'عالم': { root: 'עולם', meaning: 'world', notes: 'aalam/olam' },
    'حكمة': { root: 'חכמה', meaning: 'wisdom', notes: 'hikma/chochma' },
    'حكيم': { root: 'חכם', meaning: 'wise' },
    'حرية': { root: 'חרות', meaning: 'freedom', notes: 'hurriya/cherut' },
    'حب': { root: 'חבב', meaning: 'love', notes: 'hubb/chibbuv' },
    'حبيب': { root: 'חביב', meaning: 'beloved', notes: 'habib/chaviv' },
    'حرب': { root: 'חרב', meaning: 'war/sword', notes: 'harb/cherev' },
    'سر': { root: 'סוד', meaning: 'secret', notes: 'sirr/sod' },
    'مال': { root: 'ממון', meaning: 'money', notes: 'mal/mamon' },
    'كل': { root: 'כל', meaning: 'all', notes: 'kull/kol' },
    'بين': { root: 'בין', meaning: 'between', notes: 'bayn/bein' },
    'عبر': { root: 'עבר', meaning: 'cross', notes: 'abara/avar' },
    'عبري': { root: 'עברי', meaning: 'Hebrew', notes: 'ibri/ivri' },
    // Pronouns/Basic
    'أنا': { root: 'אני', meaning: 'I', notes: 'ana/ani' },
    'أنت': { root: 'אתה', meaning: 'you (m)', notes: 'anta/ata' },
    'هو': { root: 'הוא', meaning: 'he', notes: 'huwa/hu' },
    'هي': { root: 'היא', meaning: 'she', notes: 'hiya/hi' },
    'نحن': { root: 'אנחנו', meaning: 'we', notes: 'nahnu/anachnu' },
    'هم': { root: 'הם', meaning: 'they', notes: 'hum/hem' },
    'ما': { root: 'מה', meaning: 'what', notes: 'ma/ma' },
    'من': { root: 'מי', meaning: 'who', notes: 'man/mi' },
    'لا': { root: 'לא', meaning: 'no', notes: 'la/lo' },
    'مع': { root: 'עם', meaning: 'with', notes: 'maa/im' },
    'هنا': { root: 'הנה', meaning: 'here', notes: 'huna/hineh' },
    'تحت': { root: 'תחת', meaning: 'under', notes: 'taht/tachat' },
    // People
    'آدم': { root: 'אדם', meaning: 'human/Adam', notes: 'adam/adam' },
    'ناس': { root: 'אנשים', meaning: 'people', notes: 'nas/anashim' },
    'أمة': { root: 'אומה', meaning: 'nation', notes: 'umma/uma' },
    // Study
    'درس': { root: 'דרש', meaning: 'study', notes: 'darasa/darash' },
    'سؤال': { root: 'שאלה', meaning: 'question', notes: 'sual/sheela' },
    'سأل': { root: 'שאל', meaning: 'ask' },
    'علم': { root: 'למד', meaning: 'know/teach' },
    'تعلم': { root: 'למד', meaning: 'learn' },
    'كلمة': { root: 'מילה', meaning: 'word', notes: 'kalima/mila' },
    'قرآن': { root: 'קריאה', meaning: 'recitation' },
    'سفر': { root: 'ספר', meaning: 'book/travel', notes: 'safar/sefer' },
};

/**
 * Look up Hebrew cognate for an Arabic word or phrase.
 * Uses the same word-by-word approach as lessons for consistency.
 *
 * For single words: Returns cognate if found
 * For phrases: Analyzes each word and returns cognate for first match found
 * Uses hebrew_note field to specify which word the cognate relates to (lesson approach)
 */
export function findHebrewCognate(arabicWord: string): HebrewCognate | null {
    // Defensive: handle undefined/null/non-string inputs
    if (!arabicWord || typeof arabicWord !== 'string' || arabicWord.trim() === '') {
        return null;
    }

    // Check if input is a phrase (contains spaces)
    if (arabicWord.includes(' ')) {
        return findHebrewCognateForPhrase(arabicWord);
    }

    // Single word - use existing logic
    return findHebrewCognateForSingleWord(arabicWord);
}

/**
 * Look up Hebrew cognate for a single Arabic word.
 * Strips diacritics and tries multiple variations.
 */
function findHebrewCognateForSingleWord(arabicWord: string): HebrewCognate | null {
    // Defensive: handle undefined/null/non-string inputs
    if (!arabicWord || typeof arabicWord !== 'string') {
        return null;
    }

    // Remove common diacritics
    const stripped = arabicWord
        .replace(/[\u064B-\u065F\u0670]/g, '') // Remove Arabic diacritics
        .replace(/[\u0640]/g, '') // Remove tatweel
        .trim();

    // Direct lookup
    if (COGNATE_MAP[stripped]) {
        return COGNATE_MAP[stripped];
    }

    // Try without alif/hamza variations
    const variations = [
        stripped,
        stripped.replace(/[أإآ]/g, 'ا'),
        stripped.replace(/ة$/, 'ه'),
        stripped.replace(/ى$/, 'ي'),
    ];

    for (const variant of variations) {
        if (COGNATE_MAP[variant]) {
            return COGNATE_MAP[variant];
        }
    }

    // Try extracting 3-letter root (very basic)
    // This is a simplified approach - real root extraction is complex
    const consonants = stripped.replace(/[اوي]/g, '');
    if (consonants.length >= 3) {
        const root = consonants.slice(0, 3);
        if (COGNATE_MAP[root]) {
            return COGNATE_MAP[root];
        }
    }

    return null;
}

/**
 * Look up Hebrew cognate for an Arabic phrase.
 * Uses the same approach as lessons: check each word individually.
 * Returns cognate for the first word found, with note specifying which word.
 */
function findHebrewCognateForPhrase(arabicPhrase: string): HebrewCognate | null {
    // Defensive: handle undefined/null/non-string inputs
    if (!arabicPhrase || typeof arabicPhrase !== 'string') {
        return null;
    }

    // Split phrase into individual words
    const words = arabicPhrase.trim().split(/\s+/);

    // Check each word for cognates (lesson approach)
    for (const word of words) {
        const cognate = findHebrewCognateForSingleWord(word);
        if (cognate) {
            // Return cognate with note specifying which word it relates to
            // This matches the lesson's hebrew_note pattern
            return {
                ...cognate,
                notes: cognate.notes
                    ? `${cognate.notes} (for ${word})`
                    : `for ${word}`
            };
        }
    }

    return null;
}
