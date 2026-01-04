-- Language Learning App Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Lessons table
CREATE TABLE IF NOT EXISTS lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    language TEXT NOT NULL CHECK (language IN ('arabic', 'spanish')),
    difficulty TEXT NOT NULL CHECK (difficulty IN ('new', 'learning', 'practiced', 'mastered')),
    estimated_minutes INTEGER NOT NULL DEFAULT 5,
    vocab_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vocabulary items table
CREATE TABLE IF NOT EXISTS vocabulary_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    word TEXT NOT NULL,
    translation TEXT NOT NULL,
    language TEXT NOT NULL CHECK (language IN ('arabic', 'spanish')),
    transliteration TEXT,
    hebrew_cognate JSONB,  -- { root?: string, meaning?: string, notes?: string }
    mastery_level TEXT NOT NULL DEFAULT 'new' CHECK (mastery_level IN ('new', 'learning', 'practiced', 'mastered')),
    last_reviewed TIMESTAMPTZ,
    next_review TIMESTAMPTZ,
    times_practiced INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lesson progress tracking
CREATE TABLE IF NOT EXISTS lesson_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    language TEXT NOT NULL CHECK (language IN ('arabic', 'spanish')),
    completed_date TIMESTAMPTZ DEFAULT NOW(),
    score INTEGER,
    items_practiced INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_vocab_lesson ON vocabulary_items(lesson_id);
CREATE INDEX IF NOT EXISTS idx_vocab_language ON vocabulary_items(language);
CREATE INDEX IF NOT EXISTS idx_vocab_next_review ON vocabulary_items(next_review);
CREATE INDEX IF NOT EXISTS idx_progress_lesson ON lesson_progress(lesson_id);

-- Insert sample lessons
INSERT INTO lessons (id, title, description, language, difficulty, estimated_minutes, vocab_count) VALUES
    ('00000000-0000-0000-0000-000000000001', 'Greetings & Introductions', 'Learn essential Arabic greetings and how to introduce yourself in everyday conversations.', 'arabic', 'new', 5, 5),
    ('00000000-0000-0000-0000-000000000002', 'At the Restaurant', 'Order food, ask for the menu, and handle common restaurant situations in Spanish.', 'spanish', 'learning', 7, 5),
    ('00000000-0000-0000-0000-000000000003', 'Numbers & Counting', 'Master Arabic numerals 1-20 with pronunciation tips and Hebrew cognate connections.', 'arabic', 'new', 6, 3),
    ('00000000-0000-0000-0000-000000000004', 'Travel Essentials', 'Navigate airports, hotels, and transportation with confidence.', 'spanish', 'practiced', 8, 3);

-- Insert Arabic Greetings vocabulary
INSERT INTO vocabulary_items (lesson_id, word, translation, language, transliteration, hebrew_cognate) VALUES
    ('00000000-0000-0000-0000-000000000001', 'مرحبا', 'hello', 'arabic', 'marhaba', '{"root": "ברוך", "meaning": "blessing/welcome", "notes": "Similar greeting pattern in Hebrew"}'),
    ('00000000-0000-0000-0000-000000000001', 'شكرا', 'thank you', 'arabic', 'shukran', '{"root": "שכר", "meaning": "reward/payment", "notes": "Shares same Semitic root"}'),
    ('00000000-0000-0000-0000-000000000001', 'نعم', 'yes', 'arabic', 'na''am', '{"root": "נעם", "meaning": "pleasant/agreeable", "notes": "Identical root, used for affirmation"}'),
    ('00000000-0000-0000-0000-000000000001', 'لا', 'no', 'arabic', 'la', '{"root": "לא", "meaning": "no/not", "notes": "Identical in both languages"}'),
    ('00000000-0000-0000-0000-000000000001', 'من فضلك', 'please', 'arabic', 'min fadlik', NULL);

-- Insert Spanish Restaurant vocabulary
INSERT INTO vocabulary_items (lesson_id, word, translation, language) VALUES
    ('00000000-0000-0000-0000-000000000002', 'la cuenta', 'the bill', 'spanish'),
    ('00000000-0000-0000-0000-000000000002', 'el menú', 'the menu', 'spanish'),
    ('00000000-0000-0000-0000-000000000002', 'la mesa', 'the table', 'spanish'),
    ('00000000-0000-0000-0000-000000000002', 'el agua', 'the water', 'spanish'),
    ('00000000-0000-0000-0000-000000000002', 'delicioso', 'delicious', 'spanish');

-- Insert Arabic Numbers vocabulary
INSERT INTO vocabulary_items (lesson_id, word, translation, language, transliteration, hebrew_cognate) VALUES
    ('00000000-0000-0000-0000-000000000003', 'واحد', 'one', 'arabic', 'wahid', '{"root": "אחד", "meaning": "one/single", "notes": "Same Semitic root for one"}'),
    ('00000000-0000-0000-0000-000000000003', 'اثنان', 'two', 'arabic', 'ithnan', '{"root": "שניים", "meaning": "two", "notes": "Related number from Semitic root"}'),
    ('00000000-0000-0000-0000-000000000003', 'ثلاثة', 'three', 'arabic', 'thalatha', '{"root": "שלוש", "meaning": "three", "notes": "Similar Semitic root for three"}');

-- Insert Spanish Travel vocabulary
INSERT INTO vocabulary_items (lesson_id, word, translation, language) VALUES
    ('00000000-0000-0000-0000-000000000004', 'el aeropuerto', 'the airport', 'spanish'),
    ('00000000-0000-0000-0000-000000000004', 'el hotel', 'the hotel', 'spanish'),
    ('00000000-0000-0000-0000-000000000004', 'el taxi', 'the taxi', 'spanish');

-- Update vocab counts
UPDATE lessons SET vocab_count = (
    SELECT COUNT(*) FROM vocabulary_items WHERE vocabulary_items.lesson_id = lessons.id
);

-- Row Level Security (optional, for future auth)
-- ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE vocabulary_items ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
