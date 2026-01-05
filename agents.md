# agents.md - Language Learning App

## Project Overview
Language Learning App - AI-powered language learning that teaches how native speakers actually talk
Target: Non-technical adult learner learning Arabic (novice) and Spanish (intermediate)
Stack: React + TypeScript + Vite + Tailwind + Supabase + OpenAI

Last Updated: January 4, 2026

## What Makes This App Different
- Multiple content types: words, phrases, dialogs, paragraphs
- AI generates lessons appropriate to your level
- Semantic answer validation - accepts synonyms and typos
- Tracks what you know and struggle with using spaced repetition
- For Arabic: Hebrew cognates + letter breakdown for character learning
- Save vocabulary items for later review
- Resume lessons from where you left off
- Desktop-optimized with 3-column layout
- NO gamification - no streaks, points, badges
- Designed for 5-10 minute sessions, often when you can't speak aloud

## Current State
- Status: Phase 6 Complete - Arabic Dual-Input, Actionable Empty States
- Working features:
  - Lesson feed with swipeable card stack + "Start Lesson" button
  - **Content type badge** on each lesson card showing type (Aa Words, "" Phrases, etc.)
  - **Content type filtering** (All/Words/Phrases/Dialog/Paragraphs)
  - Language filtering (All/Arabic/Spanish) - **persists to localStorage**
  - **Filter preferences remembered** - defaults to last used language
  - Swipe gestures: left (dismiss), right (save), down (later), tap (start)
  - **Lesson preview modal** - clicking "Start Lesson" shows preview with vocabulary (no translations) then starts exercise
  - **Actionable empty states** - "Create Lesson" button when filtering to content types with no lessons
  - **AI lesson generation** via OpenAI - syncs with current language filter
  - **Supabase integration** - all data persisted to database
  - **Exercise flow** with prompting, validation, and feedback
  - **Arabic dual-input mode** - type BOTH transliteration AND translation for Arabic exercises
  - **Transliteration validation** - fuzzy matching with Levenshtein distance for typo tolerance
  - **Semantic answer matching** via OpenAI (accepts synonyms/typos)
  - **Skip question** functionality during exercises
  - **Resume lessons** - progress saved to localStorage for 24 hours
  - **Segmented progress bar** - each word as colored segment
  - **Desktop 3-column layout** - sidebars with progress + stats
  - **Save vocabulary** - heart button on feedback screen
  - **Saved words view** - browse, filter, remove saved items
  - Arabic feedback: transliteration + Hebrew cognate + auto-generated letter breakdown with diacritics
  - Hebrew cognates only include genuine Semitic root connections
  - Progress persistence to Supabase on lesson completion
  - Spaced repetition mastery tracking per vocabulary item
  - Navigation between all views (lesson feed, exercises, saved words)
  - Loading and error states for async operations
  - Glassmorphism UI with dark theme
  - Touch-friendly design (48px+ targets)
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
| `/` | `LessonFeed` | Main lesson discovery with card stack |
| `/exercise/:lessonId` | `ExerciseView` | Translation exercise flow |
| `/saved` | `SavedVocabularyView` | Browse saved vocabulary |

## Priority Features

### Completed
1. Mobile-first interface
2. Core exercise flow (display → respond → feedback)
3. Arabic: Clear script + transliteration + Hebrew cognates + letter breakdown
4. Supabase integration (lessons, vocab, progress)
5. Learning state tracking (spaced repetition)
6. AI-generated lessons via OpenAI
7. Semantic matching for answers via OpenAI
8. Skip question functionality
9. Save vocabulary items
10. Browse saved vocabulary
11. Content types (word, phrase, dialog, paragraph)
12. Resume lessons from saved progress
13. Segmented progress bar
14. Desktop 3-column layout
15. Persistent language/content type preferences
16. Generator syncs with current language filter
17. Lesson preview modal (vocabulary without translations)
18. Arabic dual-input mode (transliteration + translation)
19. Transliteration validation with fuzzy matching
20. Actionable empty states with "Create Lesson" button

### Remaining (P2)
1. Audio playback with speed toggle
2. Review Mode for weak vocabulary
3. Root word explanations for Arabic
4. Speech input

## Key Files

### Features
- `src/features/lessons/LessonFeed.tsx` - Main lesson discovery with persistent filters + LessonPreviewModal
- `src/features/lessons/LessonGenerator.tsx` - AI lesson creation (syncs with current language)
- `src/features/exercises/ExerciseView.tsx` - Exercise flow with desktop sidebars + resume
- `src/features/exercises/ExercisePrompt.tsx` - Adaptive content display
- `src/features/exercises/ExerciseFeedback.tsx` - Result display with save button
- `src/features/vocabulary/SavedVocabularyView.tsx` - Browse saved words

### Hooks
- `src/hooks/useExercise.ts` - Exercise session state + resume + skip
- `src/hooks/useLessons.ts` - Fetch lessons with language + content type filters
- `src/hooks/useVocabulary.ts` - Fetch vocabulary from Supabase
- `src/hooks/useLessonProgress.ts` - Save progress + update mastery
- `src/hooks/useSavedVocabulary.ts` - Save/remove vocabulary items

### Lib
- `src/lib/supabase.ts` - Supabase client
- `src/lib/openai.ts` - OpenAI client + content generation + answer validation

### Utils
- `src/utils/arabicLetters.ts` - Arabic letter breakdown generator (28 letters + diacritics)
- `src/utils/transliteration.ts` - Transliteration validation with Levenshtein distance

### Types
- `src/types/database.ts` - All database types including ContentType
- `src/types/lesson.ts` - UI state types

## Database Schema

### Tables
- `lessons` - Lesson metadata (title, description, language, difficulty, content_type)
- `vocabulary_items` - Content with translations, hebrew_cognate, letter_breakdown, speaker, context
- `lesson_progress` - Completed lessons with scores
- `saved_vocabulary` - User's saved word collection

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
   - Groups letters with their diacritics (vowel marks)
   - Shows combined pronunciation (e.g., "Meem + Fatha" = /ma/)
   - Includes: Fatha, Damma, Kasra, Sukun, Shadda, Tanwin

### Resume Flow
```
load exercise → check localStorage → has progress? → show resume prompt
                                                           ↓
                                              [Resume] or [Start Over]
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
- Uses Levenshtein distance for fuzzy matching
- Tolerance scales with word length (1-3 characters)

## Migrations

Run in Supabase SQL Editor in order:
1. `001_initial_schema.sql` - Core tables
2. `002_add_indexes.sql` - Performance indexes
3. `003_add_mastery.sql` - Mastery tracking fields
4. `004_saved_vocabulary.sql` - Saved vocabulary table
5. `005_add_letter_breakdown.sql` - Letter breakdown column
6. `006_add_content_type.sql` - Content type enum + columns
