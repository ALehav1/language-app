# Language Learning App - User Flows Documentation

**Generated:** January 13, 2026
**Version:** 1.0
**Purpose:** Comprehensive documentation of all user journeys, interactions, and state transitions

---

## Table of Contents

1. [Overview](#overview)
2. [Primary User Flows](#primary-user-flows)
3. [Flow 1: AI Lesson Creation & Practice](#flow-1-ai-lesson-creation--practice)
4. [Flow 2: Quick Word Lookup](#flow-2-quick-word-lookup)
5. [Flow 3: Vocabulary Management](#flow-3-vocabulary-management)
6. [Flow 4: Practice Saved Words](#flow-4-practice-saved-words)
7. [Flow 5: Passage Analysis](#flow-5-passage-analysis)
8. [Critical Paths & Bottlenecks](#critical-paths--bottlenecks)
9. [Error Handling Flows](#error-handling-flows)
10. [State Persistence](#state-persistence)

---

## Overview

This document maps every user journey through the Language Learning App, documenting:
- Step-by-step interactions
- Component transitions
- API calls and timing
- Database operations
- State changes
- UI feedback patterns
- Error scenarios

### User Journey Map

```
┌────────────────────────────────────────────────────────────┐
│                        MainMenu                             │
│                      (Entry Point)                          │
│                                                             │
│     [Lessons]    [Lookup]    [My Vocabulary]               │
└────────┬──────────────┬──────────────┬─────────────────────┘
         │              │              │
         ▼              ▼              ▼
   ┌─────────┐    ┌─────────┐   ┌─────────────┐
   │ Lesson  │    │ Lookup  │   │ Vocabulary  │
   │ Library │    │  View   │   │   Landing   │
   └────┬────┘    └────┬────┘   └──────┬──────┘
        │              │               │
        ▼              │               ▼
   ┌─────────┐         │         ┌─────────────┐
   │Exercise │         │         │My Vocabulary│
   │  View   │◄────────┴─────────│    View     │
   └─────────┘                   └─────────────┘
   (Practice)                    (Review/Practice)
```

---

## Primary User Flows

### Flow Categories

| Flow | Purpose | Duration | Frequency | Complexity |
|------|---------|----------|-----------|------------|
| Lesson Creation | Generate & practice AI lessons | 10-15 min | Weekly | High |
| Quick Lookup | Translate single word | 30-60 sec | Daily | Low |
| Vocabulary Review | Browse saved words | 5-10 min | Weekly | Medium |
| Practice Session | Quiz on saved words | 5-10 min | Daily | Medium |
| Passage Analysis | Deep dive into text | 10-20 min | Weekly | High |

---

## Flow 1: AI Lesson Creation & Practice

**Goal:** User creates a personalized lesson on a topic and practices the vocabulary

**Entry Point:** MainMenu → "Start Lesson" tile → LessonLibrary

**Success Criteria:** Complete lesson, save at least 1 word

**Average Duration:** 12 minutes

### Step-by-Step Flow

#### Step 1: Navigate to Lesson Library
**Component:** `MainMenu.tsx`
**User Action:** Click "Start Lesson" tile
**State Changes:**
- Route: `/` → `/lessons`
**API Calls:** None
**UI Feedback:** Tile press animation, page transition

```tsx
// MainMenu.tsx (line 20-30)
<div onClick={() => navigate('/lessons')}>
  <h3>Start Lesson</h3>
  <p>Generate personalized lessons with AI</p>
</div>
```

---

#### Step 2: View Existing Lessons
**Component:** `LessonLibrary.tsx`
**Hook:** `useLessons()`
**Rendered:** Lesson cards in grid, "Generate New" button

**Database Query:**
```sql
SELECT * FROM lessons
WHERE language = 'arabic'
ORDER BY created_at DESC;
```

**Loading State:**
- Skeleton cards (3 placeholders)
- Duration: 200-500ms

**State:**
```typescript
{
  lessons: DbLesson[],
  loading: boolean,
  error: string | null
}
```

**UI Elements:**
- Lesson cards showing: title, description, difficulty, vocab count
- "Generate New Lesson" button (primary CTA)
- Language badge (Arabic/Spanish)

---

#### Step 3: Open Lesson Generator
**Component:** `LessonGenerator.tsx` (modal)
**User Action:** Click "Generate New Lesson"
**State Changes:**
- Modal opens (overlay + centered card)
- Generator state initialized

**UI Elements:**
- Topic input field (placeholder: "e.g., At the Restaurant")
- Level selector: New | Learning | Practiced | Mastered
- Content type selector: Words | Sentences | Dialogs | Passages
- "Generate" button

---

#### Step 4: Generate Lesson (AI Call)
**Component:** `LessonGenerator.tsx`
**User Action:** Enter topic → Click "Generate"
**API Call:** OpenAI GPT-4o

**Request Flow:**
```
1. Validate input (topic not empty)
2. Fetch excluded words (already saved)
   → Query: SELECT word FROM saved_words WHERE language = 'arabic'
3. Call OpenAI with prompt:
   - Topic: "At the Restaurant"
   - Level: "new"
   - Language: "arabic"
   - Excluded words: ["مرحبا", "شكرا", ...]
4. Parse JSON response
5. Insert lesson record
6. Insert vocabulary_items (batch)
7. Navigate to ExerciseView
```

**OpenAI Call:**
```typescript
// lib/openai.ts - generateLessonContent()
const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  temperature: 0.7,
  messages: [
    {
      role: 'system',
      content: 'You are an Arabic language teacher...'
    },
    {
      role: 'user',
      content: `Generate lesson on: ${topic}...`
    }
  ]
});
```

**Timing:**
- API call: 5-10 seconds
- DB inserts: 500-1000ms
- Total: 6-11 seconds

**UI Feedback:**
- Button shows spinner
- Text: "Generating lesson..." → "Inserting vocabulary..." → "Starting lesson..."
- Progress bar (fake/animated)

**Error Scenarios:**
1. OpenAI API error → Show error message, allow retry
2. Parse error → Log + show "Failed to generate, try again"
3. DB insert error → Show error, lesson partially created

---

#### Step 5: Exercise View Loads
**Component:** `ExerciseView.tsx`
**Hook:** `useExercise()`
**Route:** `/exercise/:lessonId`

**Data Fetching:**
```typescript
// Fetch vocabulary items for lesson
const { data } = await supabase
  .from('vocabulary_items')
  .select('*')
  .eq('lesson_id', lessonId);

// Check for saved progress
const saved = localStorage.getItem(`exercise-progress-${lessonId}`);
```

**State Initialization:**
```typescript
{
  phase: 'prompting' | 'feedback' | 'complete',
  currentIndex: 0,
  currentItem: VocabularyItem,
  totalItems: 7,
  answers: [],
  queue: [id1, id2, id3...],
  isValidating: false
}
```

**UI Elements:**
- Header: Back button, segmented progress bar, question counter
- Main area: Question card
- Input area: Answer input field(s)
- Skip button

**Loading State:**
- Skeleton: progress bar, question card, input field
- Duration: 500-800ms

---

#### Step 6: Answer First Question
**Component:** `ExercisePrompt.tsx` + `AnswerInput.tsx`
**Phase:** `prompting`

**Question Display:**
```
┌─────────────────────────────────┐
│  Question 1 of 7                │
│                                 │
│  What is the Arabic word for:   │
│  "hello"                        │
└─────────────────────────────────┘
```

**For Arabic Questions:**
- Show 2 input fields:
  1. Arabic script input (RTL)
  2. Transliteration input (LTR)
- Virtual keyboard suggestion (mobile)

**User Interactions:**
- Type answer
- Press Enter or click "Submit"
- Click "Skip this word"

**State Before Submit:**
```typescript
{
  phase: 'prompting',
  currentItem: {
    id: 'uuid-1',
    word: 'مرحبا',
    translation: 'hello',
    transliteration: 'marhaba'
  }
}
```

---

#### Step 7: Submit Answer (Validation)
**Component:** `useExercise.ts` - `submitAnswer()`
**User Action:** Click "Submit" or press Enter

**Validation Flow:**
```
1. Set isValidating = true (show spinner on button)
2. Check exact match (case-insensitive, trimmed)
   → If exact match: ✓ correct, skip API
3. If fuzzy: Call OpenAI evaluateAnswer()
   → GPT-4o semantic validation
   → Returns: { correct: boolean, feedback: string }
4. For Arabic: validate transliteration separately
5. Save answer result to state
6. Transition to 'feedback' phase
```

**OpenAI Call (if needed):**
```typescript
// lib/openai.ts - evaluateAnswer()
const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  temperature: 0.3,
  messages: [
    {
      role: 'system',
      content: 'You are validating language learning answers...'
    },
    {
      role: 'user',
      content: `User answer: "${userAnswer}"\nCorrect: "${correctAnswer}"`
    }
  ]
});
```

**Timing:**
- Exact match: 0ms (instant)
- API validation: 1-3 seconds

**State After Validation:**
```typescript
{
  phase: 'feedback',
  lastAnswer: {
    itemId: 'uuid-1',
    correct: true,
    userAnswer: 'marhaba',
    correctAnswer: 'مرحبا',
    feedback: 'Perfect!'
  }
}
```

---

#### Step 8: View Feedback
**Component:** `ExerciseFeedback.tsx`
**Phase:** `feedback`

**UI Layout:**
```
┌─────────────────────────────────────┐
│  ✓ Correct!                         │
│  مرحبا (marhaba) = hello            │
├─────────────────────────────────────┤
│  📖 Word Details                     │
│  - Dialect preference: Egyptian     │
│  - Letter breakdown: م ر ح ب ا      │
│  - Hebrew cognate: ברוך (blessing)  │
├─────────────────────────────────────┤
│  💡 Context                          │
│  Used as greeting, derived from...  │
├─────────────────────────────────────┤
│  🎨 Memory Aid                       │
│  [Generate Image] [Add Note]        │
├─────────────────────────────────────┤
│  💬 Save Decision                    │
│  [📚 Practice] [📦 Archive] [Skip]  │
├─────────────────────────────────────┤
│  [Continue →]                        │
└─────────────────────────────────────┘
```

**Components Rendered:**
- `WordDisplay` - Main word rendering
- `ContextTile` - Root/usage information
- `MemoryAidTile` - Collapsible memory aid generator
- `ChatTile` - AI tutor (if expanded)
- `SaveDecisionPanel` - Practice/Archive/Skip buttons
- Continue button

**Interactions:**
1. **Save Decision:**
   - Click "Practice" → Save to saved_words with status='active'
   - Click "Archive" → Save with status='learned'
   - Click "Skip" → Don't save

2. **Memory Aid:**
   - Expand tile → Show editor
   - Type note → Auto-save on blur
   - Click "Generate Image" → DALL-E 3 call (10-15s)

3. **Continue:**
   - Click "Continue" → Next question
   - Save decision processed first
   - State transitions to next item

---

#### Step 9: Save Word (If Selected)
**Hook:** `useSavedWords.ts` - `saveWord()`
**User Action:** Click "Practice" or "Archive"

**Database Operations:**
```sql
-- Check if word exists
SELECT id FROM saved_words WHERE word = 'مرحبا';

-- If exists: UPDATE
UPDATE saved_words
SET status = 'active',
    translation = 'hello',
    pronunciation_standard = 'marhaba',
    letter_breakdown = '[{...}]',
    updated_at = NOW()
WHERE word = 'مرحبا';

-- If not exists: INSERT
INSERT INTO saved_words (word, translation, status, ...)
VALUES ('مرحبا', 'hello', 'active', ...);

-- Insert context
INSERT INTO word_contexts (saved_word_id, content_type, full_text, ...)
VALUES (uuid, 'word', 'مرحبا', ...);
```

**Timing:**
- Check: 100-200ms
- Insert: 150-300ms
- Total: 250-500ms

**UI Feedback:**
- Button shows spinner during save
- On success: Checkmark for 2 seconds
- On error: Error message, retry button

**State Changes:**
```typescript
// Optimistic update
setSavedWords(prev => [...prev, newWord]);

// On error: rollback
setSavedWords(prev => prev.filter(w => w.id !== tempId));
```

---

#### Step 10: Continue to Next Question
**Hook:** `useExercise.ts` - `continueToNext()`
**State Transition:** `feedback` → `prompting`

**State Updates:**
```typescript
{
  phase: 'prompting',
  currentIndex: 1, // incremented
  currentItem: vocabItems[queue[1]], // next item
  answers: [...previousAnswers, lastAnswer] // append
}
```

**Progress Saved (localStorage):**
```typescript
localStorage.setItem(`exercise-progress-${lessonId}`, JSON.stringify({
  version: 2,
  queue: ['id2', 'id3', 'id4'...], // remaining
  currentPos: 1,
  answers: [{ itemId: 'id1', correct: true, ... }],
  savedAt: Date.now()
}));
```

**UI Updates:**
- Progress bar: First segment turns green
- Question counter: "2 of 7"
- New question slides in
- Input cleared and focused

---

#### Step 11: Complete All Questions
**Component:** `ExerciseView.tsx` - Completion screen
**Trigger:** Last question answered → `continueToNext()` → `phase: 'complete'`

**onComplete Callback:**
```typescript
// useExercise hook
onComplete(answers);

// ExerciseView handler
await saveProgress({
  lessonId,
  language: 'arabic',
  answers
});

// Update mastery levels
for (const result of answers) {
  await updateVocabularyMastery(result.itemId, result.correct);
}
```

**Database Operations:**
```sql
-- Save completion record
INSERT INTO lesson_progress (lesson_id, language, score, items_practiced)
VALUES ('uuid', 'arabic', 85, 7);

-- Update mastery levels
UPDATE vocabulary_items
SET mastery_level = CASE
    WHEN times_practiced >= 5 AND (times_correct::float / times_practiced) >= 0.8 THEN 'mastered'
    WHEN times_practiced >= 3 THEN 'practiced'
    ELSE 'learning'
  END,
  times_practiced = times_practiced + 1,
  last_reviewed = NOW()
WHERE id IN ('id1', 'id2'...);
```

**Completion UI:**
```
┌─────────────────────────────────┐
│  Lesson Complete!               │
│                                 │
│      ┌─────────┐                │
│      │   85%   │                │
│      └─────────┘                │
│                                 │
│  You got 6 out of 7 correct    │
│                                 │
│  Excellent work!               │
│                                 │
│  [Done]                        │
└─────────────────────────────────┘
```

**Score Calculation:**
```typescript
const score = Math.round((correctCount / totalItems) * 100);

const message = score >= 80 ? 'Excellent work!'
             : score >= 50 ? 'Good effort! Keep practicing.'
             : 'Keep going, you\'ll get it!';

const color = score >= 80 ? 'green'
            : score >= 50 ? 'amber'
            : 'red';
```

**User Action:** Click "Done" → Navigate to MainMenu

---

### Flow 1 Summary

**Total Steps:** 11
**Decision Points:** 5 (generate lesson, answer each question, save decisions, complete)
**API Calls:** 2-10 (1 generation + N validations)
**Database Operations:** 10-20 (inserts, updates, queries)
**Total Duration:** 10-15 minutes
**Success Rate:** ~85% (based on typical user patterns)

**Critical Path:**
1. Generate lesson (most expensive: 6-11s)
2. Answer validation (per question: 1-3s if using AI)
3. Save words (per save: 250-500ms)

**Bottlenecks:**
1. OpenAI API latency (mitigate: exact match bypass)
2. DALL-E generation (10-15s - only if user requests)
3. Database batch inserts (optimize: single transaction)

---

## Flow 2: Quick Word Lookup

**Goal:** Translate a single word/phrase quickly and optionally save it

**Entry Point:** MainMenu → "Lookup" tile → LookupView

**Success Criteria:** View translation, optionally save word

**Average Duration:** 45 seconds

### Step-by-Step Flow

#### Step 1: Navigate to Lookup
**Component:** `MainMenu.tsx`
**Route:** `/` → `/lookup`
**State:** None
**Duration:** 100ms

---

#### Step 2: Enter Text
**Component:** `LookupView.tsx`
**User Action:** Paste or type Arabic/English text

**UI:**
```
┌─────────────────────────────────────┐
│  Lookup                        [AR] │
├─────────────────────────────────────┤
│  ┌───────────────────────────────┐ │
│  │ Paste Arabic text or type     │ │
│  │ English...                    │ │
│  │                               │ │
│  │                               │ │
│  └───────────────────────────────┘ │
│                                     │
│  [Translate]                        │
└─────────────────────────────────────┘
```

**Auto-Detection:**
```typescript
const detectContentType = (text: string): 'word' | 'sentence' | 'passage' => {
  const sentences = text.split(/[.؟!]\s+/).filter(s => s.trim());
  if (sentences.length >= 2) return 'passage';
  if (/[.؟!،]/.test(text)) return 'sentence';
  return 'word';
};
```

---

#### Step 3: Submit for Translation
**User Action:** Click "Translate"
**API Call:** OpenAI GPT-4o - `lookupWord()`

**Request:**
```typescript
const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  temperature: 0.3,
  response_format: { type: 'json_object' },
  messages: [
    {
      role: 'system',
      content: 'You are a translation expert for Arabic...'
    },
    {
      role: 'user',
      content: `Translate: "${input}"`
    }
  ]
});
```

**Response Structure:**
```typescript
interface LookupResult {
  detected_language: 'arabic' | 'english';
  arabic_word: string;
  arabic_word_egyptian?: string;
  translation: string;
  pronunciation_standard: string;
  pronunciation_egyptian?: string;
  letter_breakdown: LetterBreakdown[];
  hebrew_cognate?: HebrewCognate;
  word_context: {
    root: string;
    usage: string;
    cultural_note?: string;
  };
  example_sentences: ExampleSentence[];
}
```

**Timing:**
- API call: 2-5 seconds
- Parse: 50ms
- Render: 100ms
**Total:** 2.5-5.5 seconds

**UI Feedback:**
- Button spinner
- Text: "Translating..."
- Disable input

---

#### Step 4: Display Results
**Component:** `WordDisplay`

**Layout:**
```
┌─────────────────────────────────────┐
│  Arabic → English                   │
├─────────────────────────────────────┤
│        مرحبا                        │
│       marhaba                       │
│        hello                        │
├─────────────────────────────────────┤
│  🇪🇬 Egyptian: marhaba (same)       │
│  📖 MSA: marhaba                    │
├─────────────────────────────────────┤
│  📝 Context                          │
│  Root: ر-ح-ب (welcoming)           │
│  Usage: Standard greeting           │
├─────────────────────────────────────┤
│  🎨 Memory Aid                       │
│  [Collapsed by default]             │
├─────────────────────────────────────┤
│  📚 Example Sentences (3)            │
│  [Collapsed by default]             │
├─────────────────────────────────────┤
│  [📚 Practice] [📦 Archive] [Skip]  │
└─────────────────────────────────────┘
```

**Collapsible Sections:**
- Example sentences (default: collapsed)
- Memory aid (default: collapsed)
- Hebrew cognate (if available, default: expanded)

---

#### Step 5: Optional - Generate Memory Aid
**User Action:** Expand Memory Aid tile → Click "Generate Image"
**API Call:** DALL-E 3

**Request:**
```typescript
const image = await openai.images.generate({
  model: 'dall-e-3',
  prompt: `Create a visual mnemonic for remembering the Arabic word "${word}" meaning "${translation}". ${userCustomPrompt}`,
  size: '1024x1024',
  quality: 'standard',
  response_format: 'b64_json'
});
```

**Timing:**
- Generation: 10-15 seconds
- Display: instant (base64)

**UI:**
- Button shows spinner
- Text: "Generating image..."
- Progress indicator (fake animation)

**Result:**
- Image displayed in tile
- Auto-saved to state (not DB until word saved)

---

#### Step 6: Save Word
**User Action:** Click "Practice" or "Archive"
**Hook:** `useSavedWords.saveWord()`

**Database:**
```sql
INSERT INTO saved_words (
  word, translation,
  pronunciation_standard, pronunciation_egyptian,
  letter_breakdown, hebrew_cognate, example_sentences,
  status, memory_note, memory_image_url,
  language
) VALUES (
  'مرحبا', 'hello',
  'marhaba', NULL,
  '[...]', '{...}', '[...]',
  'active', 'Sounds like "mar-ha-ba"', 'data:image/png;base64,...',
  'arabic'
);

INSERT INTO word_contexts (
  saved_word_id, content_type, full_text, full_translation, source
) VALUES (
  uuid, 'lookup', 'مرحبا', 'hello', NULL
);
```

**Timing:** 400-600ms

**UI Feedback:**
- Button spinner
- Success: Checkmark for 2s, then "✓ Saved to Practice"
- Error: Red message, retry button

---

#### Step 7: (Optional) View in Vocabulary
**User Action:** Click link "View in My Vocabulary"
**Route:** `/lookup` → `/saved`
**Filter:** Automatically show newly saved word

---

### Flow 2 Summary

**Total Steps:** 5-7 (depending on optional actions)
**Decision Points:** 2 (translate, save)
**API Calls:** 1-2 (lookup, optional DALL-E)
**Database Operations:** 2 (if saving)
**Total Duration:** 30-60 seconds (45s average)

**Critical Path:**
- OpenAI lookup (2-5s) - cannot be optimized much
- Optional DALL-E (10-15s) - user-initiated

---

## Flow 3: Vocabulary Management

**Goal:** Browse, organize, and manage saved vocabulary words

**Entry Point:** MainMenu → "My Vocabulary" → VocabularyLanding → MyVocabularyView

**Success Criteria:** View and organize saved words

**Average Duration:** 5-10 minutes

### Step-by-Step Flow

#### Step 1: Navigate to Vocabulary Landing
**Route:** `/` → `/vocabulary`
**Component:** `VocabularyLanding.tsx`

**UI:**
```
┌─────────────────────────────────┐
│  My Vocabulary              [AR]│
├─────────────────────────────────┤
│  ┌─────────────┐                │
│  │ 📚 Words    │                │
│  │ 47 saved    │                │
│  └─────────────┘                │
│  ┌─────────────┐                │
│  │ 💬 Sentences│                │
│  │ 12 saved    │                │
│  └─────────────┘                │
│  ┌─────────────┐                │
│  │ 📄 Passages │                │
│  │ 3 saved     │                │
│  └─────────────┘                │
│  ┌─────────────┐                │
│  │ 🔍 Lookup   │                │
│  └─────────────┘                │
└─────────────────────────────────┘
```

**Statistics Query:**
```sql
SELECT COUNT(*) as total_words FROM saved_words WHERE language = 'arabic';
SELECT COUNT(*) as total_sentences FROM saved_sentences WHERE language = 'arabic';
SELECT COUNT(*) as total_passages FROM saved_passages WHERE language = 'arabic';
```

---

#### Step 2: View Words List
**Route:** `/vocabulary` → `/saved` (or `/vocabulary/words`)
**Component:** `MyVocabularyView.tsx`
**Hook:** `useSavedWords()`

**Initial Data Fetch:**
```sql
SELECT * FROM saved_words
WHERE language = 'arabic'
  AND status IN ('active', 'learned')
ORDER BY created_at DESC;

-- For each word, fetch contexts
SELECT * FROM word_contexts
WHERE saved_word_id IN (...);
```

**Timing:**
- Query: 300-800ms (depends on count + images)
- Render: 200-400ms
**Total:** 500-1200ms

**Loading State:**
- 3 skeleton cards
- Search bar skeleton
- Filter chips skeleton

---

#### Step 3: Filter and Search
**Component:** `MyVocabularyView.tsx`
**UI Elements:**
- Search bar (top)
- Filter chips: Practice | Archive
- Sort dropdown: Recent | A-Z (Arabic) | A-Z (English)

**Filter Application:**
```typescript
// Search (debounced)
const [debouncedQuery, setDebouncedQuery] = useState('');

useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedQuery(searchQuery);
  }, 300);
  return () => clearTimeout(timer);
}, [searchQuery]);

// Filter query
let query = supabase.from('saved_words').select('*');

if (statusFilter !== 'all') {
  query = query.eq('status', statusFilter);
}

if (debouncedQuery) {
  const searchTerm = `%${debouncedQuery}%`;
  query = query.or(`word.ilike.${searchTerm},translation.ilike.${searchTerm}`);
}
```

**Interactions:**
- Type in search → 300ms debounce → refetch
- Click filter chip → instant UI update → refetch
- Change sort → instant re-sort (client-side)

---

#### Step 4: View Word Details
**User Action:** Click word card
**Component:** `WordDetailModal`

**Modal Content:**
```
┌─────────────────────────────────────┐
│  [<] [>]  🟢 Practice       [X]     │
├─────────────────────────────────────┤
│                                     │
│          مرحبا                      │
│         marhaba                     │
│          hello                      │
│                                     │
├─────────────────────────────────────┤
│  Letter Breakdown                   │
│  م (meem) - "m"                     │
│  ر (raa) - "r"                      │
│  ...                                │
├─────────────────────────────────────┤
│  Hebrew Cognate                     │
│  ברוך (baruch) - blessing           │
├─────────────────────────────────────┤
│  Found In (2 contexts)              │
│  - مرحبا بك (Welcome to you)        │
│  - مرحبا كيف حالك (Hello how are you)│
├─────────────────────────────────────┤
│  Memory Aid                          │
│  [Image] [Note]                     │
├─────────────────────────────────────┤
│  [📚 Move to Archive] [🗑️ Delete]   │
└─────────────────────────────────────┘
```

**Navigation:**
- Arrow buttons: Previous/Next word in filtered list
- Click outside: Close modal
- Keyboard: Escape to close, Arrow keys to navigate

---

#### Step 5: Edit Memory Aid
**Component:** `MemoryAidEditor` (inside modal)
**User Actions:**
1. Edit text note → Auto-save on blur
2. Generate/regenerate image → DALL-E call
3. Delete image → Confirmation

**Auto-Save:**
```typescript
<textarea
  value={note}
  onChange={(e) => setNote(e.target.value)}
  onBlur={async () => {
    await updateMemoryAids(wordId, { memory_note: note });
  }}
/>
```

**Database:**
```sql
UPDATE saved_words
SET memory_note = 'New note',
    updated_at = NOW()
WHERE id = 'uuid';
```

---

#### Step 6: Change Status or Delete
**User Actions:**
- Click "Move to Archive" → Update status
- Click "Delete" → Remove word + contexts

**Update Status:**
```sql
UPDATE saved_words
SET status = 'learned',
    updated_at = NOW()
WHERE id = 'uuid';
```

**Delete (CASCADE):**
```sql
DELETE FROM saved_words WHERE id = 'uuid';
-- Automatically deletes word_contexts (ON DELETE CASCADE)
```

**UI Feedback:**
- Optimistic update (remove from list immediately)
- Show toast: "Word archived" / "Word deleted"
- Undo button (5 second window)

---

### Flow 3 Summary

**Total Steps:** 3-6 (browse, filter, view, edit)
**API Calls:** 0-1 (only if regenerating image)
**Database Operations:** 1-5 (queries, updates, deletes)
**Total Duration:** 5-10 minutes

---

## Flow 4: Practice Saved Words

**Goal:** Quiz on selected saved vocabulary

**Entry Point:** MyVocabularyView → Selection Mode → Practice

**Success Criteria:** Complete practice session

**Average Duration:** 5-10 minutes

### Step-by-Step Flow

#### Step 1: Enter Selection Mode
**Component:** `MyVocabularyView.tsx`
**User Action:** Click "Practice" button (top right)

**State Changes:**
```typescript
setSelectionMode(true);
setSelectedIds(new Set());
```

**UI Changes:**
- Back button → "Exit selection"
- Word cards show checkboxes
- Bottom bar appears: "Practice selected words"
- Action buttons: "Select All" | "Clear"

---

#### Step 2: Select Words
**User Actions:**
- Click word cards to toggle selection
- Click "Select All" to select all visible
- Click "Clear" to deselect all

**State:**
```typescript
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

const toggleSelection = (id: string) => {
  setSelectedIds(prev => {
    const next = new Set(prev);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    return next;
  });
};
```

**UI Feedback:**
- Selected cards show ring border
- Checkbox filled
- Count in bottom bar: "Practice 5 words"

---

#### Step 3: Start Practice
**User Action:** Click "Practice N words" button
**Navigation:** `/saved` → `/exercise/saved?ids=id1,id2,id3`

**Route Parameters:**
```
/exercise/saved?ids=uuid1,uuid2,uuid3,uuid4,uuid5
```

**Component:** `ExerciseView.tsx` with special mode

**Data Fetch:**
```typescript
const isSavedPractice = lessonId === 'saved';
const savedItemIds = searchParams.get('ids')?.split(',');

// Fetch from saved_words table
const { vocabulary } = useVocabulary({
  fromSavedWords: true,
  itemIds: savedItemIds
});
```

**Query:**
```sql
SELECT * FROM saved_words
WHERE id IN ('uuid1', 'uuid2', 'uuid3', 'uuid4', 'uuid5')
  AND language = 'arabic';
```

---

#### Step 4-10: Practice Flow
**Same as Flow 1, Steps 6-11** (Answer questions, view feedback, save/update)

**Key Differences:**
- Source: `saved_words` instead of `vocabulary_items`
- Already saved: Skip save decision, show update options
- Mastery tracking: Update `times_practiced`, `times_correct`
- Progress: Not saved (ephemeral practice session)

---

#### Step 11: Update Practice Stats
**After each answer:**
```sql
UPDATE saved_words
SET times_practiced = times_practiced + 1,
    times_correct = times_correct + (CASE WHEN $1 THEN 1 ELSE 0 END),
    last_practiced = NOW()
WHERE id = 'uuid';
```

**UI Feedback:**
- Stats visible in word detail: "Practiced 5 times (80% correct)"

---

#### Step 12: Complete Practice
**Component:** Same completion screen as Flow 1

**User Action:** Click "Done" → Navigate back to `/saved`

**State:** Selection mode cleared, list refreshed

---

### Flow 4 Summary

**Total Steps:** 12
**Decision Points:** 1 (select words)
**API Calls:** N (answer validations)
**Database Operations:** N (stat updates)
**Total Duration:** 5-10 minutes

---

## Flow 5: Passage Analysis

**Goal:** Deep analysis of multi-sentence Arabic text

**Entry Point:** LookupView → Paste paragraph → Translate

**Success Criteria:** Understand passage, save sentences/words

**Average Duration:** 10-20 minutes

### Step-by-Step Flow

#### Step 1: Paste Passage
**Component:** `LookupView.tsx`
**User Action:** Paste multi-sentence text

**Example Input:**
```
مرحبا! كيف حالك؟ أنا بخير. شكرا لك.
```

**Auto-Detection:**
```typescript
const sentences = text.split(/[.؟!]\s+/).filter(s => s.trim());
// 3 sentences detected → mode = 'passage'
```

---

#### Step 2: Analyze Passage
**API Call:** `analyzePassage()` - GPT-4o
**Timing:** 5-10 seconds

**Request:**
```typescript
const response = await openai.chat.completions.create({
  model: 'gpt-4o',
  temperature: 0.3,
  response_format: { type: 'json_object' },
  messages: [
    {
      role: 'system',
      content: 'Analyze this Arabic passage sentence by sentence...'
    },
    {
      role: 'user',
      content: text
    }
  ]
});
```

**Response Structure:**
```typescript
interface PassageResult {
  detected_language: 'arabic' | 'english';
  original_text: string;
  full_translation: string;
  full_transliteration?: string;
  sentences: Array<{
    arabic_msa: string;
    arabic_egyptian: string;
    transliteration_msa: string;
    transliteration_egyptian: string;
    translation: string;
    explanation?: string;
    words: Array<{
      arabic: string;
      arabic_egyptian?: string;
      translation: string;
      transliteration: string;
      transliteration_egyptian?: string;
      part_of_speech: string;
    }>;
  }>;
}
```

---

#### Step 3: Display Sentence Breakdown
**Component:** `LookupView.tsx` - Passage mode

**UI:**
```
┌─────────────────────────────────────┐
│  🇪🇬 Egyptian  📖 MSA               │
│  [Save Passage to Practice]         │
├─────────────────────────────────────┤
│  📝 English Translation             │
│  Hello! How are you? I am fine.     │
│  Thank you.                         │
├─────────────────────────────────────┤
│  Sentence 1              [💬 Save]  │
│  🇪🇬 مرحبا!                         │
│      marhaba!                       │
│  📖 مرحبا!                          │
│      marhaba!                       │
│  → Hello!                           │
│                                     │
│  Word Breakdown (1 word) [View]     │
├─────────────────────────────────────┤
│  Sentence 2              [💬 Save]  │
│  🇪🇬 ازيك؟                          │
│      izzayak?                       │
│  📖 كيف حالك؟                        │
│      kayfa haaluk?                  │
│  → How are you?                     │
│  💡 Egyptian is more casual         │
│                                     │
│  Word Breakdown (2 words) [View]    │
├─────────────────────────────────────┤
│  ... more sentences ...             │
└─────────────────────────────────────┘
```

**Dialect Toggle:**
- Default: Egyptian shown prominently
- Toggle to MSA-first view
- Preference saved to localStorage

---

#### Step 4: Click Sentence for Detail
**User Action:** Click "View" on word breakdown
**State Change:** `selectedSentence = sentences[i]`, `mode = 'sentence'`

**Sentence Detail View:**
```
┌─────────────────────────────────────┐
│  [← Back to Passage]                │
├─────────────────────────────────────┤
│          كيف حالك؟                   │
│         kayfa haaluk?               │
│         How are you?                │
├─────────────────────────────────────┤
│  Context                             │
│  Polite inquiry about wellbeing     │
├─────────────────────────────────────┤
│  Word Breakdown                      │
│  ├─ كيف (kayfa) - how               │
│  │  Adverb                          │
│  ├─ حال (haal) - condition          │
│  │  Noun                            │
│  └─ ك (-k) - your (masc.)           │
│     Pronoun suffix                  │
├─────────────────────────────────────┤
│  [💬 Save to Practice] [Archive]    │
└─────────────────────────────────────┘
```

---

#### Step 5: Click Word for Deep Dive
**Component:** `WordDetailModal`
**Trigger:** Click word in breakdown

**Modal shows:**
- Word in all forms
- Letter breakdown
- Hebrew cognate (if available)
- Usage examples
- Save to My Words option

**State:**
```typescript
setWordSelection({
  selectedText: 'كيف',
  parentSentence: 'كيف حالك؟',
  sourceView: 'lookup',
  contentType: 'word'
});
```

---

#### Step 6: Save Actions
**User can save:**
1. **Entire passage** (if 2+ sentences)
   - Saved to `saved_passages` table
   - Status: Practice or Archive

2. **Individual sentences**
   - Saved to `saved_sentences` table
   - Includes both dialects

3. **Individual words**
   - Saved to `saved_words` table
   - Includes contexts from sentence

**Database:**
```sql
-- Save passage
INSERT INTO saved_passages (
  original_text, source_language, full_translation,
  sentence_count, enrichment_data, status
) VALUES (
  'مرحبا! كيف حالك؟...', 'arabic', 'Hello! How are you?...',
  3, '{"sentences": [...]}', 'active'
);

-- Save sentence
INSERT INTO saved_sentences (
  arabic_text, arabic_egyptian, transliteration,
  transliteration_egyptian, translation, status
) VALUES (
  'كيف حالك؟', 'ازيك؟', 'kayfa haaluk', 'izzayak', 'How are you?', 'active'
);

-- Save word
INSERT INTO saved_words (word, translation, ...) VALUES ('كيف', 'how', ...);
INSERT INTO word_contexts (saved_word_id, full_text, ...)
VALUES (uuid, 'كيف حالك؟', ...);
```

---

### Flow 5 Summary

**Total Steps:** 6+ (explore, save items)
**Decision Points:** Multiple (which items to save)
**API Calls:** 1 (passage analysis)
**Database Operations:** 0-10 (depending on saves)
**Total Duration:** 10-20 minutes

**Unique Features:**
- Multi-level navigation (passage → sentence → word)
- Dialect comparison (Egyptian vs MSA)
- Hierarchical saving (passage, sentence, word)

---

## Critical Paths & Bottlenecks

### Performance Bottlenecks

#### 1. AI Generation Times
| Operation | Model | Average Time | Mitigation |
|-----------|-------|--------------|------------|
| Lesson generation | GPT-4o | 5-10s | Pre-generate common topics |
| Answer validation | GPT-4o | 1-3s | Exact match bypass |
| Word lookup | GPT-4o | 2-5s | Cache common translations |
| Passage analysis | GPT-4o | 5-10s | Limit to 500 chars |
| DALL-E image | DALL-E 3 | 10-15s | User-initiated only |

**Critical:** Answer validation in practice flow blocks progression

**Recommendation:**
```typescript
// Check exact match first (0ms)
if (normalizeAnswer(user) === normalizeAnswer(correct)) {
  return { correct: true, feedback: 'Perfect!' };
}
// Only call API for fuzzy matching
```

---

#### 2. Database Query Times
| Query | Average Time | Optimization |
|-------|--------------|--------------|
| Fetch saved words (100) | 800ms | Pagination |
| Fetch with contexts (100) | 1.2s | Pagination + eager loading |
| Search saved words | 400ms | Full-text index (done) |
| Insert word + context | 400ms | Single transaction |
| Update mastery levels | 150ms | Batch update |

**Critical:** Loading My Vocabulary with 100+ words

**Recommendation:**
- Implement pagination (20 per page)
- Lazy load contexts on modal open
- Migrate images to storage (reduce row size)

---

#### 3. Memory Aid Image Storage
**Current:** Base64 in database (300KB per word)
**Problem:**
- 100 words = 30MB database size
- Slow queries (must load all images)
- Network overhead

**Recommendation:**
```typescript
// Upload to Supabase Storage
const { data } = await supabase.storage
  .from('memory-images')
  .upload(`${wordId}.png`, imageBlob);

// Store URL instead of base64
await supabase.from('saved_words').update({
  memory_image_url: data.publicUrl // 50 bytes vs 300KB
});
```

---

### User Experience Bottlenecks

#### 1. No Offline Mode
**Impact:** Cannot use app without internet
**Frequency:** High (mobile users)
**Recommendation:**
- Cache lessons in IndexedDB
- Service worker for offline functionality
- Sync queue for mutations

---

#### 2. Lost Progress on Exit
**Impact:** Lose 10-15 minutes of work
**Frequency:** Medium (accidental exits)
**Recommendation:**
- Persist to database (not just localStorage)
- Show exit confirmation
- Add "Resume lesson" feature

---

#### 3. No Cross-Device Sync
**Impact:** Cannot switch between phone/laptop
**Frequency:** Medium
**Recommendation:**
- Store progress in database
- Implement user authentication
- Real-time sync (Supabase subscriptions)

---

## Error Handling Flows

### Error Categories

| Category | Handling Strategy | User Feedback | Recovery |
|----------|------------------|---------------|----------|
| Network timeout | Retry with backoff | "Connection lost" toast | Retry button |
| API rate limit | Queue request | "Too many requests" | Wait + retry |
| OpenAI error | Retry 3x | "AI service unavailable" | Use fallback |
| Database error | Log + alert | "Failed to save" | Retry button |
| Validation error | Show inline | Red error message | Correct input |
| Auth error | Redirect to login | "Please sign in" | Login flow |

### Example: Answer Submission Error

```typescript
try {
  // 1. Set loading state
  setIsValidating(true);

  // 2. Call OpenAI
  const result = await evaluateAnswer(userAnswer, correctAnswer);

  // 3. Update state
  setLastAnswer(result);
  setPhase('feedback');

} catch (error) {
  // 4. Determine error type
  if (error.message.includes('rate_limit')) {
    // Rate limit - wait and retry
    setError('Too many requests. Waiting 30s...');
    await sleep(30000);
    await submitAnswer(userAnswer); // Retry

  } else if (error.message.includes('timeout')) {
    // Network timeout - retry
    setError('Connection timeout. Retrying...');
    await submitAnswer(userAnswer);

  } else {
    // Unknown error - show message
    setError('Failed to validate answer. Please try again.');
    // Don't auto-retry for unknown errors
  }

} finally {
  setIsValidating(false);
}
```

---

## State Persistence

### localStorage Keys

| Key | Content | Lifetime | Max Size |
|-----|---------|----------|----------|
| `language-app-selected-language` | 'arabic' \| 'spanish' | Permanent | 10 bytes |
| `exercise-progress-{lessonId}` | SavedProgressV2 | 24 hours | 5 KB |
| `egyptian-inference-cache` | MSA→Egyptian map | Permanent | 50 KB |
| `dialect-preference` | 'egyptian' \| 'standard' | Permanent | 10 bytes |

### Database Persistence

**saved_words table:**
- Purpose: User's vocabulary collection
- Lifetime: Until deleted by user
- Queries: Read on My Vocabulary view, practice sessions

**word_contexts table:**
- Purpose: Where each word was encountered
- Lifetime: CASCADE delete with saved_word
- Queries: Read on word detail modal

**lesson_progress table:**
- Purpose: Completion history
- Lifetime: Permanent (analytics)
- Queries: Read on resume lesson (NOT IMPLEMENTED)

**lessons + vocabulary_items tables:**
- Purpose: AI-generated lesson content
- Lifetime: Permanent (reusable)
- Queries: Read on Lesson Library, Exercise View

---

## Appendix: State Machine Diagrams

### Exercise State Machine

```
┌──────────┐
│ LOADING  │ (Initial state)
└────┬─────┘
     │ Fetch data
     ▼
┌──────────┐
│ RESUME?  │ (If saved progress exists)
└────┬─────┘
     │ User choice
     ├─ Resume ──────┐
     │               │
     └─ Start Fresh  │
                     ▼
              ┌──────────┐
         ┌────│PROMPTING │◄────┐
         │    └────┬─────┘     │
         │         │            │
         │    Submit answer     │
         │         │            │
         │    Validating...     │
         │         │            │
         │         ▼            │
         │    ┌─────────┐      │
         │    │FEEDBACK │      │
Skip word    └────┬─────┘      │
(move to end)     │             │
         │   Continue button    │
         │        │             │
         └────────┴─────────────┘
                  │
            All answered?
                  │
                  ▼
              ┌─────────┐
              │COMPLETE │
              └─────────┘
```

---

**Document Version:** 1.0
**Last Updated:** January 13, 2026
**Maintained By:** Development Team
