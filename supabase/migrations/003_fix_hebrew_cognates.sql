-- Fix Hebrew cognates with accurate linguistic information
-- Run this in Supabase SQL Editor

-- مرحبا (marhaba/hello) - no direct Hebrew cognate
UPDATE vocabulary_items
SET hebrew_cognate = NULL
WHERE word = 'مرحبا';

-- شكرا (shukran/thank you) - no direct Hebrew cognate (NOT related to שכר)
UPDATE vocabulary_items
SET hebrew_cognate = NULL
WHERE word = 'شكرا';

-- نعم (na'am/yes) - related to Hebrew נעם but used differently
UPDATE vocabulary_items
SET hebrew_cognate = '{"root": "נעם", "meaning": "pleasant", "notes": "Same Semitic root, but Hebrew uses כן (ken) for yes"}'
WHERE word = 'نعم';

-- لا (la/no) - identical to Hebrew
UPDATE vocabulary_items
SET hebrew_cognate = '{"root": "לא", "meaning": "no/not", "notes": "Identical word in both languages"}'
WHERE word = 'لا';

-- واحد (wahid/one) - cognate with אחד
UPDATE vocabulary_items
SET hebrew_cognate = '{"root": "אחד", "meaning": "one", "notes": "Same Semitic root - echad/wahid"}'
WHERE word = 'واحد';

-- اثنان (ithnan/two) - cognate with שניים
UPDATE vocabulary_items
SET hebrew_cognate = '{"root": "שניים", "meaning": "two", "notes": "Same Semitic root - shnayim/ithnan"}'
WHERE word = 'اثنان';

-- ثلاثة (thalatha/three) - cognate with שלוש
UPDATE vocabulary_items
SET hebrew_cognate = '{"root": "שלוש", "meaning": "three", "notes": "Same Semitic root - shalosh/thalatha"}'
WHERE word = 'ثلاثة';
