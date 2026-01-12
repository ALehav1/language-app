# Language Learning App - Architecture Documentation

**Last Updated:** January 10, 2026 (Evening)  
**Version:** 1.2 UI Polish & Dialogs Support

---

## Table of Contents

1. [Overview](#overview)
2. [Project Structure](#project-structure)
3. [Core Concepts](#core-concepts)
4. [Data Flow](#data-flow)
5. [Component Architecture](#component-architecture)
6. [Routing & Navigation](#routing--navigation)
7. [State Management](#state-management)
8. [External Services](#external-services)
9. [Development Guidelines](#development-guidelines)

---

## Overview

### Purpose
AI-powered language learning app focused on teaching how native speakers actually talk, with emphasis on Egyptian Arabic dialect alongside Modern Standard Arabic (MSA).

### Target Users
- Non-technical adult learners
- Arabic: Novice level
- Spanish: Intermediate level (planned)
- Session length: 5-10 minutes
- Context: Often can't speak aloud

### Core Philosophy
- **No gamification** - No streaks, points, or badges
- **Explicit control** - User decides what to save and practice
- **Semantic validation** - Accept synonyms and typos
- **Dialect-first** - Egyptian Arabic as primary, MSA as reference
- **Spaced repetition** - Smart review scheduling

---

## Project Structure

```
language-app/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── WordDisplay.tsx        # Unified word display (primary)
│   │   ├── SaveDecisionPanel.tsx  # Save controls
│   │   ├── MemoryAidEditor.tsx    # DALL-E image + notes
│   │   ├── MemoryAidTile.tsx      # Collapsible memory aid wrapper
│   │   ├── ContextTile.tsx        # Root/usage/cultural context display
│   │   ├── ChatTile.tsx           # Interactive Q&A with AI tutor
│   │   ├── SentenceDisplay.tsx    # Sentence rendering
│   │   └── ...
│   │
│   ├── features/            # Feature-based modules
│   │   ├── home/                 # Main menu
│   │   ├── lessons/              # Lesson browser & generator
│   │   ├── exercises/            # Practice flow
│   │   ├── vocabulary/           # Saved words view
│   │   ├── sentences/            # Saved sentences
│   │   ├── passages/             # Saved passages
│   │   └── lookup/               # Translation lookup
│   │
│   ├── hooks/               # Custom React hooks
│   │   ├── useSavedWords.ts      # Primary vocabulary data
│   │   ├── useSavedSentences.ts  # Sentence data
│   │   ├── useSavedPassages.ts   # Passage data
│   │   ├── useLessons.ts         # Lesson data
│   │   ├── useExercise.ts        # Exercise logic
│   │   └── ...
│   │
│   ├── lib/                 # External service clients
│   │   ├── supabase.ts           # Database client
│   │   └── openai.ts             # AI integration
│   │
│   ├── utils/               # Utility functions
│   │   ├── egyptianDictionary.ts    # MSA→Egyptian mappings
│   │   ├── egyptianInference.ts     # Auto-generate Egyptian
│   │   ├── hebrewCognates.ts        # Hebrew connections
│   │   ├── arabicLetters.ts         # Letter breakdown logic
│   │   ├── transliteration.ts       # Chat number support
│   │   └── ...
│   │
│   ├── types/               # TypeScript definitions
│   │   ├── index.ts              # Core types
│   │   ├── database.ts           # Supabase types
│   │   └── lesson.ts             # Lesson types
│   │
│   └── main.tsx            # App entry point
│
├── public/                  # Static assets
├── README.md               # User-facing docs
├── ARCHITECTURE.md         # This file
└── package.json           # Dependencies
```

---

## Core Concepts

### 1. Unified Vocabulary Model

All saved content flows through a single database table (`saved_words`) with content type detection:

- **Words**: Single Arabic words (1 word)
- **Sentences**: Multi-word phrases (2+ words, 1 sentence)
- **Passages**: Full texts (multiple sentences)
- **Dialogs**: Conversational exchanges (multiple sentences, treated like passages)

**Detection Logic:**
```typescript
const wordCount = text.trim().split(/\s+/).length;
const sentenceEndings = text.match(/[.!?؟۔]\s+|[.!?؟۔]$/g);
const sentenceCount = sentenceEndings ? sentenceEndings.length : 1;

// Classification
if (wordCount === 1) → Word
if (wordCount > 1 && sentenceCount === 1) → Sentence
if (sentenceCount > 1) → Passage or Dialog
```

**Note:** Lessons can be created as Words, Phrases, Passages, or Dialogs. In My Vocabulary, users can filter by all 4 types, with Dialogs treated as multi-sentence content.

### 2. Dialect Handling

**Primary**: Egyptian Arabic (everyday speech)  
**Reference**: Modern Standard Arabic (formal/written)

**Sources** (in priority order):
1. `egyptianDictionary.ts` - Static mappings (150+ entries)
2. `egyptianInference.ts` - Rule-based generation
3. API response - OpenAI-provided dialects

**Display Pattern:**
```
Egyptian (larger, prominent)
↓
MSA (smaller, reference)
```

### 3. Save Decision Flow

User has **explicit control** over every vocabulary item:

```
Encounter word/phrase
    ↓
SaveDecisionPanel appears
    ↓
User chooses:
    - Save to Practice (status: 'active')
    - Save to Archive (status: 'learned')
    - Skip (don't save)
    - Remove (delete if already saved)
    ↓
Optional: Add memory aids (image + note)
    ↓
Saved to database
```

### 4. Memory Aid System

**Purpose**: Visual + textual mnemonics  
**Source**: DALL-E 3 image generation + user notes

**Storage:**
- Images: Supabase Storage bucket
- Notes: Text field in `saved_words.memory_note`
- Association: Linked to saved word by ID

### 5. Interactive Text Selection

**Purpose**: Make words and sentences clickable for lookup and saving  
**Implementation**: PR-4 (January 2026)

**Architecture:**

```
Text Content
    ↓
tokenizeWords / splitSentences (utils/text/)
    ↓
ClickableText component (word or sentence mode)
    ↓
User clicks word/sentence
    ↓
WordDetailModal / SentenceDetailModal
    ↓
Lookup via OpenAI + Save via SaveDecisionPanel
```

**Components:**
- `ClickableText.tsx` - Renders clickable words or sentences
- `WordDetailModal.tsx` - Full word details + save flow
- `SentenceDetailModal.tsx` - Sentence view + word clicks inside

**Utilities:**
- `tokenizeWords.ts` - Splits text into word/punctuation/whitespace tokens (Arabic/Spanish-safe)
- `splitSentences.ts` - Detects sentence boundaries (handles Arabic ؟)

**Selection Context:**
- `WordSelectionContext` - Captures clicked word + parent sentence + source
- `SentenceSelectionContext` - Captures clicked sentence + parent passage + source

**Integration Points:**
- ExerciseFeedback: Example sentences → word-level clicking
- MyPassagesView: Multi-sentence passages → sentence-level clicking
- SentenceDetailModal: Words inside sentences → nested word clicking

**Language Support:**
- Arabic: Full RTL support, preserves diacritics
- Spanish: LTR rendering (English treated as Spanish for tokenization)
- Touch targets: 48×48px minimum for mobile

---

## Data Flow

### Primary Data Sources

```
┌─────────────┐
│   Supabase  │  ← Database (saved_words, lessons, etc.)
└──────┬──────┘
       │
       ├─→ useSavedWords.ts ──→ MyVocabularyView
       ├─→ useSavedSentences.ts ──→ MySentencesView
       ├─→ useSavedPassages.ts ──→ MyPassagesView
       └─→ useLessons.ts ──→ LessonFeed

┌─────────────┐
│   OpenAI    │  ← AI generation & validation
└──────┬──────┘
       │
       ├─→ Lesson generation
       ├─→ Exercise validation (semantic)
       ├─→ Translation (lookup mode)
       └─→ DALL-E images (memory aids)
```

### Typical User Flows

**1. Learn from Lesson:**
```
MainMenu → LessonFeed → Select Lesson → ExerciseView
    ↓
Practice exercises (dual input for Arabic)
    ↓
ExerciseFeedback → SaveDecisionPanel
    ↓
Save to Practice/Archive
```

**2. Review Vocabulary:**
```
MainMenu → My Saved Vocabulary
    ↓
Filter: Practice/Archive
    ↓
Filter: Words/Sentences/Passages
    ↓
Select item → WordDisplay modal
    ↓
Edit memory aids, change status, or delete
```

**3. Lookup Translation:**
```
MainMenu → Lookup
    ↓
Paste Arabic OR English text
    ↓
Get full translation + word breakdown
    ↓
Save individual words/sentences
```

---

## Component Architecture

### Display Components (Presentational)

**WordDisplay** - Primary unified display
- Shows Arabic (Egyptian + MSA) with clear text labels
- Transliteration (both dialects)
- Translation
- Hebrew cognates
- Letter breakdown (organized by word)
- Example sentences
- Word context (root, usage, MSA comparison)
- Used everywhere for consistency

**ContextTile** - Word/phrase analysis (NEW in v1.1)
- Displays root information with meaning
- Egyptian usage explanation
- MSA comparison
- Optional cultural notes
- Used in both ExerciseFeedback and LookupModal
- Replaces inline "Word Context" section

**MemoryAidTile** - Collapsible memory aid wrapper (NEW in v1.1)
- Expandable/collapsible interface
- Shows "(saved)" indicator when memory aid exists
- Contains MemoryAidEditor component
- Reduces visual clutter with collapse functionality
- Persists state during session
- Used in both ExerciseFeedback and LookupModal

**ChatTile** - Interactive AI tutor (NEW in v1.1)
- Real-time Q&A about words/phrases
- Powered by GPT-4o-mini for fast responses
- Context-aware (knows word, translation, usage)
- Chat history persists during session
- Expandable/collapsible interface
- Suggestion prompts for common questions
- 2-3 sentence max responses
- Used in both ExerciseFeedback and LookupModal

**SentenceDisplay** - Sentence-specific
- Word-by-word breakdown
- Hover tooltips
- Used in passage display

**SaveDecisionPanel** - Save controls
- Practice/Archive/Skip/Remove buttons
- Memory aid integration
- Status feedback (loading → success)

**MemoryAidEditor** - Memory aid creation
- DALL-E image generation with custom prompts
- Note input and editing
- Preview display
- Used within MemoryAidTile

### Feature Views (Smart Components)

**MainMenu** - Home screen
- 3 tiles: Lessons, Lookup, My Saved Vocabulary
- Combined count badges
- Entry point for all features

**LessonLibrary** - Lesson browser & management (v1.2 restructured)
- 4 content type category tiles (Words, Phrases, Passages, Dialogs)
- Each tile shows "View Saved" and "Create New" buttons
- Saved lessons filtered by selected category
- Compact lesson list design (reduced padding and spacing)
- Quick topics integrated into LessonGenerator modal
- Collapsible lesson list (chronological, newest first)
- Filter by language/content type
- Create new lessons with AI generation
- **Lesson Management (Phase 1):**
  - **Delete**: Remove lesson + cascade delete vocabulary_items
  - **Edit**: Update lesson title & description
  - **Regenerate**: Clear vocabulary items, keep lesson metadata
  - Action buttons on each lesson card
  - Confirmation dialogs for destructive actions
- **Smart Deduplication:**
  - Detects similar existing lessons before creation
  - Keyword matching in titles (case-insensitive)
  - Auto-numbering for duplicate topics ("Room 2", "Room 3")
  - Option to resume existing or create new version
- **Success Confirmation:**
  - Dialog after lesson creation with item count
  - "Start Exercise" or "View All Lessons" options

**ExerciseView** - Practice flow
- Dual input (transliteration + translation)
- Semantic validation
- Progress tracking
- Save prompts after each word
- ExerciseFeedback component shows:
  - Word breakdown with pronunciations
  - Context tile (root, usage, cultural notes)
  - Memory Aid tile (collapsible)
  - Chat tile (interactive Q&A)
  - Example sentences
  - Letter breakdown (by word)
  - Hebrew cognates

**MyVocabularyView** - Unified collection
- Status filter: Practice/Archive
- Content type filter: Words/Sentences/Passages
- Search functionality
- Batch operations (selection mode)
- Word detail modals

**LookupView** - Translation lookup
- Auto-detect language (Arabic or English)
- Word-by-word breakdown
- Save individual items
- LookupModal shows:
  - Word breakdown with pronunciations
  - Context tile (root, usage, cultural notes)
  - Memory Aid tile (collapsible)
  - Chat tile (interactive Q&A)
  - Example sentences
  - Letter breakdown (by word)
  - Hebrew cognates
- Feature parity with Lessons view

---

## Routing & Navigation

### Route Structure

```typescript
/ (root)
    → MainMenu

/lessons
    → LessonLibrary (formerly LessonFeed)

/exercise/:lessonId
    → ExerciseView
    → Query param: ?from=saved (practice mode)

/words
    → MyVocabularyView (unified view)
    → /saved (legacy route, redirects)

/sentences
    → MySentencesView (separate view, deprecated route)

/passages
    → MyPassagesView (separate view, deprecated route)

/lookup
    → LookupView
```

**Note:** `/sentences` and `/passages` routes exist for backward compatibility but the primary UX consolidates everything into `/words` with filtering.

---

## State Management

### Pattern: Custom Hooks + React Context

**No Redux** - Using React 19 built-in state management

### Primary Data Hooks

**useSavedWords** - Main vocabulary hook
```typescript
{
  words: SavedWord[]           // All saved items
  loading: boolean
  error: string | null
  counts: {                    // Status counts
    active: number
    learned: number
  }
  saveWord(data, context)      // Create/update
  updateStatus(id, status)     // Change active/learned
  updateMemoryAids(id, aids)   // Update image/note
  deleteWord(id)               // Remove
  refetch()                    // Refresh data
}
```

**useLessons** - Lesson data
```typescript
{
  lessons: Lesson[]          // All user lessons
  loading: boolean           // Loading state
  error: string | null       // Error state
  refetch: () => Promise     // Refresh lesson list
}
```

**useExercise** - Exercise logic & validation
**useLessonProgress** - Progress tracking

### State Patterns

1. **Optimistic Updates**: UI updates immediately, then syncs to DB
2. **Loading States**: Show spinners during async operations
3. **Error Boundaries**: Graceful error handling with retry options
4. **Cache Invalidation**: Refetch after mutations

### Lesson Management State (Phase 1)

**LessonLibrary Component State:**
```typescript
// Modal/dialog state
lessonToDelete: Lesson | null        // Pending delete confirmation
lessonToEdit: Lesson | null          // Editing modal open
editTitle: string                    // Edit form title field
editDescription: string              // Edit form description field
lessonToRegenerate: Lesson | null    // Regenerate confirmation

// Loading states
isDeleting: boolean                  // Delete operation in progress
isUpdating: boolean                  // Update operation in progress  
isRegenerating: boolean              // Regenerate operation in progress
```

**Database Operations:**
```typescript
// Delete lesson
DELETE FROM lessons WHERE id = ?
// vocabulary_items cascade delete automatically via foreign key

// Edit lesson
UPDATE lessons 
SET title = ?, description = ? 
WHERE id = ?

// Regenerate lesson
DELETE FROM vocabulary_items WHERE lesson_id = ?
// Keeps lesson record intact, clears vocabulary for new generation
```

**User Flow:**
1. User clicks Edit/Delete/Regenerate button on lesson card
2. Component sets corresponding state (lessonToDelete, etc.)
3. Modal dialog appears with confirmation
4. User confirms → async operation executes
5. Loading state shows (isDeleting, etc.)
6. On success: refetch() lessons, close modal
7. On error: show alert, keep modal open

---

## External Services

### Supabase (Database & Storage)

**Tables:**
- `saved_words` - All vocabulary (words/sentences/passages)
- `word_contexts` - Where/how words were learned
- `lessons` - Generated lessons
  - Fields: id, title, description, language, difficulty, content_type, estimated_minutes, vocab_count, created_at
  - **Phase 1 Operations:**
    - DELETE: Cascade deletes vocabulary_items automatically
    - UPDATE: Allows editing title and description
- `vocabulary_items` - Lesson vocabulary (linked to lessons)
  - Fields: id, lesson_id, word, translation, transliteration, hebrew_cognate, letter_breakdown, mastery_level, times_practiced
  - **Phase 1 Operations:**
    - DELETE WHERE lesson_id = ? (regenerate operation)
    - Cascade deleted when parent lesson deleted
- `lesson_progress` - User progress tracking
- `saved_sentences` - Legacy (being phased out)
- `saved_passages` - Legacy (being phased out)

**Storage:**
- `memory-aid-images` - DALL-E generated images

**Auth:**
- Currently using anonymous/service key
- User auth planned for future

### OpenAI API

**Models Used:**
- `gpt-4o` - Lesson generation, validation, lookup
- `gpt-4o-mini` - Interactive chat/Q&A (ChatTile)
- `dall-e-3` - Memory aid images

**Key Functions:**
```typescript
// Lesson generation (with word exclusion)
generateLessonContent(
  topic: string,
  language: Language,
  level: MasteryLevel,
  contentType: ContentType,
  arabicDialect: ArabicDialect,
  excludeWords: string[]  // Already-saved words to avoid
)

// Exercise validation (semantic)
validateAnswer(userAnswer, correctAnswer, context)

// Translation
lookupWord(text, sourceLanguage)

// Memory aids
generateMemoryAidImage(word, translation, theme)

// Interactive chat (NEW in v1.1)
openai.chat.completions.create({
  model: 'gpt-4o-mini',
  messages: [
    { role: 'system', content: contextPrompt },
    ...conversationHistory
  ],
  max_tokens: 200  // Brief responses for quick learning
})
```

**Rate Limiting:**
- Built-in retry logic
- Error handling for quota issues

---

## Development Guidelines

### Code Style

**File Organization:**
- One component per file
- Co-locate related utilities
- Feature-based folder structure

**Naming Conventions:**
- Components: PascalCase (`WordDisplay.tsx`)
- Hooks: camelCase with `use` prefix (`useSavedWords.ts`)
- Utilities: camelCase (`egyptianDictionary.ts`)
- Types: PascalCase interfaces

**TypeScript:**
- Strict mode enabled
- Explicit return types for functions
- No `any` types (use `unknown` if necessary)

### Component Patterns

**Props Interface:**
```typescript
interface ComponentProps {
  // Required props first
  word: string;
  translation: string;
  
  // Optional props with clear types
  onSave?: (decision: SaveDecision) => void;
  showBreakdown?: boolean;
  
  // Callbacks with full signatures
  onTap?: () => void;
}
```

**Hooks Pattern:**
```typescript
export function useDataHook(options?: Options) {
  const [data, setData] = useState<Data[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch function
  const fetchData = useCallback(async () => {
    // Implementation
  }, [dependencies]);
  
  // CRUD operations
  const createItem = useCallback(async (item) => {
    // Implementation
  }, []);
  
  // Return interface
  return {
    data,
    loading,
    error,
    createItem,
    // ... other operations
    refetch: fetchData
  };
}
```

### Testing Strategy

**Current Status:** Manual testing only

**Planned:**
- Unit tests for utilities
- Integration tests for hooks
- E2E tests for critical flows

**Test Coverage Priority:**
1. Data hooks (CRUD operations)
2. Exercise validation logic
3. Arabic text processing utilities
4. Save/load flows

### Deployment

**Platform:** Vercel  
**Build:** Vite production build  
**Environment Variables:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_OPENAI_API_KEY`

**Build Command:**
```bash
npm run build
vercel --prod
```

---

## Appendix: Key Files Reference

### Most Important Files (Core System)

**Entry & Routing:**
- `src/main.tsx` - App entry, routing config

**Primary Views:**
- `src/features/home/MainMenu.tsx` - Home screen
- `src/features/vocabulary/MyVocabularyView.tsx` - Unified vocabulary
- `src/features/lookup/LookupView.tsx` - Translation lookup
- `src/features/exercises/ExerciseView.tsx` - Practice flow

**Core Components:**
- `src/components/WordDisplay.tsx` - Word display (everywhere)
- `src/components/SaveDecisionPanel.tsx` - Save controls
- `src/components/MemoryAidEditor.tsx` - Memory aids

**Data Layer:**
- `src/hooks/useSavedWords.ts` - Primary data hook
- `src/lib/supabase.ts` - Database client
- `src/lib/openai.ts` - AI client

**Arabic Processing:**
- `src/utils/egyptianDictionary.ts` - Dialect mappings
- `src/utils/arabicLetters.ts` - Letter breakdown
- `src/utils/hebrewCognates.ts` - Hebrew connections

### Recently Deprecated (Archive Candidates)

- `src/features/vocabulary/SavedVocabularyView.tsx` - Old vocab view
- `src/utils/testConnection.ts` - Test utility
- `src/utils/testSupabase.ts` - Test utility

---

**End of Architecture Documentation**
