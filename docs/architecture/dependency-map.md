# Hook Dependency Map

**Generated:** January 11, 2026  
**Purpose:** Complete mapping of all hooks to tables, UI features, types, and persistence for voice/Spanish refactor prep

---

## Overview

This document maps every data hook in the codebase to:
- **Database tables** it reads/writes
- **UI features** that consume it
- **Type dependencies** it relies on
- **Persistence mechanisms** (localStorage vs Supabase)
- **Current status** (active, transitional, or legacy)

---

## Hook Inventory

### 1. useExercise
**File:** `src/hooks/useExercise.ts`  
**Status:** ✅ **ACTIVE** - Core practice engine

**Tables:** None (operates on in-memory VocabularyItem[])

**Persistence:**
- localStorage: `exercise-progress-{lessonId}` (24hr TTL)
- Stores: currentIndex, answers, savedAt

**Types:**
- `VocabularyItem` (input)
- `ExercisePhase` ('prompting' | 'feedback' | 'complete')
- `AnswerResult` (answer history)
- `SavedProgress` (localStorage shape)

**External Services:**
- OpenAI: `evaluateAnswer()` for semantic validation
- `validateTransliteration()` for Arabic dual-input

**UI Consumers:**
- `src/features/exercises/ExerciseView.tsx`

**Key Behaviors:**
- Exact match check before semantic validation (optimization)
- localStorage auto-save on state changes
- Resume from saved progress on mount
- Clear progress on completion
- **⚠️ ISSUE:** `skipQuestion()` just increments index - does NOT move item to end of queue

**Return Shape:**
```typescript
{
  phase, currentItem, currentIndex, totalItems, answers, lastAnswer,
  correctCount, isValidating, hasSavedProgress,
  submitAnswer, continueToNext, reset, skipQuestion, startFresh, goToItem
}
```

---

### 2. useSavedWords
**File:** `src/hooks/useSavedWords.ts`  
**Status:** ✅ **ACTIVE** - Canonical memory store

**Tables:**
- `saved_words` (primary) - READ/WRITE
- `word_contexts` (secondary) - READ/WRITE (cascade on delete)

**Persistence:** Supabase only

**Types:**
- `SavedWord` (row)
- `SavedWordWithContexts` (joined)
- `WordContext` (context linking)
- `WordStatus` ('active' | 'learned' | 'retired')
- `LetterBreakdown[]`, `HebrewCognate`, `ExampleSentence[]`

**UI Consumers:**
- `src/features/exercises/ExerciseView.tsx` (save from lessons)
- `src/features/lookup/LookupView.tsx` (save from lookup)
- `src/features/vocabulary/LookupModal.tsx` (legacy modal)
- `src/features/vocabulary/MyVocabularyView.tsx` (unified view)

**Key Behaviors:**
- Upsert logic: UPDATE if word exists, INSERT if new
- Filters: status, topic, searchQuery
- Language field present but **⚠️ NOT USED IN QUERIES** (always 'arabic')
- Memory aids: note + DALL-E image URL
- Practice stats: times_practiced, times_correct, last_practiced

**Return Shape:**
```typescript
{
  words, loading, error, topics, counts,
  saveWord, updateStatus, deleteWord, archiveWord, recordPractice,
  saveAsActive, isWordSaved, getSavedWord, isActive, updateMemoryAids, refetch
}
```

**⚠️ CRITICAL ISSUES:**
- Line 155: Hardcodes `language: 'arabic'` on insert
- No language parameter in saveWord()
- No uniqueness constraint on (language, word) - collision risk for Spanish

---

### 3. useVocabulary
**File:** `src/hooks/useVocabulary.ts`  
**Status:** ✅ **ACTIVE** - Curriculum + adapter (PR-2: Now uses domain adapters)

**Tables:**
- `vocabulary_items` (primary) - READ only
- `saved_words` (alternate source) - READ only

**Persistence:** Supabase only

**Types:**
- `VocabularyItem` (output - shared interface)
- `DbVocabularyItem` (DB row from vocabulary_items)
- `SavedWord` (DB row from saved_words)
- **NEW (PR-2):** Uses `PracticeItem` domain adapters internally

**Domain Dependencies (PR-2):**
- `src/domain/practice/adapters/fromVocabularyItems.ts`
- `src/domain/practice/adapters/fromSavedWords.ts`

**UI Consumers:**
- `src/features/exercises/ExerciseView.tsx`

**Key Behaviors:**
- **✅ PR-2 REFACTOR:** Now uses domain adapters for all transformations
- Lines 51-74: Uses `adaptSavedWords()` adapter for saved_words path
- Lines 97-119: Uses `fromVocabularyItems()` adapter for vocabulary_items path
- Both paths: DB → PracticeItem → VocabularyItem (backward compat)
- Can fetch by lessonId OR itemIds
- Zero behavior change from PR-2 refactor

**Return Shape:**
```typescript
{ vocabulary, loading, error, refetch }
```

**✅ PR-2 ACHIEVEMENT:** Transformation logic extracted to domain layer, tested independently.

---

### 4. useLessonProgress
**File:** `src/hooks/useLessonProgress.ts`  
**Status:** ⚠️ **ACTIVE** - Mastery update (conflicts with saved_words)

**Tables:**
- `lesson_progress` - WRITE only
- `vocabulary_items` - READ/WRITE (mastery updates)

**Persistence:** Supabase only

**Types:**
- `Language`, `MasteryLevel` ('new' | 'learning' | 'practiced' | 'mastered')
- `AnswerResult` (input)

**UI Consumers:**
- `src/features/exercises/ExerciseView.tsx`

**Key Behaviors:**
- Saves aggregate lesson stats (score, items_practiced)
- Updates individual vocabulary_items mastery based on practice
- Progression: new → learning (2 practices) → practiced (5) → mastered (10)
- Regression on incorrect: mastered → practiced → learning
- Spaced repetition: calculates next_review based on mastery

**Return Shape:**
```typescript
{ saveProgress, updateVocabularyMastery }
```

**⚠️ CRITICAL ISSUE - DUAL MASTERY SYSTEMS:**
- This updates `vocabulary_items.mastery_level` (curriculum)
- `useSavedWords` tracks `saved_words.status` + practice stats (learner memory)
- **NO SYNCHRONIZATION** between these two systems
- Voice/Spanish will make this worse (which system is canonical?)

---

### 5. useLessons
**File:** `src/hooks/useLessons.ts`  
**Status:** ✅ **ACTIVE** - Lesson metadata

**Tables:**
- `lessons` - READ only

**Persistence:** Supabase only

**Types:**
- `DbLesson` (DB row)
- `Lesson` (transformed)
- `Language`, `ContentType`

**UI Consumers:**
- (Called by LessonLibrary, LessonGenerator - not directly imported in search results)

**Key Behaviors:**
- Filters by language and/or contentType
- Transforms DB snake_case to camelCase

**Return Shape:**
```typescript
{ lessons, loading, error, refetch }
```

---

### 6. useCardStack
**File:** `src/hooks/useCardStack.ts`  
**Status:** ✅ **ACTIVE** - UI state only

**Tables:** None

**Persistence:**
- localStorage: `{persistKey}` (indefinite)
- Stores: CardState[] with lesson + status

**Types:**
- `Lesson` (from types/lesson)
- `CardAction` ('dismiss' | 'save' | 'later' | 'start')
- `CardStatus` ('active' | 'dismissed' | 'saved' | 'later')

**UI Consumers:**
- (Likely LessonFeed - not in grep results)

**Key Behaviors:**
- Undo window: 5 seconds
- 'later' action moves card to end of array
- Pure UI state management (no DB writes)

**Return Shape:**
```typescript
{
  activeLessons, savedLessons, totalCards, remainingCards,
  handleAction, resetCards, resetWithLessons,
  undoLastAction, canUndo, lastActionType
}
```

---

### 7. useSavedVocabulary
**File:** `src/hooks/useSavedVocabulary.ts`  
**Status:** ⚠️ **TRANSITIONAL** - Legacy adapter (marked for removal)

**Tables:**
- `saved_words` - READ/WRITE
- `word_contexts` - READ/WRITE

**Persistence:** Supabase only

**Types:**
- `SavedWordWithContexts` (internal)
- `LegacySavedItem` (output - backward compat)
- `VocabularyItem` (input for save)

**UI Consumers:**
- `src/_archive/deprecated_components/SavedVocabularyView.tsx` (ARCHIVED - not active)

**Key Behaviors:**
- Wraps new `saved_words` table
- Provides old `savedItems` interface for backward compat
- Comment line 31: "TRANSITIONAL: Will be replaced by useSavedWords"
- **⚠️ HARDCODES ARABIC:** Line 129 `language: 'arabic'`

**Return Shape:**
```typescript
{
  savedItems, loading, error, savedItemIds,
  saveItem, removeItem, isItemSaved, refreshSavedItems
}
```

**✅ ACTION ITEM:** This hook is only used in archived code - can be deprecated in PR 5.

---

### 8. useSavedSentences
**File:** `src/hooks/useSavedSentences.ts`  
**Status:** ⚠️ **ACTIVE** - Fragmented memory

**Tables:**
- `saved_sentences` - READ/WRITE

**Persistence:** Supabase only

**Types:**
- `SavedSentence` (own schema)
- `SaveSentenceInput`

**UI Consumers:**
- `src/features/lookup/LookupView.tsx`
- `src/features/sentences/MySentencesView.tsx`

**Key Behaviors:**
- Separate table from saved_words
- Status: 'active' | 'learned'
- Memory aids: note + image
- Uniqueness check on arabic_text

**Return Shape:**
```typescript
{
  sentences, loading, error, counts,
  saveSentence, deleteSentence, updateStatus, updateMemoryAids,
  isSentenceSaved, refetch
}
```

**⚠️ CRITICAL ISSUE - FRAGMENTED MEMORY:**
- Sentences saved here WON'T appear in saved_words
- Conversations (voice feature) will need similar tracking
- Leads to 3+ parallel memory systems

---

### 9. useSavedPassages
**File:** `src/hooks/useSavedPassages.ts`  
**Status:** ⚠️ **ACTIVE** - Fragmented memory

**Tables:**
- `saved_passages` - READ/WRITE

**Persistence:** Supabase only

**Types:**
- `SavedPassage` (own schema)
- `SavePassageInput`

**UI Consumers:**
- `src/features/lookup/LookupView.tsx`
- `src/features/passages/MyPassagesView.tsx`

**Key Behaviors:**
- Separate table from saved_words
- Status: 'active' | 'learned'
- Tracks sentence_count
- Memory aids: note + image

**Return Shape:**
```typescript
{
  passages, loading, error, counts,
  savePassage, deletePassage, updateStatus, updateMemoryAids,
  isPassageSaved, refetch
}
```

**⚠️ SAME ISSUE:** Third parallel memory system.

---

## Critical Findings Summary

### 🚨 High-Priority Issues

1. **DUAL MASTERY SYSTEMS** (ADR-002 needed)
   - `useLessonProgress` updates `vocabulary_items.mastery_level`
   - `useSavedWords` tracks `saved_words.status` + practice stats
   - No synchronization - which is canonical?

2. **FRAGMENTED MEMORY** (ADR-004 needed)
   - `saved_words` (words)
   - `saved_sentences` (sentences)
   - `saved_passages` (passages)
   - No unified query for "all my saved content"
   - Voice conversations will add 4th system

3. **LANGUAGE HARDCODING** (blocks Spanish)
   - `useSavedWords` line 155: hardcodes 'arabic'
   - `useSavedVocabulary` line 129: hardcodes 'arabic'
   - No language param in save operations
   - No (language, word) uniqueness enforcement

4. **BROKEN SKIP SEMANTICS** (ADR-003 needed)
   - `useExercise.skipQuestion()` just increments index
   - Comment says "move to end" but doesn't
   - Voice needs proper queue operations

### ✅ Positive Findings

1. **ADAPTER ALREADY EXISTS**
   - `useVocabulary` lines 41-69: transforms SavedWord → VocabularyItem
   - Can extract this to domain layer easily

2. **CLEAN SEPARATION**
   - Exercise logic (useExercise) doesn't directly touch DB
   - Only operates on VocabularyItem[] in memory
   - Good foundation for queue refactor

---

## Recommended Architecture

### Canonical Memory Store
**Proposal:** `saved_words` as single source of truth
- Add explicit language field to all queries
- Unique constraint on (language, word)
- Deprecate saved_sentences, saved_passages
- Migrate existing data with content_type classification

### Mastery Tracking
**Proposal:** Mastery lives in `saved_words`
- `vocabulary_items.mastery_level` becomes read-only curriculum metadata
- Practice tracking happens only in saved_words
- useLessonProgress writes to saved_words instead

### Domain Layer (PR-2)

**Location:** `src/domain/practice/`

**Purpose:** Language-agnostic practice abstraction layer

**Files:**
- `PracticeItem.ts` - Canonical domain type for all learnable content
- `adapters/fromVocabularyItems.ts` - DbVocabularyItem → PracticeItem
- `adapters/fromSavedWords.ts` - SavedWord → PracticeItem
- `__tests__/adapters.test.ts` - Adapter transformation tests (7 tests)
- `__tests__/adapter-equivalence.test.ts` - Golden equivalence tests (4 tests)

**Key Design:**
- **Language explicit:** Never hardcoded (arabic | spanish | hebrew | english)
- **Modality-agnostic:** promptType/answerType fields ready for voice
- **Source-agnostic:** Origin tracking prevents "where did this come from?" issues
- **Raw mastery preserved:** No translation of dual mastery systems yet (PR-4 territory)

**Current Usage:**
- `useVocabulary` uses adapters internally (PR-2 refactor)
- Returns VocabularyItem for backward compatibility
- Zero behavior change from refactor

**Test Coverage:** 11/11 passing (7 adapter + 4 equivalence tests)

**✅ PR-2 Achievement:** Transformation seam established, fully tested, zero regressions.

---

## Hook Contracts

### useExercise Contract
**Location:** `src/hooks/useExercise.ts`

**State Machine Invariants:**
- Phase transitions: `prompting → feedback → prompting` (for continue) OR `prompting → complete` (on last item)
- `currentIndex` must be valid: `0 <= currentIndex < totalItems`
- `phase === 'complete'` implies all items answered OR explicitly completed

**Persistence Invariants:**
- Progress saved to localStorage on every state change
- 24-hour TTL on saved progress
- Must support resume from partial completion
- **⚠️ Current bug:** Skip doesn't move item to end (documented in tests, will be fixed in PR-3)

**Exercise Runtime:**
- Currently consumes `VocabularyItem[]`
- PracticeItem is canonical; VocabularyItem is temporary adapter
- Future: Will migrate to `PracticeItem[]` directly (voice + Spanish)

---

### useVocabulary Contract
**Location:** `src/hooks/useVocabulary.ts`

**Supported Sources:**
- `vocabulary_items` table (lesson-driven curriculum)
- `saved_words` table (learner memory)

**Adapter Seam:**
- Uses `fromVocabularyItems` adapter for vocabulary_items → PracticeItem
- Uses `fromSavedWords` adapter for saved_words → PracticeItem
- Converts PracticeItem → VocabularyItem for backward compatibility
- Zero behavior change from PR-2 refactor (proven by equivalence tests)

**Fetch Modes:**
- By lessonId: fetches all items in a lesson
- By itemIds: fetches specific items

---

### useSavedWords Contract
**Location:** `src/hooks/useSavedWords.ts`

**Canonical Store:**
- Primary storage for all learner memory
- Unified table for words, sentences, passages, dialogs
- Classification by word count (1 word = word, 2+ words 1 sentence = sentence, etc.)

**Operations:**
- saveWord: Upsert (update if exists, insert if new)
- updateStatus: active → learned → retired
- recordPractice: Increment times_practiced, update last_practiced
- Memory aids: note + DALL-E image URL

**⚠️ Known Issues (to be addressed in PR-4):**
- Hardcodes `language: 'arabic'` on insert (line 155)
- No language parameter in saveWord()
- No (language, word) uniqueness constraint - collision risk for Spanish
- Dual mastery systems: saved_words.status vs vocabulary_items.mastery_level

---

## Next Steps (Post-PR-2)

1. ✅ This dependency map complete
2. ⏳ Identify ALL active UI call sites (grep completed above)
3. ⏳ Add baseline tests for useExercise current behavior
4. ⏳ Add baseline tests for useCardStack undo window
5. ⏳ Update README testing section
6. ⏳ Write verification note

Then stop and present findings before PR 2.
