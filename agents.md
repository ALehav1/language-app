# agents.md - Language Learning App

## Project Overview
Language Learning App - AI-powered language learning that teaches how native speakers actually talk
Target: Non-technical adult learner learning Arabic (novice) and Spanish (intermediate)
Stack: React + TypeScript + Vite + Tailwind + Supabase + OpenAI

Last Updated: January 6, 2026 (Phase 15 Complete)

## What Makes This App Different
- Multiple content types: words, phrases, dialogs, paragraphs
- AI generates lessons appropriate to your level
- Semantic answer validation - accepts synonyms and typos
- Tracks what you know and struggle with using spaced repetition
- For Arabic: Hebrew cognates (static lookup table) + letter breakdown for character learning
- Save vocabulary items, sentences, and full passages for later review
- **Lookup any text** - paste Arabic OR English, get full translation + word-by-word breakdown
- Resume lessons from where you left off
- Desktop-optimized with 3-column layout
- NO gamification - no streaks, points, badges
- Designed for 5-10 minute sessions, often when you can't speak aloud

## Current State
- Status: Phase 15 Complete - Navigation Redesign + Lookup Enhancement
- Working features:
  - **MainMenu home screen** - 5 clear navigation options:
    - Lessons (teal) - Browse & create lessons
    - My Words (amber) - Saved vocabulary
    - My Sentences (purple) - Spoken Arabic phrases
    - My Passages (rose) - Full texts & dialogs
    - Lookup (blue, full-width) - Translate anything
  - **Lookup with auto-detection** - paste Arabic OR English text:
    - Auto-detects language (Arabic chars vs Latin chars)
    - Arabic → English translation with word breakdown
    - English → Arabic translation with Egyptian + MSA versions
    - Sentence-by-sentence breakdown for passages
    - Word-by-word breakdown with tap-to-save
    - Save individual words, sentences, or full passages
  - **Static Hebrew cognate table** - 150+ Arabic-Hebrew mappings based on Semitic roots
    - Much more reliable than AI inference
    - Includes common words: مكتب→כתב, سلام→שלום, بيت→בית, etc.
  - **My Sentences** - saved spoken Arabic phrases:
    - Egyptian Arabic primary, MSA for reference
    - Filter by status (active/learned)
    - Detail modal with full breakdown
  - **My Passages** - saved full texts:
    - Shows source language (EN→AR or AR→EN)
    - Full translation + transliteration
    - Mark as learned or delete
  - Lesson feed with card stack + "Start Lesson" button
  - **Direct lesson start** - clicking "Start Lesson" goes directly to exercise
  - **Direct to exercise after creation** - AI generates lesson → goes straight to exercise (no intermediate screen)
  - **Dialect selector** - choose Standard MSA or Egyptian Arabic when creating lessons
  - **Content type badge** on each lesson card
  - **Filter preferences remembered** - persists to localStorage
  - **AI lesson generation** via OpenAI - syncs with current filters, respects dialect choice
  - **Supabase integration** - all data persisted to database
  - **Exercise flow** with prompting, validation, and feedback
  - **Arabic dual-input mode** - type BOTH transliteration AND translation
  - **Transliteration validation** - generous fuzzy matching with Arabic chat numbers
  - **Semantic answer matching** via OpenAI
  - **Skip question** functionality during exercises
  - **Resume lessons** - progress saved to localStorage for 24 hours
  - **Segmented progress bar** - each word as colored segment
  - **Desktop 3-column layout** - sidebars with progress + stats
  - **Auto-save vocabulary** - all practiced Arabic words automatically saved
  - **Unified WordDetailCard** - same rich display everywhere:
    - Arabic word with vowels
    - Both dialect pronunciations (MSA + Egyptian)
    - Example sentences (Egyptian first, MSA second)
    - Hebrew cognate from static lookup table
    - Letter breakdown (RTL)
  - **Practice saved words** - select words and practice as custom lesson
  - **Arabic letter breakdown** - horizontal, right-to-left display
  - Progress persistence to Supabase on lesson completion
  - Spaced repetition mastery tracking per vocabulary item
  - Loading and error states for async operations
  - Glassmorphism UI with dark theme
  - Touch-friendly design (48px+ targets)
  - **Design polish** (Phase 9):
    - Skeleton loading with shimmer animation
    - Heart pop animation when saving words
    - Progress bar glow for correct/incorrect segments
    - Softer modal backdrops (bg-black/60 + backdrop-blur-md)
    - btn-primary gradient with active:scale-95
    - Custom .font-arabic and .font-hebrew classes
  - **Bug fixes & UX** (Phase 10):
    - Skip progress saving - skipping saves progress for resume
    - Mastery regression - incorrect answers regress mastery level
    - Exit confirmation modal during exercises
    - Browser beforeunload warning during exercises
    - Skeleton loading in ExerciseView
    - OpenAI retry logic with exponential backoff
    - Undo card swipes (5-second toast)
    - Improved transliteration (q/k equivalence, double consonants)
    - Saved Words uses browser history for back navigation
    - Consistent "Ready to learn?" empty state for all content types
  - **Multi-word & dialect** (Phase 11):
    - Arabic dialect selector (Standard MSA or Egyptian Arabic)
    - Letter breakdown shows each word on its own line for phrases
    - Hebrew cognates checked per word in phrases (e.g., العمل → עמל)
    - Check Answer button lights up when answer is filled (btn-primary gradient)
  - **My Vocabulary overhaul** (Phase 12):
    - New `saved_words` and `word_contexts` database tables
    - Word-centric data model with source context preservation
    - Dialect pronunciations: Standard MSA + Egyptian Arabic for each word
    - **Bottom navigation** - Lessons + My Words tabs (vocabulary now prominent)
    - **My Vocabulary screen** - search, filter by status, sort options
    - Status tracking: active → learned (simplified in Phase 13)
    - Word detail modal with full breakdown and source contexts
    - Selection mode for custom practice sessions
    - **Lookup Mode** - type any word (English/Arabic) for full breakdown
    - Floating + button to add words via lookup
    - Save words directly from lookup results
  - **Unified word tracking** (Phase 13):
    - Simplified status model: `active` (practicing) vs `learned` (archived)
    - All practiced Arabic words auto-save to `saved_words` with 'active' status
    - Delete functionality for permanently removing words
    - Changed hamburger icon to filter/sliders icon (better signals popup menu)
    - Exercise feedback fetches both dialect pronunciations + Hebrew cognates dynamically
  - **Egyptian Arabic focus** (Phase 14):
    - Example sentences show BOTH dialects: Egyptian (spoken) first, MSA (formal) second
    - Egyptian displayed prominently with 🇪🇬 flag, amber color
    - MSA shown for reference with 📖 book icon, teal color
    - Real Egyptian vocabulary (شُغْل not عَمَل for "work")
    - Letter breakdown for Egyptian word variant
    - Grammar explanations noting dialect differences
  - **Word deduplication** (Phase 14):
    - New lessons avoid words you've already practiced
    - AI excludes up to 50 saved words when generating lessons
    - Ensures fresh content every time
- Known limitations:
  - Card swipe state stored in localStorage, not Supabase
  - No audio playback yet
  - No user authentication (single-user app)

## Content Types

| Type | Items | Description |
|------|-------|-------------|
| `word` | 7 | Individual vocabulary |
| `phrase` | 5 | Common expressions (2-6 words) |
| `dialog` | 4 | Conversation lines with Speaker A/B |
| `paragraph` | 2 | Reading passages (2-4 sentences) |

## Routes
| Path | Component | Description |
|------|-----------|-------------|
| `/` | `MainMenu` | Home screen with 5 navigation options |
| `/lessons` | `LessonFeed` | Browse & create lessons |
| `/exercise/:lessonId` | `ExerciseView` | Translation exercise flow |
| `/exercise/saved?ids=...` | `ExerciseView` | Practice selected saved words |
| `/words` | `MyVocabularyView` | Browse, filter, and practice saved vocabulary |
| `/saved` | `MyVocabularyView` | Legacy route (redirects to /words) |
| `/sentences` | `MySentencesView` | Browse and review saved sentences |
| `/passages` | `MyPassagesView` | Browse and review saved passages |
| `/lookup` | `LookupView` | Translate any Arabic or English text |

## Priority Features

### Completed
1. Mobile-first interface
2. Core exercise flow (display → respond → feedback)
3. Arabic: Clear script + transliteration + Hebrew cognates + letter breakdown
4. Supabase integration (lessons, vocab, progress)
5. Learning state tracking (spaced repetition)
6. AI-generated lessons via OpenAI
7. Semantic matching for answers via OpenAI (accepts synonyms, typos, alternative meanings)
8. Skip question functionality
9. Save vocabulary items
10. Browse saved vocabulary
11. Content types (word, phrase, dialog, paragraph)
12. Resume lessons from saved progress
13. Segmented progress bar
14. Desktop 3-column layout
15. Persistent language/content type preferences
16. Generator syncs with current filters
17. Arabic dual-input mode (transliteration + translation)
18. Transliteration validation with Arabic chat numbers (7, 5, 3, etc.) and generous fuzzy matching
19. Actionable empty states with "Create Lesson" button
20. Direct lesson start (no preview modal)
21. Polished bottom sheet menu (colored buttons, gradient styling, max-width)
22. "Write in English" instructions (clearer than "Translate")
23. Language toggle (Arabic/Spanish only)
24. Create Lesson always accessible from main menu (no floating button)
25. Horizontal RTL letter breakdown matching Arabic reading order
26. Enhanced saved words with detail modal and practice mode
27. Selection mode for choosing which saved words to practice
28. Custom exercise route for practicing saved words (`/exercise/saved?ids=...`)
29. Design polish: skeleton loading, heart pop animation, progress glow, softer modals
30. btn-primary gradient class for consistent button styling
31. Custom Arabic/Hebrew font classes
32. Skip progress saving for resume capability
33. Mastery regression on incorrect answers
34. Exit confirmation modal during exercises
35. OpenAI retry logic with exponential backoff
36. Undo card swipes with 5-second toast
37. Improved transliteration tolerance (q/k, double consonants)
38. Action button labels (Skip, Later, Save)
39. Saved Words back navigation uses browser history
40. Consistent empty state for all content types

### Remaining (P2)
1. Audio playback with speed toggle
2. Review Mode for weak vocabulary
3. Root word explanations for Arabic
4. Speech input

## Key Files

### Features
- `src/features/home/MainMenu.tsx` - Home screen with 5 navigation tiles
- `src/features/lessons/LessonFeed.tsx` - Lesson discovery with bottom sheet menu
- `src/features/lessons/LessonGenerator.tsx` - AI lesson creation (syncs with current filters)
- `src/features/exercises/ExerciseView.tsx` - Exercise flow with desktop sidebars + resume
- `src/features/exercises/ExercisePrompt.tsx` - Adaptive content display
- `src/features/exercises/ExerciseFeedback.tsx` - Result display with save button
- `src/features/vocabulary/MyVocabularyView.tsx` - Browse, detail modal, selection mode, practice saved words
- `src/features/sentences/MySentencesView.tsx` - Browse and review saved sentences
- `src/features/passages/MyPassagesView.tsx` - Browse and review saved passages
- `src/features/lookup/LookupView.tsx` - Translate any text with word-by-word breakdown

### Hooks
- `src/hooks/useExercise.ts` - Exercise session state + resume + skip
- `src/hooks/useLessons.ts` - Fetch lessons with language + content type filters
- `src/hooks/useVocabulary.ts` - Fetch vocabulary by lessonId or specific itemIds
- `src/hooks/useLessonProgress.ts` - Save progress + update mastery
- `src/hooks/useSavedWords.ts` - Save/remove vocabulary words
- `src/hooks/useSavedSentences.ts` - Save/remove sentences
- `src/hooks/useSavedPassages.ts` - Save/remove full passages

### Lib
- `src/lib/supabase.ts` - Supabase client
- `src/lib/openai.ts` - OpenAI client + content generation + answer validation + passage analysis

### Utils
- `src/utils/arabicLetters.ts` - Arabic letter breakdown generator (28 letters + diacritics)
- `src/utils/transliteration.ts` - Transliteration validation with Levenshtein distance
- `src/utils/hebrewCognates.ts` - Static Hebrew cognate lookup table (150+ mappings)

### Types
- `src/types/database.ts` - All database types including ContentType
- `src/types/lesson.ts` - UI state types

## Database Schema

### Tables
- `lessons` - Lesson metadata (title, description, language, difficulty, content_type)
- `vocabulary_items` - Content with translations, hebrew_cognate, letter_breakdown, speaker, context
- `lesson_progress` - Completed lessons with scores
- `saved_words` - User's saved vocabulary words
- `word_contexts` - Source context for saved words
- `saved_sentences` - User's saved spoken Arabic phrases
- `saved_passages` - User's saved full text passages

### Content Type Enum
```sql
CREATE TYPE content_type AS ENUM ('word', 'phrase', 'dialog', 'paragraph');
```

### Hebrew Cognate Format (Arabic only)
```json
{
  "root": "אחד",
  "meaning": "one",
  "notes": "Same Semitic root - echad/wahid"
}
```

### Letter Breakdown Format (Arabic only)
```json
[
  { "letter": "م", "name": "Meem", "sound": "m" },
  { "letter": "ر", "name": "Ra", "sound": "r" }
]
```

### Dialog Fields
- `speaker`: "A" or "B"
- `context`: Stage direction (e.g., "pointing at menu")

## OpenAI Integration

### Lesson Generation (`generateLessonContent`)
- Accepts content type parameter
- Generates different prompts per content type
- Dialog includes speaker and context fields
- Hebrew cognates ONLY for genuine Semitic connections (Arabic words only)
- Letter breakdown for Arabic words only
- Falls back gracefully on API errors

### Answer Validation (`evaluateAnswer`)
- Semantic equivalence checking
- Accepts minor typos
- Returns `{ correct: boolean, feedback: string }`

## Known Issues & Investigation Notes

### Mystery Modal (January 4, 2026)
**Status:** RESOLVED - was cached Vercel deployment

A modal was observed in production (`language-bgnnugyzz-alehav1s-projects.vercel.app`) showing:
- "Words You'll Learn" header
- Numbered list of vocabulary items WITH translations visible (e.g., "مرحبا (marhaba) Hello")
- Stats: "7 Words | 5 Minutes | New Level"
- Appeared when clicking "Start Lesson"

**Search conducted (no matches found):**
- All `.tsx` files in `src/`
- Patterns: "Words You'll Learn", "You'll", modal patterns, "selectedLesson", "preview", "detail"
- Git history (4 commits, all on main)
- Mock files, test files, fixtures - none in src
- `agents.md` documented "Direct lesson start" (no modal)

**Resolution:**
- Created new `LessonPreviewModal` in `LessonFeed.tsx` that explicitly hides translations
- Original modal source remains unknown (possibly cached deployment, uncommitted code, or external source)

**If found later:** Document location and update this section.

---

## Code Patterns

### Supabase Queries with Filters
```typescript
let query = supabase.from('lessons').select('*');
if (language !== 'all') query = query.eq('language', language);
if (contentType !== 'all') query = query.eq('content_type', contentType);
```

### Optimistic UI Updates
```typescript
// Update UI immediately
setSavedItemIds(prev => new Set([...prev, itemId]));

// Then persist to database
const { error } = await supabase.from('saved_vocabulary').insert({ ... });

// Rollback on error if needed
if (error) {
    setSavedItemIds(prev => { ... });
}
```

### Exercise State Flow
```
prompting → (submit answer) → feedback → (continue) → prompting | complete
                                    ↓
                              (save word) → saved to database
```

### Feedback Display (Arabic)
Always shows these sections:
1. **Word Card** - Arabic word + translation + pronunciation
2. **Hebrew Connection** - cognate if exists, or "No Hebrew cognate" message
3. **Letter Breakdown** - auto-generated for any Arabic word:
   - **Horizontal layout** with card for each letter
   - **Right-to-left order** matching Arabic reading direction
   - **RTL wrapping** - overflow continues on right side of next row
   - Groups letters with their diacritics (vowel marks)
   - Shows combined pronunciation (e.g., "Meem + Fatha" = /ma/)
   - Includes: Fatha, Damma, Kasra, Sukun, Shadda, Tanwin

### Resume Flow
```
load exercise → check localStorage → has progress? → show resume prompt
                                                           ↓
                                              [Resume] or [Start Over]
```

### Saved Words Practice Flow
```
SavedVocabularyView → tap "Practice" → selection mode
                   → select words (checkbox or "Select All")
                   → tap "Practice X words"
                   → navigate to /exercise/saved?ids=id1,id2,id3

ExerciseView → detect lessonId="saved"
            → parse ids from query string
            → useVocabulary({ itemIds: [...] })
            → normal exercise flow
            → on complete, navigate back to /saved
            → mastery levels still update
            → NO lesson progress saved
```

### Arabic Dual-Input Flow
```
Arabic word shown → User types:
                    1. Transliteration (e.g., "marhaba")
                    2. Translation (e.g., "hello")
                 → Both validated separately
                 → Overall correct = both correct
                 → Feedback shows both results
```

**Transliteration validation:**
- Normalizes input (lowercase, apostrophe variants)
- Converts Arabic chat numbers: 7→h, 5→kh, 3→', 2→', 9→s, 6→t
- Normalizes vowels: aa→a, ai→ay, ei→ay
- Uses Levenshtein distance for fuzzy matching
- Generous tolerance: 2-5 characters based on length
- Also compares without spaces (handles hyphen confusion)

## Migrations

Run in Supabase SQL Editor in order:
1. `001_initial_schema.sql` - Core tables
2. `002_add_indexes.sql` - Performance indexes
3. `003_add_mastery.sql` - Mastery tracking fields
4. `004_saved_vocabulary.sql` - Saved vocabulary table
5. `005_add_letter_breakdown.sql` - Letter breakdown column
6. `006_add_content_type.sql` - Content type enum + columns
