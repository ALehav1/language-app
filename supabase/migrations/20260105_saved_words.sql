-- Phase 12A: My Vocabulary - Arabic Word Collection
-- Migration: Create saved_words and word_contexts tables

-- Drop old saved_vocabulary table (test data only, no migration needed)
DROP TABLE IF EXISTS saved_vocabulary;

-- Create saved_words table for Arabic vocabulary collection
CREATE TABLE saved_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Word data
  word TEXT NOT NULL,                           -- Arabic word
  translation TEXT NOT NULL,                    -- English meaning
  language TEXT NOT NULL DEFAULT 'arabic',      -- Phase 12 is Arabic-only
  
  -- Dialect-specific pronunciations
  pronunciation_standard TEXT,                  -- MSA/Fusha transliteration
  pronunciation_egyptian TEXT,                  -- Egyptian Arabic transliteration
  
  -- Learning metadata (JSONB for flexibility)
  letter_breakdown JSONB,                       -- Array of {letter, name, sound}
  hebrew_cognate JSONB,                         -- {root, meaning, notes}
  
  -- Organization
  topic TEXT,                                   -- User-assigned topic
  tags TEXT[],                                  -- User tags array
  
  -- Review status
  status TEXT NOT NULL DEFAULT 'needs_review' 
    CHECK (status IN ('needs_review', 'solid', 'retired')),
  times_practiced INTEGER DEFAULT 0,
  times_correct INTEGER DEFAULT 0,
  last_practiced TIMESTAMPTZ,
  next_review TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate words
  UNIQUE(word)
);

-- Create word_contexts table for source sentences/phrases
CREATE TABLE word_contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  saved_word_id UUID REFERENCES saved_words(id) ON DELETE CASCADE,
  
  -- Context data
  content_type TEXT NOT NULL 
    CHECK (content_type IN ('word', 'phrase', 'dialog', 'paragraph', 'lookup')),
  full_text TEXT NOT NULL,                      -- The complete phrase/sentence
  full_transliteration TEXT,                    -- Transliteration of full text
  full_translation TEXT NOT NULL,               -- English translation
  
  -- Dialog-specific
  speaker TEXT,                                 -- "A" or "B" for dialogs
  dialog_context TEXT,                          -- Stage direction
  
  -- Source reference (optional - null for lookup mode)
  lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
  vocabulary_item_id UUID REFERENCES vocabulary_items(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_saved_words_status ON saved_words(status);
CREATE INDEX idx_saved_words_topic ON saved_words(topic);
CREATE INDEX idx_saved_words_created ON saved_words(created_at DESC);
CREATE INDEX idx_saved_words_word ON saved_words(word);
CREATE INDEX idx_word_contexts_word ON word_contexts(saved_word_id);

-- Full-text search on word and translation
CREATE INDEX idx_saved_words_search ON saved_words 
  USING gin(to_tsvector('simple', word || ' ' || translation));
