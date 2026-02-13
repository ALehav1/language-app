# Language Learning App - Data Architecture Documentation

**Generated:** January 13, 2026
**Version:** 1.0
**Purpose:** Complete reference for database schema, queries, state management, and data flows

---

## Table of Contents

1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [Table Relationships](#table-relationships)
4. [Query Patterns](#query-patterns)
5. [Data Access Layer](#data-access-layer)
6. [State Management](#state-management)
7. [Data Transformations](#data-transformations)
8. [localStorage Usage](#localstorage-usage)
9. [Performance Optimization](#performance-optimization)
10. [Data Migration History](#data-migration-history)

---

## Overview

The Language Learning App uses **Supabase PostgreSQL** as its primary database, with **localStorage** for client-side caching and progress persistence. The architecture emphasizes:

- **Explicit language filtering** (all queries filter by language)
- **Dialect support** (Egyptian Arabic primary, MSA secondary)
- **Enriched data** (Hebrew cognates, letter breakdown, memory aids)
- **Contextual learning** (words linked to source sentences)
- **Optimistic updates** (UI updates immediately, sync async)

### Data Flow Architecture

```
┌──────────────────────────────────────────────────────┐
│                   React Components                    │
│  (MyVocabularyView, ExerciseView, LookupView, etc.)  │
└───────────────────┬───────────────────────────────────┘
                    │ Uses custom hooks
                    ▼
┌──────────────────────────────────────────────────────┐
│                  Custom Hooks Layer                   │
│  useSavedWords, useExercise, useLessons, etc.        │
│                                                       │
│  Pattern:                                             │
│  - useState for local state                           │
│  - useCallback for operations                         │
│  - Optimistic updates                                 │
│  - Error handling                                     │
└───────────┬──────────────────────┬────────────────────┘
            │                      │
            ▼                      ▼
    ┌───────────────┐      ┌─────────────┐
    │  Domain Layer │      │   OpenAI    │
    │  (Adapters)   │      │  lib/openai │
    └───────┬───────┘      └──────┬──────┘
            │                     │
            ▼                     ▼
    ┌───────────────────────────────┐
    │      Supabase Client          │
    │      lib/supabase.ts          │
    └───────────────┬───────────────┘
                    │
                    ▼
    ┌───────────────────────────────┐
    │    PostgreSQL Database         │
    │    (Supabase-hosted)           │
    │                                │
    │  Tables:                       │
    │  - lessons                     │
    │  - vocabulary_items            │
    │  - saved_words                 │
    │  - word_contexts               │
    │  - lesson_progress             │
    │  - saved_sentences (planned)   │
    │  - saved_passages (planned)    │
    └────────────────────────────────┘
```

---

## Database Schema

### Core Tables (5 Active)

1. **lessons** - AI-generated lesson metadata
2. **vocabulary_items** - Lesson content (words, sentences, dialogs)
3. **saved_words** - User's vocabulary collection
4. **word_contexts** - Source sentences for saved words
5. **lesson_progress** - Completion tracking

### Planned Tables (2 Referenced, Not Migrated)

6. **saved_sentences** - Saved sentence collection
7. **saved_passages** - Saved passage collection

---

### 1. lessons

**Purpose:** Metadata for AI-generated lessons

**Schema:**
```sql
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  language TEXT NOT NULL CHECK (language IN ('arabic', 'spanish')),
  difficulty TEXT NOT NULL CHECK (difficulty IN ('new', 'learning', 'practiced', 'mastered')),
  content_type TEXT NOT NULL CHECK (content_type IN ('word', 'sentence', 'dialog', 'passage')),
  estimated_minutes INTEGER NOT NULL DEFAULT 5,
  vocab_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lessons_language ON lessons(language);
CREATE INDEX idx_lessons_created ON lessons(created_at DESC);
```

**TypeScript Interface:**
```typescript
interface DbLesson {
  id: string;
  title: string;
  description: string;
  language: Language; // 'arabic' | 'spanish'
  difficulty: MasteryLevel; // 'new' | 'learning' | 'practiced' | 'mastered'
  content_type: ContentType; // 'word' | 'sentence' | 'dialog' | 'passage'
  estimated_minutes: number;
  vocab_count: number;
  created_at: string;
}
```

**Example Row:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Greetings & Introductions",
  "description": "Learn essential Arabic greetings and how to introduce yourself in everyday conversations.",
  "language": "arabic",
  "difficulty": "new",
  "content_type": "word",
  "estimated_minutes": 5,
  "vocab_count": 5,
  "created_at": "2026-01-13T10:30:00Z"
}
```

**Relationships:**
- → `vocabulary_items` (one-to-many, CASCADE DELETE)
- → `lesson_progress` (one-to-many, CASCADE DELETE)

**Queries:**
- **Fetch all lessons (filtered):** By language, newest first
- **Fetch single lesson:** By ID
- **Insert new lesson:** After AI generation
- **Delete lesson:** Cascade deletes vocabulary_items

**Components Using:**
- `LessonLibrary.tsx` - Display lesson cards
- `LessonGenerator.tsx` - Insert new lessons
- `ExerciseView.tsx` - Fetch lesson metadata

**Average Row Size:** 200 bytes
**Growth Rate:** 1-2 lessons/week per user

---

### 2. vocabulary_items

**Purpose:** Content items within lessons (words, sentences, dialogs)

**Schema:**
```sql
CREATE TABLE vocabulary_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  translation TEXT NOT NULL,
  language TEXT NOT NULL CHECK (language IN ('arabic', 'spanish')),
  content_type TEXT NOT NULL DEFAULT 'word'
    CHECK (content_type IN ('word', 'sentence', 'dialog', 'passage')),
  transliteration TEXT,
  hebrew_cognate JSONB,
  letter_breakdown JSONB,
  mastery_level TEXT NOT NULL DEFAULT 'new'
    CHECK (mastery_level IN ('new', 'learning', 'practiced', 'mastered')),
  last_reviewed TIMESTAMPTZ,
  next_review TIMESTAMPTZ,
  times_practiced INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vocab_lesson ON vocabulary_items(lesson_id);
CREATE INDEX idx_vocab_language ON vocabulary_items(language);
```

**TypeScript Interface:**
```typescript
interface DbVocabularyItem {
  id: string;
  lesson_id: string;
  word: string;
  translation: string;
  language: Language;
  content_type: ContentType;
  transliteration?: string;
  hebrew_cognate?: HebrewCognate | null;
  letter_breakdown?: LetterBreakdown[] | null;
  mastery_level: MasteryLevel;
  last_reviewed: string | null;
  next_review: string | null;
  times_practiced: number;
  created_at: string;
}

interface HebrewCognate {
  root?: string;
  meaning?: string;
  notes?: string;
}

interface LetterBreakdown {
  letter: string;
  name: string;
  sound: string;
}
```

**Example Rows:**
```json
[
  {
    "id": "uuid-1",
    "lesson_id": "550e8400-e29b-41d4-a716-446655440000",
    "word": "مرحبا",
    "translation": "hello",
    "language": "arabic",
    "content_type": "word",
    "transliteration": "marhaba",
    "hebrew_cognate": {
      "root": "ברוך",
      "meaning": "blessing/welcome",
      "notes": "Similar greeting pattern in Hebrew"
    },
    "letter_breakdown": [
      {"letter": "م", "name": "meem", "sound": "m"},
      {"letter": "ر", "name": "raa", "sound": "r"},
      {"letter": "ح", "name": "haa", "sound": "h"},
      {"letter": "ب", "name": "baa", "sound": "b"},
      {"letter": "ا", "name": "alif", "sound": "a"}
    ],
    "mastery_level": "new",
    "times_practiced": 0,
    "created_at": "2026-01-13T10:30:00Z"
  },
  {
    "id": "uuid-2",
    "lesson_id": "550e8400-e29b-41d4-a716-446655440000",
    "word": "شكرا",
    "translation": "thank you",
    "language": "arabic",
    "content_type": "word",
    "transliteration": "shukran",
    "hebrew_cognate": {
      "root": "שכר",
      "meaning": "reward/payment",
      "notes": "Shares same Semitic root"
    },
    "mastery_level": "new",
    "times_practiced": 0,
    "created_at": "2026-01-13T10:30:00Z"
  }
]
```

**Relationships:**
- ← `lessons` (many-to-one)
- → `word_contexts` (one-to-many, SET NULL)

**Queries:**
- **Fetch lesson content:** By lesson_id
- **Update mastery:** After practice (times_practiced, mastery_level)
- **Batch insert:** During lesson generation
- **Filter by language:** Always included

**Components Using:**
- `ExerciseView.tsx` - Fetch items for practice
- `useExercise.ts` - Update mastery levels
- `useLessonProgress.ts` - Track completion

**Average Row Size:** 500 bytes (with JSONB)
**Growth Rate:** 5-10 items per lesson

---

### 3. saved_words

**Purpose:** User's personal vocabulary collection with memory aids

**Schema:**
```sql
CREATE TABLE saved_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Word data
  word TEXT NOT NULL UNIQUE,
  translation TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'arabic',

  -- Dialect-specific pronunciations
  pronunciation_standard TEXT,     -- MSA/Fusha
  pronunciation_egyptian TEXT,      -- Egyptian Arabic

  -- Learning metadata (JSONB)
  letter_breakdown JSONB,
  hebrew_cognate JSONB,
  example_sentences JSONB,

  -- Organization
  topic TEXT,
  tags TEXT[],

  -- Review status
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'learned')),
  times_practiced INTEGER DEFAULT 0,
  times_correct INTEGER DEFAULT 0,
  last_practiced TIMESTAMPTZ,
  next_review TIMESTAMPTZ,

  -- Memory aids (Phase 16)
  memory_note TEXT,
  memory_image_url TEXT,  -- ⚠️ Currently base64, should be URL

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_saved_words_status ON saved_words(status);
CREATE INDEX idx_saved_words_topic ON saved_words(topic);
CREATE INDEX idx_saved_words_created ON saved_words(created_at DESC);
CREATE INDEX idx_saved_words_word ON saved_words(word);
CREATE INDEX idx_saved_words_language ON saved_words(language);

-- Full-text search
CREATE INDEX idx_saved_words_search ON saved_words
  USING gin(to_tsvector('simple', word || ' ' || translation));
```

**TypeScript Interface:**
```typescript
interface SavedWord {
  id: string;
  word: string;
  translation: string;
  language: Language;

  pronunciation_standard: string | null;
  pronunciation_egyptian: string | null;

  letter_breakdown: LetterBreakdown[] | null;
  hebrew_cognate: HebrewCognate | null;
  example_sentences: ExampleSentence[] | null;

  topic: string | null;
  tags: string[] | null;

  status: WordStatus; // 'active' | 'learned'
  times_practiced: number;
  times_correct: number;
  last_practiced: string | null;
  next_review: string | null;

  memory_note: string | null;
  memory_image_url: string | null;

  created_at: string;
  updated_at: string;
}

interface ExampleSentence {
  arabic_msa: string;
  transliteration_msa: string;
  arabic_egyptian: string;
  transliteration_egyptian: string;
  english: string;
  explanation?: string;
}
```

**Example Row:**
```json
{
  "id": "uuid-word-1",
  "word": "مرحبا",
  "translation": "hello",
  "language": "arabic",
  "pronunciation_standard": "marhaba",
  "pronunciation_egyptian": "marhaba",
  "letter_breakdown": [...],
  "hebrew_cognate": {...},
  "example_sentences": [
    {
      "arabic_msa": "مرحبا بك في مصر",
      "transliteration_msa": "marhaban bika fi misr",
      "arabic_egyptian": "أهلا بيك في مصر",
      "transliteration_egyptian": "ahlan beek fi masr",
      "english": "Welcome to Egypt",
      "explanation": "Egyptian version more casual"
    }
  ],
  "topic": "greetings",
  "tags": ["essential", "beginner"],
  "status": "active",
  "times_practiced": 5,
  "times_correct": 4,
  "last_practiced": "2026-01-12T14:30:00Z",
  "memory_note": "Sounds like 'mar-ha-ba', think of Mar-velous Harbor!",
  "memory_image_url": "data:image/png;base64,iVBORw0KG...", // ⚠️ Should be URL
  "created_at": "2026-01-10T10:00:00Z",
  "updated_at": "2026-01-12T14:30:00Z"
}
```

**Relationships:**
- → `word_contexts` (one-to-many, CASCADE DELETE)

**Queries:**
- **Fetch user vocabulary:** Filter by status, topic, language
- **Search words:** Full-text search on word + translation
- **Update status:** Practice → Archive or vice versa
- **Update memory aids:** Note and image URL
- **Update practice stats:** times_practiced, times_correct
- **Delete word:** Cascade deletes contexts

**Components Using:**
- `MyVocabularyView.tsx` - Display and manage words
- `ExerciseView.tsx` - Check if word already saved
- `LookupView.tsx` - Save new words
- `useSavedWords.ts` - CRUD operations

**Average Row Size:** 2-5 KB (large due to base64 images)
**Growth Rate:** 5-10 words/week per user
**⚠️ Performance Issue:** Images stored as base64 (see optimization section)

---

### 4. word_contexts

**Purpose:** Track where each saved word was encountered (source sentences)

**Schema:**
```sql
CREATE TABLE word_contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  saved_word_id UUID REFERENCES saved_words(id) ON DELETE CASCADE,

  -- Context data
  content_type TEXT NOT NULL
    CHECK (content_type IN ('word', 'sentence', 'dialog', 'passage', 'lookup')),
  full_text TEXT NOT NULL,
  full_transliteration TEXT,
  full_translation TEXT NOT NULL,

  -- Dialog-specific
  speaker TEXT,
  dialog_context TEXT,

  -- Source reference (optional)
  lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
  vocabulary_item_id UUID REFERENCES vocabulary_items(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_word_contexts_word ON word_contexts(saved_word_id);
```

**TypeScript Interface:**
```typescript
interface WordContext {
  id: string;
  saved_word_id: string;

  content_type: ContentType | 'lookup';
  full_text: string;
  full_transliteration: string | null;
  full_translation: string;

  speaker: string | null;
  dialog_context: string | null;

  lesson_id: string | null;
  vocabulary_item_id: string | null;

  created_at: string;
}
```

**Example Rows:**
```json
[
  {
    "id": "uuid-ctx-1",
    "saved_word_id": "uuid-word-1",
    "content_type": "sentence",
    "full_text": "مرحبا بك في مصر",
    "full_transliteration": "marhaban bika fi misr",
    "full_translation": "Welcome to Egypt",
    "speaker": null,
    "dialog_context": null,
    "lesson_id": "550e8400-e29b-41d4-a716-446655440000",
    "vocabulary_item_id": "uuid-1",
    "created_at": "2026-01-10T10:00:00Z"
  },
  {
    "id": "uuid-ctx-2",
    "saved_word_id": "uuid-word-1",
    "content_type": "lookup",
    "full_text": "مرحبا",
    "full_transliteration": "marhaba",
    "full_translation": "hello",
    "lesson_id": null,
    "vocabulary_item_id": null,
    "created_at": "2026-01-11T15:00:00Z"
  }
]
```

**Relationships:**
- ← `saved_words` (many-to-one)
- ← `lessons` (optional, many-to-one)
- ← `vocabulary_items` (optional, many-to-one)

**Queries:**
- **Fetch contexts for word:** By saved_word_id
- **Batch fetch:** For multiple words (IN clause)
- **Insert context:** When saving word from lesson/lookup

**Components Using:**
- `MyVocabularyView.tsx` - Display "Found In" section
- `WordDetailModal.tsx` - Show all contexts
- `useSavedWords.ts` - Insert when saving words

**Average Row Size:** 300 bytes
**Growth Rate:** 1-3 contexts per word

---

### 5. lesson_progress

**Purpose:** Track lesson completion and scores

**Schema:**
```sql
CREATE TABLE lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  language TEXT NOT NULL CHECK (language IN ('arabic', 'spanish')),
  completed_date TIMESTAMPTZ DEFAULT NOW(),
  score INTEGER,
  items_practiced INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_progress_lesson ON lesson_progress(lesson_id);
```

**TypeScript Interface:**
```typescript
interface LessonProgress {
  id: string;
  lesson_id: string;
  language: Language;
  completed_date: string;
  score: number | null;
  items_practiced: number;
  created_at: string;
}
```

**Example Row:**
```json
{
  "id": "uuid-progress-1",
  "lesson_id": "550e8400-e29b-41d4-a716-446655440000",
  "language": "arabic",
  "completed_date": "2026-01-13T11:00:00Z",
  "score": 85,
  "items_practiced": 7,
  "created_at": "2026-01-13T11:00:00Z"
}
```

**Relationships:**
- ← `lessons` (many-to-one)

**Queries:**
- **Insert on completion:** After finishing lesson
- **Fetch history:** By user (NOT IMPLEMENTED - no user_id yet)
- **Analytics:** Aggregate scores, completion rates

**Components Using:**
- `useLessonProgress.ts` - Insert completion records
- `ExerciseView.tsx` - Save on lesson complete

**Average Row Size:** 100 bytes
**Growth Rate:** 1-2 per lesson per user

**⚠️ Note:** Currently no user_id column (multi-user not supported)

---

## Table Relationships

### Entity-Relationship Diagram

```
┌─────────────────┐
│    lessons      │
│  (AI-generated) │
└────────┬────────┘
         │
         │ 1:N (CASCADE DELETE)
         │
         ▼
┌─────────────────────┐
│ vocabulary_items    │
│ (Lesson content)    │
└──────┬─────────┬────┘
       │         │
       │         │ 1:N (SET NULL)
       │         ▼
       │    ┌─────────────────┐
       │    │ word_contexts   │◄───────┐
       │    │ (Source refs)   │        │
       │    └─────────────────┘        │
       │                                │
       │ 1:N (CASCADE DELETE)           │ N:1 (CASCADE DELETE)
       │                                │
       ▼                                │
┌─────────────────┐                    │
│ lesson_progress │                    │
│ (Completions)   │                    │
└─────────────────┘                    │
                                       │
                                       │
                              ┌────────┴─────────┐
                              │  saved_words     │
                              │ (User vocabulary)│
                              └──────────────────┘
```

### Cascade Behaviors

| Parent Table | Child Table | On Delete |
|--------------|-------------|-----------|
| lessons | vocabulary_items | CASCADE |
| lessons | lesson_progress | CASCADE |
| lessons | word_contexts | SET NULL |
| saved_words | word_contexts | CASCADE |
| vocabulary_items | word_contexts | SET NULL |

**Implications:**
- Deleting a lesson removes all its vocabulary and progress
- Deleting a saved word removes all its contexts
- If source lesson/item is deleted, context remains but reference is NULL

---

## Query Patterns

### 1. Fetch All Lessons (Filtered)

**Use Case:** Display lesson library
**Component:** `LessonLibrary.tsx`
**Hook:** `useLessons()`

```typescript
const { data, error } = await supabase
  .from('lessons')
  .select('*')
  .eq('language', 'arabic')
  .order('created_at', { ascending: false });
```

**Performance:**
- Index used: `idx_lessons_language`, `idx_lessons_created`
- Typical row count: 10-50
- Query time: 50-150ms

---

### 2. Fetch Lesson with Vocabulary

**Use Case:** Start exercise
**Component:** `ExerciseView.tsx`
**Hook:** `useVocabulary()`

```typescript
// Fetch lesson metadata
const { data: lesson } = await supabase
  .from('lessons')
  .select('*')
  .eq('id', lessonId)
  .single();

// Fetch vocabulary items
const { data: items } = await supabase
  .from('vocabulary_items')
  .select('*')
  .eq('lesson_id', lessonId);
```

**Performance:**
- Index used: Primary key (lesson), `idx_vocab_lesson` (items)
- Typical row count: 1 lesson + 5-10 items
- Query time: 100-300ms

---

### 3. Fetch Saved Words with Contexts

**Use Case:** My Vocabulary view
**Component:** `MyVocabularyView.tsx`
**Hook:** `useSavedWords()`

```typescript
// Fetch words (filtered)
let query = supabase
  .from('saved_words')
  .select('*')
  .eq('language', 'arabic')
  .order('created_at', { ascending: false });

if (status !== 'all') {
  query = query.eq('status', status);
}

const { data: words } = await query;

// Fetch contexts for all words
const wordIds = words.map(w => w.id);
const { data: contexts } = await supabase
  .from('word_contexts')
  .select('*')
  .in('saved_word_id', wordIds);

// Combine in JavaScript
const wordsWithContexts = words.map(word => ({
  ...word,
  contexts: contexts.filter(c => c.saved_word_id === word.id)
}));
```

**Performance:**
- Index used: `idx_saved_words_language`, `idx_saved_words_created`, `idx_word_contexts_word`
- Typical row count: 50 words + 100 contexts
- Query time: 400-1200ms
- **⚠️ Bottleneck:** Large base64 images increase payload size

**Optimization:**
```typescript
// Better: Paginate
const { data: words } = await supabase
  .from('saved_words')
  .select('*')
  .eq('language', 'arabic')
  .range(offset, offset + 19)
  .limit(20);

// Best: Lazy load contexts on modal open (not in list view)
```

---

### 4. Search Saved Words

**Use Case:** Search bar in My Vocabulary
**Component:** `MyVocabularyView.tsx`

```typescript
const searchTerm = `%${query}%`;

const { data } = await supabase
  .from('saved_words')
  .select('*')
  .eq('language', 'arabic')
  .or(`word.ilike.${searchTerm},translation.ilike.${searchTerm}`);
```

**Performance:**
- Index used: `idx_saved_words_search` (GIN full-text)
- Query time: 200-500ms
- **Note:** Should debounce input (300ms)

---

### 5. Insert Lesson with Vocabulary (Transaction)

**Use Case:** AI lesson generation
**Component:** `LessonGenerator.tsx`

```typescript
// 1. Insert lesson
const { data: lesson, error } = await supabase
  .from('lessons')
  .insert({
    title,
    description,
    language: 'arabic',
    difficulty: 'new',
    content_type: 'word',
    estimated_minutes: 5,
    vocab_count: vocabItems.length
  })
  .select()
  .single();

// 2. Batch insert vocabulary items
const itemsToInsert = vocabItems.map(item => ({
  lesson_id: lesson.id,
  word: item.word,
  translation: item.translation,
  language: 'arabic',
  transliteration: item.transliteration,
  hebrew_cognate: item.hebrew_cognate,
  letter_breakdown: item.letter_breakdown
}));

const { error: vocabError } = await supabase
  .from('vocabulary_items')
  .insert(itemsToInsert);
```

**Performance:**
- Insert time: 500-1000ms (7-10 items)
- **Note:** Not a true transaction (if vocab fails, lesson remains)

**Better Approach:**
```sql
-- Use PostgreSQL transaction via RPC function
CREATE OR REPLACE FUNCTION create_lesson_with_vocab(...)
RETURNS JSON AS $$
BEGIN
  -- Insert lesson
  -- Insert vocabulary
  RETURN json_build_object('lesson_id', ...);
END;
$$ LANGUAGE plpgsql;
```

---

### 6. Save Word with Context (Upsert)

**Use Case:** Save word from lookup or exercise
**Component:** `LookupView.tsx`, `ExerciseView.tsx`
**Hook:** `useSavedWords.saveWord()`

```typescript
// Check if exists
const { data: existing } = await supabase
  .from('saved_words')
  .select('id')
  .eq('word', wordData.word)
  .single();

if (existing) {
  // Update existing
  await supabase
    .from('saved_words')
    .update({
      translation: wordData.translation,
      status: wordData.status,
      memory_note: wordData.memory_note,
      updated_at: new Date().toISOString()
    })
    .eq('id', existing.id);

  savedWordId = existing.id;
} else {
  // Insert new
  const { data } = await supabase
    .from('saved_words')
    .insert(wordData)
    .select()
    .single();

  savedWordId = data.id;
}

// Insert context
await supabase
  .from('word_contexts')
  .insert({
    saved_word_id: savedWordId,
    content_type: contextData.content_type,
    full_text: contextData.full_text,
    full_translation: contextData.full_translation,
    lesson_id: contextData.lesson_id
  });
```

**Performance:**
- Check: 100-200ms
- Insert/Update: 150-300ms
- Context insert: 100-200ms
- Total: 350-700ms

**⚠️ Race Condition:** Check then insert can fail if concurrent requests

**Better Approach:**
```typescript
// Use UPSERT
const { data } = await supabase
  .from('saved_words')
  .upsert(wordData, { onConflict: 'word' })
  .select()
  .single();
```

---

### 7. Update Mastery Level

**Use Case:** After practicing a word
**Component:** `ExerciseView.tsx`
**Hook:** `useLessonProgress.updateVocabularyMastery()`

```typescript
await supabase
  .from('vocabulary_items')
  .update({
    times_practiced: times_practiced + 1,
    last_reviewed: new Date().toISOString(),
    mastery_level: calculateMasteryLevel(times_practiced, accuracy)
  })
  .eq('id', itemId);
```

**Mastery Calculation:**
```typescript
function calculateMasteryLevel(
  timesPracticed: number,
  correctRate: number
): MasteryLevel {
  if (timesPracticed >= 5 && correctRate >= 0.8) {
    return 'mastered';
  } else if (timesPracticed >= 3) {
    return 'practiced';
  } else if (timesPracticed >= 1) {
    return 'learning';
  }
  return 'new';
}
```

---

### 8. Delete Word (Cascade)

**Use Case:** Remove word from vocabulary
**Component:** `MyVocabularyView.tsx`
**Hook:** `useSavedWords.deleteWord()`

```typescript
const { error } = await supabase
  .from('saved_words')
  .delete()
  .eq('id', wordId);

// Automatically deletes word_contexts due to CASCADE
```

**Performance:**
- Delete time: 100-200ms
- Cascade: Handled by database

---

## Data Access Layer

### Custom Hooks Pattern

All data access follows this pattern:

```typescript
function useDataHook(options?: FilterOptions) {
  const [data, setData] = useState<DataType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch function
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase.from('table').select('*');

      // Apply filters
      if (options?.filter) {
        query = query.eq('field', options.filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setData(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [options?.filter]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // CRUD operations
  const createItem = useCallback(async (item: CreateData) => {
    const { data, error } = await supabase
      .from('table')
      .insert(item)
      .select()
      .single();

    if (error) throw error;

    // Optimistic update
    setData(prev => [...prev, data]);

    return data;
  }, []);

  const updateItem = useCallback(async (id: string, updates: Partial<DataType>) => {
    // Optimistic update
    setData(prev => prev.map(item =>
      item.id === id ? { ...item, ...updates } : item
    ));

    try {
      const { error } = await supabase
        .from('table')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      // Rollback on error
      await fetchData();
      throw err;
    }
  }, [fetchData]);

  const deleteItem = useCallback(async (id: string) => {
    // Optimistic update
    setData(prev => prev.filter(item => item.id !== id));

    try {
      const { error } = await supabase
        .from('table')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      // Rollback
      await fetchData();
      throw err;
    }
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    createItem,
    updateItem,
    deleteItem,
    refetch: fetchData
  };
}
```

---

### Hook Inventory

| Hook | Purpose | Tables Accessed | Components Using |
|------|---------|-----------------|------------------|
| `useLessons` | Fetch lessons | lessons | LessonLibrary |
| `useVocabulary` | Fetch vocabulary items | vocabulary_items, saved_words | ExerciseView |
| `useSavedWords` | CRUD saved vocabulary | saved_words, word_contexts | MyVocabularyView, LookupView |
| `useExercise` | Exercise state machine | (via useVocabulary) | ExerciseView |
| `useLessonProgress` | Track completion | lesson_progress | ExerciseView |
| `useSavedSentences` | Saved sentences (planned) | saved_sentences | MySentencesView |
| `useSavedPassages` | Saved passages (planned) | saved_passages | MyPassagesView |

---

## State Management

### Global State (Context)

**LanguageContext:**
```typescript
// src/contexts/LanguageContext.tsx
interface LanguageContextValue {
  language: Language; // 'arabic' | 'spanish'
  setLanguage: (lang: Language) => void;
}

const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    return localStorage.getItem('language-app-selected-language') || 'arabic';
  });

  useEffect(() => {
    localStorage.setItem('language-app-selected-language', language);
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};
```

**Usage:**
- Filters all database queries by language
- Determines UI features (cognates for Arabic only)
- Drives OpenAI prompt generation

---

### Local State (Hooks)

**Exercise State:**
```typescript
// useExercise.ts
interface ExerciseState {
  phase: 'prompting' | 'feedback' | 'complete';
  queue: string[]; // Item IDs in practice order
  currentPos: number; // Position in queue
  answers: AnswerResult[];
  isValidating: boolean;
}
```

**Vocabulary State:**
```typescript
// useSavedWords.ts
interface VocabularyState {
  words: SavedWordWithContexts[];
  loading: boolean;
  error: string | null;
}
```

---

### Optimistic Updates

**Pattern:**
1. Update local state immediately
2. Perform async operation
3. On error: rollback or refetch

**Example:**
```typescript
const updateStatus = async (id: string, newStatus: WordStatus) => {
  // 1. Optimistic update
  setWords(prev => prev.map(w =>
    w.id === id ? { ...w, status: newStatus } : w
  ));

  try {
    // 2. Sync to database
    await supabase
      .from('saved_words')
      .update({ status: newStatus })
      .eq('id', id);
  } catch (err) {
    // 3. Rollback on error
    await fetchWords();
    throw err;
  }
};
```

---

## Data Transformations

### Domain Layer (PracticeItem)

**Purpose:** Abstract away source (lesson vs saved words) for practice sessions

**Adapter Functions:**
```typescript
// src/domain/practice/fromVocabularyItems.ts
export function fromVocabularyItems(
  items: VocabularyItem[]
): PracticeItem[] {
  return items.map(item => ({
    id: item.id,
    language: item.language,
    contentType: item.content_type,
    targetText: item.word,
    translation: item.translation,
    transliteration: item.transliteration,
    promptType: determinePromptType(item),
    answerType: determineAnswerType(item),
    masteryLevelRaw: item.mastery_level,
    timesPracticed: item.times_practiced,
    letterBreakdown: item.letter_breakdown,
    hebrewCognate: item.hebrew_cognate,
    origin: {
      source: 'vocabulary_item',
      lessonId: item.lesson_id
    },
    createdAt: item.created_at
  }));
}
```

```typescript
// src/domain/practice/fromSavedWords.ts
export function fromSavedWords(
  words: SavedWord[]
): PracticeItem[] {
  return words.map(word => ({
    id: word.id,
    language: word.language,
    contentType: 'word', // Saved words are always single words
    targetText: word.word,
    translation: word.translation,
    transliteration: word.pronunciation_standard,
    promptType: 'show_translation',
    answerType: 'type_target',
    masteryLevelRaw: calculateMastery(word),
    timesPracticed: word.times_practiced,
    letterBreakdown: word.letter_breakdown,
    hebrewCognate: word.hebrew_cognate,
    exampleSentences: word.example_sentences,
    memoryNote: word.memory_note,
    memoryImageUrl: word.memory_image_url,
    origin: {
      source: 'saved_word'
    },
    createdAt: word.created_at
  }));
}
```

**Usage in ExerciseView:**
```typescript
const { vocabulary } = useVocabulary({
  lessonId: isSavedPractice ? undefined : lessonId,
  itemIds: savedItemIds,
  fromSavedWords: isSavedPractice
});

// vocabulary is now PracticeItem[] regardless of source
```

---

## localStorage Usage

### Keys and Contents

| Key | Content | Max Size | Lifetime | Purpose |
|-----|---------|----------|----------|---------|
| `language-app-selected-language` | 'arabic' \| 'spanish' | 10 B | Permanent | Global language selection |
| `exercise-progress-{lessonId}` | SavedProgressV2 | 5 KB | 24 hours | Resume lesson |
| `egyptian-inference-cache` | MSA→Egyptian map | 50 KB | Permanent | Cache translations |
| `language-app-dialect-preference` | 'egyptian' \| 'standard' | 10 B | Permanent | Display preference |

---

### SavedProgressV2 Schema

```typescript
interface SavedProgressV2 {
  version: 2;
  queue: string[];           // Remaining item IDs
  currentPos: number;        // Position in queue
  answers: AnswerResult[];   // Completed answers
  savedAt: number;           // Timestamp (ms)
}
```

**Example:**
```json
{
  "version": 2,
  "queue": ["id3", "id4", "id5", "id6", "id7"],
  "currentPos": 0,
  "answers": [
    {
      "itemId": "id1",
      "correct": true,
      "userAnswer": "marhaba",
      "correctAnswer": "مرحبا"
    },
    {
      "itemId": "id2",
      "correct": false,
      "userAnswer": "shokran",
      "correctAnswer": "شكرا"
    }
  ],
  "savedAt": 1705147200000
}
```

**Persistence Logic:**
```typescript
// Save after each answer
saveProgress(lessonId, queue, currentPos, answers);

// Load on exercise start
const saved = loadSavedProgress(lessonId);

// Hydrate (migrate V1 → V2 if needed)
const progress = hydrateProgress(saved, vocabItems);

// Clear on completion or start fresh
clearSavedProgress(lessonId);
```

---

### Egyptian Inference Cache

**Purpose:** Cache MSA → Egyptian conversions to avoid redundant API calls

**Schema:**
```typescript
interface EgyptianCache {
  [msaWord: string]: {
    egyptian: string;
    confidence: 'high' | 'medium' | 'low';
    source: 'api' | 'dictionary' | 'inference';
    timestamp: number;
  }
}
```

**Example:**
```json
{
  "كيف حالك": {
    "egyptian": "ازيك",
    "confidence": "high",
    "source": "dictionary",
    "timestamp": 1705147200000
  },
  "أنا بخير": {
    "egyptian": "أنا بخير",
    "confidence": "high",
    "source": "inference",
    "timestamp": 1705147200000
  }
}
```

**Usage:**
```typescript
// src/utils/egyptianInference.ts
const cache = JSON.parse(
  localStorage.getItem('egyptian-inference-cache') || '{}'
);

if (cache[msaWord]) {
  return cache[msaWord].egyptian;
}

// Generate and cache
const egyptian = await generateEgyptianVariant(msaWord);
cache[msaWord] = {
  egyptian,
  confidence: 'medium',
  source: 'api',
  timestamp: Date.now()
};

localStorage.setItem('egyptian-inference-cache', JSON.stringify(cache));
```

---

## Performance Optimization

### Current Bottlenecks

1. **Memory Aid Images (Critical)**
   - **Problem:** 300KB-500KB base64 per word
   - **Impact:** 100 words = 30-50MB database + network
   - **Solution:** Migrate to Supabase Storage

2. **No Pagination (High)**
   - **Problem:** Load all saved words at once
   - **Impact:** 1000 words = 5MB+ payload, 10s+ load time
   - **Solution:** Implement cursor-based pagination

3. **Redundant API Calls (Medium)**
   - **Problem:** Same word looked up multiple times
   - **Impact:** Unnecessary costs ($0.01 per lookup)
   - **Solution:** Cache translations in database or localStorage

4. **Search Without Debounce (Medium)**
   - **Problem:** Query on every keystroke
   - **Impact:** Database overload, poor UX
   - **Solution:** 300ms debounce

---

### Optimization Strategies

#### 1. Image Storage Migration

**Current:**
```typescript
// Stored as base64 in database
memory_image_url: 'data:image/png;base64,iVBORw0KG...' // 300KB
```

**Target:**
```typescript
// Upload to Supabase Storage
const blob = await fetch(base64Url).then(r => r.blob());
const { data } = await supabase.storage
  .from('memory-images')
  .upload(`${wordId}.png`, blob);

// Store URL (50 bytes)
memory_image_url: 'https://[project].supabase.co/storage/v1/object/public/memory-images/uuid.png'
```

**Migration Script:**
```typescript
async function migrateImages() {
  const { data: words } = await supabase
    .from('saved_words')
    .select('id, memory_image_url')
    .not('memory_image_url', 'is', null)
    .like('memory_image_url', 'data:image/%');

  for (const word of words) {
    // Convert base64 to blob
    const response = await fetch(word.memory_image_url);
    const blob = await response.blob();

    // Upload to storage
    const { data } = await supabase.storage
      .from('memory-images')
      .upload(`${word.id}.png`, blob);

    // Update database
    await supabase
      .from('saved_words')
      .update({ memory_image_url: data.publicUrl })
      .eq('id', word.id);
  }
}
```

**Benefits:**
- 99% reduction in database size
- 90% reduction in network payload
- Faster queries (no large JSONB)
- CDN caching (Supabase Storage uses CDN)

---

#### 2. Pagination

**Current:**
```typescript
// Load all words
const { data } = await supabase
  .from('saved_words')
  .select('*')
  .eq('language', 'arabic');
// Returns 1000 words = 5MB
```

**Optimized:**
```typescript
// Cursor-based pagination
const PAGE_SIZE = 20;

const { data } = await supabase
  .from('saved_words')
  .select('*')
  .eq('language', 'arabic')
  .order('created_at', { ascending: false })
  .range(offset, offset + PAGE_SIZE - 1);

// UI: "Load more" button or infinite scroll
```

**Benefits:**
- Initial load: 100KB (20 words) instead of 5MB
- Load time: 500ms instead of 10s
- Better UX on slow connections

---

#### 3. Lazy Loading Contexts

**Current:**
```typescript
// Fetch contexts for ALL words upfront
const { data: words } = await supabase.from('saved_words').select('*');
const { data: contexts } = await supabase
  .from('word_contexts')
  .select('*')
  .in('saved_word_id', words.map(w => w.id));
```

**Optimized:**
```typescript
// Only fetch contexts when modal opens
const WordDetailModal = ({ word }) => {
  const [contexts, setContexts] = useState([]);

  useEffect(() => {
    const fetchContexts = async () => {
      const { data } = await supabase
        .from('word_contexts')
        .select('*')
        .eq('saved_word_id', word.id);
      setContexts(data);
    };
    fetchContexts();
  }, [word.id]);

  return (
    <div>
      {/* Display word */}
      {/* Display contexts when loaded */}
    </div>
  );
};
```

**Benefits:**
- 50% reduction in initial query size
- Contexts only loaded when needed
- Better perceived performance

---

#### 4. Search Debouncing

**Current:**
```typescript
<input
  value={searchQuery}
  onChange={(e) => {
    setSearchQuery(e.target.value);
    fetchWords(); // Called on every keystroke
  }}
/>
```

**Optimized:**
```typescript
const [searchQuery, setSearchQuery] = useState('');
const [debouncedQuery, setDebouncedQuery] = useState('');

useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedQuery(searchQuery);
  }, 300);

  return () => clearTimeout(timer);
}, [searchQuery]);

// Fetch only when debouncedQuery changes
useEffect(() => {
  fetchWords(debouncedQuery);
}, [debouncedQuery]);
```

**Benefits:**
- 90% reduction in queries (10 keystrokes → 1 query)
- Less database load
- Better UX

---

#### 5. Query Result Caching

**Use Case:** Same word looked up multiple times

**Implementation:**
```typescript
const lookupCache = new Map<string, LookupResult>();

async function lookupWord(word: string, options: LookupOptions): Promise<LookupResult> {
  const cacheKey = `${word}:${options.language}`;

  // Check cache
  if (lookupCache.has(cacheKey)) {
    return lookupCache.get(cacheKey)!;
  }

  // Call API
  const result = await openai.chat.completions.create(...);

  // Cache result
  lookupCache.set(cacheKey, result);

  // Optionally: persist to database or localStorage
  await supabase.from('translation_cache').insert({
    word,
    language: options.language,
    result: JSON.stringify(result)
  });

  return result;
}
```

**Benefits:**
- Instant results for repeated lookups
- Cost savings ($0.01 per lookup)
- Better offline support

---

### Index Strategy

**Existing Indexes:**
```sql
-- lessons
CREATE INDEX idx_lessons_language ON lessons(language);
CREATE INDEX idx_lessons_created ON lessons(created_at DESC);

-- vocabulary_items
CREATE INDEX idx_vocab_lesson ON vocabulary_items(lesson_id);
CREATE INDEX idx_vocab_language ON vocabulary_items(language);

-- saved_words
CREATE INDEX idx_saved_words_status ON saved_words(status);
CREATE INDEX idx_saved_words_topic ON saved_words(topic);
CREATE INDEX idx_saved_words_created ON saved_words(created_at DESC);
CREATE INDEX idx_saved_words_word ON saved_words(word);
CREATE INDEX idx_saved_words_language ON saved_words(language);
CREATE INDEX idx_saved_words_search ON saved_words
  USING gin(to_tsvector('simple', word || ' ' || translation));

-- word_contexts
CREATE INDEX idx_word_contexts_word ON word_contexts(saved_word_id);

-- lesson_progress
CREATE INDEX idx_progress_lesson ON lesson_progress(lesson_id);
```

**Recommended Additional Indexes:**
```sql
-- Composite index for common query
CREATE INDEX idx_saved_words_language_status
  ON saved_words(language, status);

-- Partial index for active words only
CREATE INDEX idx_saved_words_active
  ON saved_words(language, created_at DESC)
  WHERE status = 'active';
```

---

## Data Migration History

### Migration Files

Located in `/supabase/migrations/`

| File | Date | Purpose |
|------|------|---------|
| `001_initial_schema.sql` | 2026-01-04 | Initial tables (lessons, vocabulary_items) |
| `002_fresh_schema.sql` | 2026-01-05 | Drop and recreate (reset) |
| `003_fix_hebrew_cognates.sql` | 2026-01-06 | Fix JSONB structure |
| `004_saved_vocabulary.sql` | 2026-01-07 | Add saved_vocabulary table (deprecated) |
| `005_add_letter_breakdown.sql` | 2026-01-08 | Add letter_breakdown column |
| `006_add_content_type.sql` | 2026-01-09 | Add content_type enum |
| `007_memory_aids.sql` | 2026-01-10 | Add memory_note, memory_image_url |
| `20260105_saved_words.sql` | 2026-01-11 | Replace saved_vocabulary with saved_words + word_contexts |

---

### Schema Evolution

**Phase 1: Core Learning (Jan 4-5)**
- lessons, vocabulary_items, lesson_progress
- Basic word practice

**Phase 2: Hebrew Cognates (Jan 6)**
- Add hebrew_cognate JSONB
- Fix structure (was array, now object)

**Phase 3: Letter Breakdown (Jan 8)**
- Add letter_breakdown JSONB
- Support for Arabic script analysis

**Phase 4: Content Types (Jan 9)**
- Add content_type field (word, sentence, dialog, passage)
- Enable multi-modal content

**Phase 5: Memory Aids (Jan 10)**
- Add memory_note (user text)
- Add memory_image_url (DALL-E images)
- Enable personalized mnemonics

**Phase 6: My Vocabulary (Jan 11)**
- Replace saved_vocabulary with saved_words + word_contexts
- Support for Egyptian vs MSA
- Track where words were encountered

---

### Future Migrations (Planned)

**Phase 7: Multi-User Support**
```sql
ALTER TABLE saved_words ADD COLUMN user_id UUID REFERENCES auth.users(id);
ALTER TABLE lesson_progress ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Enable RLS
ALTER TABLE saved_words ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_saved_words ON saved_words
  FOR ALL USING (auth.uid() = user_id);
```

**Phase 8: Image Storage Migration**
```sql
-- Change memory_image_url to store URL instead of base64
-- Migration script to upload existing images to storage
```

**Phase 9: Sentences and Passages**
```sql
CREATE TABLE saved_sentences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  arabic_text TEXT NOT NULL,
  arabic_egyptian TEXT,
  transliteration TEXT,
  transliteration_egyptian TEXT,
  translation TEXT NOT NULL,
  explanation TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  source TEXT,
  language TEXT NOT NULL DEFAULT 'arabic',
  times_practiced INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE saved_passages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_text TEXT NOT NULL,
  source_language TEXT NOT NULL,
  full_translation TEXT NOT NULL,
  full_transliteration TEXT,
  sentence_count INTEGER NOT NULL,
  enrichment_data JSONB,
  status TEXT NOT NULL DEFAULT 'active',
  source TEXT,
  times_practiced INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Appendix: Data Size Estimates

### Storage Requirements

| Table | Rows (per user) | Avg Row Size | Total Size |
|-------|----------------|--------------|------------|
| lessons | 50 | 200 B | 10 KB |
| vocabulary_items | 350 (7 per lesson) | 500 B | 175 KB |
| saved_words | 200 | 2-5 KB (with images) | 400 KB - 1 MB |
| word_contexts | 400 (2 per word) | 300 B | 120 KB |
| lesson_progress | 50 | 100 B | 5 KB |
| **Total** | | | **710 KB - 1.3 MB** |

**⚠️ Note:** Base64 images inflate saved_words significantly

**After Image Migration:**
- saved_words: 200 rows × 500 B = 100 KB
- **New total: 410 KB** (67% reduction)

---

### Network Payload Sizes

| Operation | Current | Optimized |
|-----------|---------|-----------|
| Initial load (100 words) | 5 MB | 100 KB (pagination) |
| Single word fetch | 50 KB | 2 KB (URL instead of base64) |
| Lesson with vocabulary | 20 KB | 20 KB (no change) |
| Search results (10 words) | 500 KB | 20 KB |

---

**Document Version:** 1.0
**Last Updated:** January 13, 2026
**Maintained By:** Development Team
**Next Review:** After image storage migration
