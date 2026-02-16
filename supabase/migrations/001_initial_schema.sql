-- Migration: 001_initial_schema.sql
-- Created: 2026-02-13
-- Purpose: Clean schema definition for all application tables
-- Note: Replaces all previous migrations (archived in _archive/)
-- Tables: lessons, vocabulary_items, lesson_progress, saved_words,
--         word_contexts, saved_sentences, saved_passages, saved_dialogs

-- ============================================================
-- TABLE: lessons
-- ============================================================
CREATE TABLE lessons (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text NOT NULL,
    language text NOT NULL CHECK (language IN ('arabic', 'spanish')),
    difficulty text NOT NULL CHECK (difficulty IN ('new', 'learning', 'practiced', 'mastered')),
    content_type text NOT NULL DEFAULT 'word' CHECK (content_type IN ('word', 'sentence', 'dialog', 'passage')),
    estimated_minutes integer NOT NULL DEFAULT 5,
    vocab_count integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: vocabulary_items
-- ============================================================
CREATE TABLE vocabulary_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    word text NOT NULL,
    translation text NOT NULL,
    language text NOT NULL CHECK (language IN ('arabic', 'spanish')),
    content_type text NOT NULL DEFAULT 'word' CHECK (content_type IN ('word', 'sentence', 'dialog', 'passage')),
    transliteration text,
    hebrew_cognate jsonb,
    letter_breakdown jsonb,
    speaker text,
    context text,
    mastery_level text NOT NULL DEFAULT 'new' CHECK (mastery_level IN ('new', 'learning', 'practiced', 'mastered')),
    times_practiced integer NOT NULL DEFAULT 0,
    last_reviewed timestamptz,
    next_review timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: lesson_progress
-- ============================================================
CREATE TABLE lesson_progress (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
    language text NOT NULL CHECK (language IN ('arabic', 'spanish')),
    completed_date timestamptz NOT NULL DEFAULT now(),
    score integer,
    items_practiced integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: saved_words
-- ============================================================
CREATE TABLE saved_words (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    word text NOT NULL,
    translation text NOT NULL,
    language text NOT NULL DEFAULT 'arabic' CHECK (language IN ('arabic', 'spanish')),
    pronunciation_standard text,
    pronunciation_egyptian text,
    letter_breakdown jsonb,
    hebrew_cognate jsonb,
    example_sentences jsonb,
    topic text,
    tags text[],
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'learned', 'retired')),
    times_practiced integer NOT NULL DEFAULT 0,
    times_correct integer NOT NULL DEFAULT 0,
    last_practiced timestamptz,
    next_review timestamptz,
    memory_note text,
    memory_image_url text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(word, language)
);

-- ============================================================
-- TABLE: word_contexts
-- ============================================================
CREATE TABLE word_contexts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    saved_word_id uuid NOT NULL REFERENCES saved_words(id) ON DELETE CASCADE,
    content_type text NOT NULL CHECK (content_type IN ('word', 'sentence', 'dialog', 'passage', 'lookup')),
    full_text text NOT NULL,
    full_transliteration text,
    full_translation text NOT NULL,
    speaker text,
    dialog_context text,
    lesson_id uuid REFERENCES lessons(id) ON DELETE SET NULL,
    vocabulary_item_id uuid REFERENCES vocabulary_items(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: saved_sentences
-- ============================================================
CREATE TABLE saved_sentences (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    arabic_text text NOT NULL,
    arabic_egyptian text,
    transliteration text NOT NULL,
    transliteration_egyptian text,
    translation text NOT NULL,
    explanation text,
    topic text,
    source text,
    language text NOT NULL CHECK (language IN ('arabic', 'spanish')),
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'learned')),
    memory_note text,
    memory_image_url text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: saved_passages
-- ============================================================
CREATE TABLE saved_passages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    original_text text NOT NULL,
    source_language text NOT NULL CHECK (source_language IN ('arabic', 'english', 'spanish')),
    language text NOT NULL DEFAULT 'arabic' CHECK (language IN ('arabic', 'spanish')),
    full_translation text NOT NULL,
    full_transliteration text,
    sentence_count integer NOT NULL DEFAULT 1,
    enrichment_data jsonb,
    source text,
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'learned')),
    memory_note text,
    memory_image_url text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- TABLE: saved_dialogs (minimal, future-ready)
-- ============================================================
CREATE TABLE saved_dialogs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    language text NOT NULL CHECK (language IN ('arabic', 'spanish')),
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'learned')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);
