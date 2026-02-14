-- Migration: Add memory aids (notes + visuals) to saved content
-- Date: 2026-01-06
-- Purpose: Allow users to add personal notes and AI-generated visuals to help remember words/sentences/passages

-- Add memory aid columns to saved_words
ALTER TABLE saved_words ADD COLUMN IF NOT EXISTS memory_note TEXT;
ALTER TABLE saved_words ADD COLUMN IF NOT EXISTS memory_image_url TEXT;

-- Add memory aid columns to saved_sentences
ALTER TABLE saved_sentences ADD COLUMN IF NOT EXISTS memory_note TEXT;
ALTER TABLE saved_sentences ADD COLUMN IF NOT EXISTS memory_image_url TEXT;

-- Add memory aid columns to saved_passages
ALTER TABLE saved_passages ADD COLUMN IF NOT EXISTS memory_note TEXT;
ALTER TABLE saved_passages ADD COLUMN IF NOT EXISTS memory_image_url TEXT;

-- Create storage bucket for memory images (run this in Supabase dashboard or via API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('memory-images', 'memory-images', true);
