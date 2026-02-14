-- Saved vocabulary table for user's word collection
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS saved_vocabulary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vocabulary_item_id UUID REFERENCES vocabulary_items(id) ON DELETE CASCADE,
    saved_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    UNIQUE(vocabulary_item_id)  -- Prevent duplicate saves
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_saved_vocab_item ON saved_vocabulary(vocabulary_item_id);
CREATE INDEX IF NOT EXISTS idx_saved_vocab_date ON saved_vocabulary(saved_at DESC);
