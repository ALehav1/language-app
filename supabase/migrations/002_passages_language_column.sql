-- Migration: 002_passages_language_column.sql
-- Created: 2026-02-15
-- Purpose: Add target language column to saved_passages
-- Stores the user's learning mode when the passage was saved.
-- Default 'arabic' covers existing rows (app was Arabic-only before Spanish support).

ALTER TABLE saved_passages
ADD COLUMN language text NOT NULL DEFAULT 'arabic'
CHECK (language IN ('arabic', 'spanish'));
