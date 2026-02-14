-- Add content_type column for different learning content types
-- Run this in Supabase SQL Editor

-- Add content_type enum
DO $$ BEGIN
    CREATE TYPE content_type AS ENUM ('word', 'phrase', 'dialog', 'paragraph');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add content_type column with default 'word' for existing data
ALTER TABLE vocabulary_items
ADD COLUMN IF NOT EXISTS content_type content_type DEFAULT 'word';

-- Also add to lessons table so lessons can be filtered by content type
ALTER TABLE lessons
ADD COLUMN IF NOT EXISTS content_type content_type DEFAULT 'word';

-- Update existing records to have 'word' as content_type
UPDATE vocabulary_items SET content_type = 'word' WHERE content_type IS NULL;
UPDATE lessons SET content_type = 'word' WHERE content_type IS NULL;
