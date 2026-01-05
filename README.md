# Language Learning App

AI-powered language learning for Arabic (novice) and Spanish (intermediate) that teaches how native speakers actually talk.

**Last Updated**: January 4, 2026
**Status**: Phase 4 Complete - Content Types, Desktop Layout, Resume Progress

---

## Project Structure

```
src/
├── utils/
│   └── arabicLetters.ts          # Arabic letter breakdown generator
├── features/
│   ├── lessons/
│   │   ├── LessonFeed.tsx        # Main feed with language + content type filters
│   │   └── LessonGenerator.tsx   # AI lesson generation modal
│   ├── exercises/
│   │   ├── ExerciseView.tsx      # Exercise flow with desktop sidebars
│   │   ├── ExercisePrompt.tsx    # Content display (word/phrase/dialog/paragraph)
│   │   ├── AnswerInput.tsx       # Answer submission
│   │   └── ExerciseFeedback.tsx  # Result display with save button
│   └── vocabulary/
│       └── SavedVocabularyView.tsx # Browse saved words
├── components/                    # Shared UI components
│   ├── Card.tsx                   # Base glassmorphism card
│   ├── LessonCard.tsx             # Swipeable lesson with Start button
│   ├── CardStack.tsx              # Deck management
│   ├── SwipeIndicator.tsx         # Swipe feedback overlay
│   └── ActionButtons.tsx          # Alternative controls
├── hooks/                         # Custom business logic
│   ├── useCardStack.ts            # Deck state & persistence
│   ├── useExercise.ts             # Exercise session + resume
│   ├── useLessons.ts              # Fetch lessons with filters
│   ├── useVocabulary.ts           # Fetch vocabulary from Supabase
│   ├── useLessonProgress.ts       # Save progress & update mastery
│   └── useSavedVocabulary.ts      # Save/remove vocabulary items
├── types/
│   ├── database.ts                # Supabase schema types
│   └── lesson.ts                  # UI state types
├── lib/
│   ├── supabase.ts                # Supabase client
│   └── openai.ts                  # OpenAI client + content generation
└── utils/                         # Helper functions
```

## Architecture Overview

### Component Hierarchy

**Lesson Discovery Flow:**
- **`LessonFeed`**: Main page with language + content type filters.
  - **`CardStack`**: Manages the deck with visual stacking.
    - **`LessonCard`**: Swipeable cards with "Start Lesson" button.
  - **Lesson Preview Modal**: Shows words/phrases before starting.
  - **`LessonGenerator`**: AI-powered lesson creation modal.

**Exercise Flow:**
- **`ExerciseView`**: Controls the full exercise session.
  - **Desktop Layout**: 3-column with progress sidebar + stats sidebar.
  - **Segmented Progress Bar**: Each word shown as colored segment.
  - **Resume Prompt**: Option to continue from saved progress.
  - **`ExercisePrompt`**: Displays content with adaptive sizing.
  - **`AnswerInput`**: Text input with keyboard handling.
  - **`ExerciseFeedback`**: Shows correct/incorrect with save button.

**Saved Vocabulary:**
- **`SavedVocabularyView`**: Browse, filter, and manage saved words.
  - Language filtering (All/Arabic/Spanish).
  - Remove items from saved collection.

### State Management
- **`useCardStack`**: Deck state with localStorage persistence.
- **`useExercise`**: Exercise session with localStorage resume.
  - Phases: `prompting` → `feedback` → `complete`.
  - Auto-saves progress, expires after 24 hours.
- **`useSavedVocabulary`**: Saved vocabulary with optimistic UI.

---

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Copy your project URL and anon key

### 3. Configure Environment Variables
Create `.env` file in root directory:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# OpenAI Configuration (for lesson generation + semantic validation)
VITE_OPENAI_API_KEY=your-openai-key-here
```

### 4. Create Database Tables
Run these SQL commands in Supabase SQL Editor:

```sql
-- Content type enum
CREATE TYPE content_type AS ENUM ('word', 'phrase', 'dialog', 'paragraph');

-- Lessons table
CREATE TABLE lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    language TEXT NOT NULL CHECK (language IN ('arabic', 'spanish')),
    difficulty TEXT NOT NULL CHECK (difficulty IN ('new', 'learning', 'practiced', 'mastered')),
    content_type content_type DEFAULT 'word',
    estimated_minutes INTEGER DEFAULT 5,
    vocab_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vocabulary items table
CREATE TABLE vocabulary_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    word TEXT NOT NULL,
    translation TEXT NOT NULL,
    language TEXT NOT NULL CHECK (language IN ('arabic', 'spanish')),
    content_type content_type DEFAULT 'word',
    transliteration TEXT,
    hebrew_cognate JSONB,       -- {root, meaning, notes}
    letter_breakdown JSONB,     -- [{letter, name, sound}] for Arabic
    speaker TEXT,               -- For dialog: "A" or "B"
    context TEXT,               -- For dialog: stage directions
    mastery_level TEXT DEFAULT 'new' CHECK (mastery_level IN ('new', 'learning', 'practiced', 'mastered')),
    times_practiced INTEGER DEFAULT 0,
    last_reviewed TIMESTAMPTZ,
    next_review TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lesson progress tracking
CREATE TABLE lesson_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    language TEXT NOT NULL CHECK (language IN ('arabic', 'spanish')),
    completed_date TIMESTAMPTZ DEFAULT NOW(),
    score INTEGER,
    items_practiced INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Saved vocabulary (user's word collection)
CREATE TABLE saved_vocabulary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vocabulary_item_id UUID REFERENCES vocabulary_items(id) ON DELETE CASCADE,
    saved_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    UNIQUE(vocabulary_item_id)
);

-- Indexes
CREATE INDEX idx_vocab_lesson ON vocabulary_items(lesson_id);
CREATE INDEX idx_vocab_language ON vocabulary_items(language);
CREATE INDEX idx_vocab_content_type ON vocabulary_items(content_type);
CREATE INDEX idx_lessons_language ON lessons(language);
CREATE INDEX idx_lessons_content_type ON lessons(content_type);
CREATE INDEX idx_saved_vocab_item ON saved_vocabulary(vocabulary_item_id);
```

### 5. Run Development Server
```bash
npm run dev
```

---

## Features

### Content Types
Create lessons for different learning styles:
- **Words**: Individual vocabulary (7 items)
- **Phrases**: Common expressions (5 items)
- **Dialog**: Short conversations with speakers A/B (4 lines)
- **Paragraphs**: Reading passages (2 passages)

### AI Lesson Generation
- Tap the **+** button to create new lessons
- Select content type (Words, Phrases, Dialog, Paragraphs)
- Enter a topic (e.g., "At the grocery store")
- Select language and difficulty level
- AI generates appropriate content with translations
- **Hebrew cognates** for Arabic (only genuine Semitic connections)
- **Letter breakdown** for Arabic words

### Exercise Flow
1. Tap **Start Lesson** on any lesson card
2. See **lesson preview** with all words/phrases listed
3. See content in target language with adaptive sizing
4. Type the English translation
5. Get immediate feedback with **detailed word breakdown**:
   - Word + translation + pronunciation
   - **Hebrew Connection** (Arabic only) - shows cognate or explains why none exists
   - **Letter Breakdown** (Arabic only) - each letter with name, diacritics, and combined sound
6. **Save items** by tapping the heart icon
7. **Skip questions** if needed
8. **Resume later** - progress auto-saved for 24 hours
9. See final score at completion

### Desktop Layout
On larger screens (1024px+), exercises show:
- **Left sidebar**: Lesson progress with word list
- **Center**: Main exercise area with larger text
- **Right sidebar**: Session stats and current word hints

### Lesson Preview
Before starting a lesson, see:
- Language and content type badges
- Lesson description
- Stats (item count, estimated time, difficulty)
- Full list of words/phrases to learn

### Progress Tracking
- **Segmented progress bar**: Each item = one segment
- **Color coded**: Green (correct), Red (incorrect), White (current), Gray (upcoming)
- **Resume prompt**: Continue from where you left off

### Semantic Answer Validation
- Answers checked via OpenAI for semantic equivalence
- Accepts minor typos and synonyms
- Falls back to exact match if API fails

### Saved Vocabulary
- Tap heart icon in top-right to view saved words
- Filter by language
- See word, translation, and cognate details
- Remove items from collection

### Spaced Repetition
- Mastery levels: `new` → `learning` → `practiced` → `mastered`
- Progress tracked per vocabulary item
- Next review time calculated based on mastery

---

## Configuration

### TypeScript Types (`src/types/database.ts`)

**Core Types**:
- `Language`: `'arabic' | 'spanish'`
- `ContentType`: `'word' | 'phrase' | 'dialog' | 'paragraph'`
- `MasteryLevel`: `'new' | 'learning' | 'practiced' | 'mastered'`
- `HebrewCognate`: `{ root?, meaning?, notes? }`
- `LetterBreakdown`: `{ letter, name, sound }`

**Database Tables**:
- `DbLesson`: Lesson metadata with content_type
- `DbVocabularyItem`: Content with translations, cognates, letter breakdown
- `LessonProgress`: Completed lessons and scores
- `SavedVocabulary`: User's saved content collection

---

## Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/` | `LessonFeed` | Main lesson discovery with card stack |
| `/exercise/:lessonId` | `ExerciseView` | Translation exercise flow |
| `/saved` | `SavedVocabularyView` | Browse saved vocabulary |

---

## Development Principles

### Mobile-First (CRITICAL)
Test at these breakpoints IN ORDER:
1. **375px** (iPhone SE) - Must work perfectly here FIRST
2. **768px** (iPad) - Layout should use space well
3. **1024px** (Desktop) - Three-column exercise layout

**Touch targets**: 48x48px minimum

### TypeScript Rules
- No `any` types
- Use `unknown` if type is truly unknown
- Define interfaces for all data structures
- Props interfaces above components

### React Patterns
- **Navigation**: `useNavigate()` from react-router-dom
- **Loading**: Show loading state for ALL async operations
- **Errors**: User-friendly messages

---

## What Makes This App Different

- **Multiple content types** - words, phrases, dialogs, paragraphs
- **AI-generated lessons** appropriate to your level
- **Semantic answer validation** - accepts synonyms and minor typos
- **Spaced repetition** tracking what you know vs struggle with
- **Hebrew cognates** for Arabic (only genuine Semitic connections)
- **Letter breakdown** for Arabic character learning
- **Save content** for later review
- **Resume lessons** - continue where you left off
- **Desktop-optimized** with 3-column layout
- **NO gamification** - no streaks, points, badges
- **5-10 minute sessions** designed for when you can't speak aloud

---

## Completed Features

- Lesson discovery with swipeable cards
- Language + content type filtering
- Content types: words, phrases, dialogs, paragraphs
- Lesson preview before starting
- AI lesson generation via OpenAI
- Exercise flow with prompting, validation, and feedback
- Semantic answer matching via OpenAI
- Arabic support: script, transliteration, Hebrew cognates, letter breakdown with diacritics
- Skip question functionality
- Save vocabulary items during exercises
- Browse and manage saved words
- Resume lessons from saved progress
- Segmented progress bar with color coding
- Desktop 3-column layout
- Supabase integration for all data
- Spaced repetition mastery tracking
- Mobile-first UI with 48x48px touch targets

---

## Future Enhancements

- Audio playback with speed toggle
- Speech input for pronunciation practice
- Root word explanations for Arabic
- Review mode for weak vocabulary
- Cross-device sync (currently single-device)
