# Database Migration Note

## ContentType Enum Update

**Date:** January 11, 2026  
**Scope:** Phase 1 - Canonical Vocabulary Model

### Changes

The `ContentType` enum has been updated to use consistent, canonical names:

**Old values:**
- `word` (unchanged)
- `phrase` → renamed to `sentence`
- `dialog` (unchanged)
- `paragraph` → renamed to `passage`

**New values:**
- `word`
- `sentence`
- `dialog`
- `passage`

### Database Impact

The following Supabase tables use the `content_type` column:
- `lessons`
- `vocabulary_items`
- `word_contexts` (if exists)

### Migration Strategy

**Compatibility Layer (Current Implementation):**
- Frontend code now uses canonical names (`sentence`, `passage`)
- Database may still contain old enum values (`phrase`, `paragraph`)
- Application reads both old and new values correctly
- New writes use canonical names going forward

**No immediate database migration required.** The application handles both old and new values transparently.

### Future Cleanup (Optional)

When ready to clean up old data:

```sql
-- Update lessons table
UPDATE lessons 
SET content_type = 'sentence' 
WHERE content_type = 'phrase';

UPDATE lessons 
SET content_type = 'passage' 
WHERE content_type = 'paragraph';

-- Update vocabulary_items table
UPDATE vocabulary_items 
SET content_type = 'sentence' 
WHERE content_type = 'phrase';

UPDATE vocabulary_items 
SET content_type = 'passage' 
WHERE content_type = 'paragraph';

-- Update word_contexts table (if exists)
UPDATE word_contexts 
SET content_type = 'sentence' 
WHERE content_type = 'phrase';

UPDATE word_contexts 
SET content_type = 'passage' 
WHERE content_type = 'paragraph';
```

### Testing

All existing unit tests updated to use canonical names. No test failures from this change.
