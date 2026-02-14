-- Add letter_breakdown column for Arabic character learning
-- Run this in Supabase SQL Editor

ALTER TABLE vocabulary_items
ADD COLUMN IF NOT EXISTS letter_breakdown JSONB;

-- Example format:
-- [
--   { "letter": "م", "name": "Meem", "sound": "m" },
--   { "letter": "ر", "name": "Ra", "sound": "r" }
-- ]
