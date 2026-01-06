# Language Learning App

AI-powered language learning for Arabic (novice) and Spanish (intermediate) that teaches how native speakers actually talk.

**Last Updated**: January 6, 2026
**Status**: Phase 15 In Progress - Unified Word Display & Navigation Redesign

---

## Project Structure

```
src/
├── utils/
│   ├── arabicLetters.ts          # Arabic letter breakdown generator
│   └── transliteration.ts        # Transliteration validation with fuzzy matching
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
│       ├── MyVocabularyView.tsx    # Browse saved words with status filters
│       └── LookupModal.tsx         # Look up any word with full breakdown
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
│   ├── useSavedVocabulary.ts      # Legacy: Save/remove vocabulary items
│   └── useSavedWords.ts           # New: Full word management with status
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
- **`LessonFeed`**: Main page with simplified header and polished bottom sheet menu.
  - **Header**: Hamburger button + centered title (current content type + language)
  - **Bottom Sheet Menu**: Polished navigation with:
    - Drag handle for mobile feel
    - Colored language buttons (teal for Arabic, amber for Spanish with glow)
    - Compact 4-column grid for lesson types (icon + label)
    - Purple gradient "Create Lesson" button
    - Max-width constrained on desktop
    - Saved Words link
  - **`CardStack`**: Manages the deck with visual stacking.
    - **`LessonCard`**: Swipeable cards with "Start Lesson" button (direct to exercise).
  - **`LessonGenerator`**: AI-powered lesson creation (opens from menu only, no floating button).

**Exercise Flow:**
- **`ExerciseView`**: Controls the full exercise session.
  - **Desktop Layout**: 3-column with progress sidebar + stats sidebar.
  - **Segmented Progress Bar**: Each word shown as colored segment.
  - **Resume Prompt**: Option to continue from saved progress.
  - **`ExercisePrompt`**: Displays content with adaptive sizing.
  - **`AnswerInput`**: Text input with keyboard handling.
  - **`ExerciseFeedback`**: Shows correct/incorrect with save button.

**Saved Vocabulary:**
- **`SavedVocabularyView`**: Browse, filter, practice, and manage saved words.
  - Language filtering (All/Arabic/Spanish).
  - **Tap any word** to see full details (translation, pronunciation, Hebrew connection, letter breakdown).
  - **Practice mode**: Select words and practice them as a custom lesson.
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
- Open menu and tap **Create Lesson** button
- **Defaults to your current language filter** (syncs automatically)
- Select content type (Words, Phrases, Dialog, Paragraphs)
- Enter a topic (e.g., "At the grocery store")
- Select language and difficulty level
- AI generates appropriate content with translations
- **Hebrew cognates** for Arabic (only genuine Semitic connections)
- **Letter breakdown** for Arabic words with vowel diacritics

### Exercise Flow
1. Tap **Start Lesson** on any lesson card - goes directly to exercise
2. See content in target language with "Write in English" instruction
3. **For Arabic**: Type BOTH pronunciation (transliteration) AND English translation
4. **For Spanish**: Type the English translation only
5. Get immediate feedback with **detailed word breakdown**:
   - Word + translation + pronunciation
   - **Hebrew Connection** (Arabic only) - shows cognate or explains why none exists
   - **Letter Breakdown** (Arabic only) - horizontal cards, RTL order with proper RTL wrapping
6. **Save items** by tapping the heart icon
7. **Skip questions** if needed
8. **Resume later** - progress auto-saved for 24 hours
9. See final score at completion

### Desktop Layout
On larger screens (1024px+), exercises show:
- **Left sidebar**: Lesson progress with word list
- **Center**: Main exercise area with larger text
- **Right sidebar**: Session stats and current word hints

### Persistent Preferences
- **Language filter remembered** - defaults to your last used language
- **Content type filter remembered** - persists across sessions
- **Generator syncs** - "Create AI Lesson" defaults to your current filters

### Progress Tracking
- **Segmented progress bar**: Each item = one segment
- **Color coded**: Green (correct), Red (incorrect), White (current), Gray (upcoming)
- **Resume prompt**: Continue from where you left off

### Semantic Answer Validation
- Answers checked via OpenAI for semantic equivalence
- Accepts minor typos and synonyms
- Falls back to exact match if API fails

### My Vocabulary (Phase 13-14)

**Word Status Model** (simplified):
- **Active**: Words you're still practicing (default for all saved/practiced words)
- **Learned**: Archived words you know well (for reference)

**Features**:
- All practiced Arabic words **auto-save** to your vocabulary
- Access via bottom navigation → **My Words** tab
- Filter by status: All / Active / Learned
- Search by word or translation
- Sort by recent or alphabetical

**Word Details** (tap any word):
- Arabic word with vowels (harakat)
- **Both dialect pronunciations**: Standard MSA + Egyptian Arabic
- **Example sentences** with both MSA and Egyptian versions
- Hebrew cognate (if genuine Semitic connection exists)
- Letter breakdown (RTL display)
- Source contexts (where you learned the word)

**Actions**:
- **Mark as Learned**: Archive words you know well
- **Mark as Active**: Bring archived words back to practice
- **Delete**: Permanently remove a word

**Lookup Mode** (+ button):
- Type any word (English or Arabic)
- Get full breakdown with example sentences
- Save directly to your vocabulary

**Practice Mode**:
- Tap "Practice" to enter selection mode
- Select words and practice as custom lesson

### Egyptian Arabic Focus (Phase 14)

**Example Sentences** now show BOTH versions:
- 🇪🇬 **Egyptian (Spoken)** - displayed first, larger, amber-colored
- 📖 **MSA (Formal)** - displayed second, smaller, teal-colored

For "work": Instead of just عَمَل (amal), you see:
- Egyptian: أَنَا بَحِبّ الشُغْل (ana bahibb el-shoghl)
- MSA: أَنَا أُحِبُّ العَمَلَ (ana uhibbu al-'amala)

**Why this matters**: Egyptian Arabic is what you'll hear in everyday conversation. MSA is for formal writing and news. Learning both helps you understand real spoken Arabic.

### Word Deduplication (Phase 14)

**New lessons avoid words you've already practiced**:
- When generating a lesson, the AI checks your saved vocabulary
- Excludes up to 50 already-practiced words
- Ensures you always see fresh content

---

## Configuration

### TypeScript Types (`src/types/database.ts`)

**Core Types**:
- `Language`: `'arabic' | 'spanish'`
- `ContentType`: `'word' | 'phrase' | 'dialog' | 'paragraph'`
- `MasteryLevel`: `'new' | 'learning' | 'practiced' | 'mastered'`
- `WordStatus`: `'active' | 'learned'` (simplified in Phase 13)
- `HebrewCognate`: `{ root?, meaning?, notes? }`
- `LetterBreakdown`: `{ letter, name, sound }`
- `ExampleSentence`: `{ arabic_msa, transliteration_msa, arabic_egyptian, transliteration_egyptian, english, explanation? }`

**Database Tables**:
- `DbLesson`: Lesson metadata with content_type
- `DbVocabularyItem`: Content with translations, cognates, letter breakdown
- `LessonProgress`: Completed lessons and scores
- `saved_words`: User's saved vocabulary with status, pronunciations, example sentences
- `word_contexts`: Source contexts for each saved word

---

## Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/` | `LessonFeed` | Main lesson discovery with card stack |
| `/exercise/:lessonId` | `ExerciseView` | Translation exercise flow |
| `/exercise/saved?ids=...` | `ExerciseView` | Practice selected saved words |
| `/saved` | `MyVocabularyView` | Browse, filter, and practice saved vocabulary |

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
- **Letter breakdown** for Arabic - horizontal, right-to-left display matching word order
- **Save content** for later review
- **Resume lessons** - continue where you left off
- **Desktop-optimized** with 3-column layout
- **NO gamification** - no streaks, points, badges
- **5-10 minute sessions** designed for when you can't speak aloud

---

## Completed Features

### Phase 15 (In Progress)
- **Unified Word Display**:
  - **Shared WordDetailCard component**: Same rich display in exercise feedback AND My Vocabulary
  - **Auto-fetch enhanced data**: If example sentences/Hebrew cognate missing, fetches from OpenAI
  - **Improved Hebrew cognate detection**: Explicit Semitic root examples (כ-ת-ב, ע-מ-ל, etc.)
  - **Heart button removed**: Words auto-save, no confusing one-way toggle

- **Planned - Passage Lookup**:
  - Paste any Arabic text and get full translation + transliteration
  - Word-by-word breakdown with ability to save individual words
  - Save entire sentences for spoken Arabic practice

- **Planned - Navigation Redesign**:
  - Main menu with clear options: Lessons, My Words, My Sentences
  - Remove clunky resume flow
  - Saved Sentences view for practicing spoken Arabic phrases

### Phase 14
- **Egyptian Arabic Focus**:
  - **Example sentences show BOTH dialects**: Egyptian (spoken) first, MSA (formal) second
  - **Egyptian displayed prominently**: Larger text, amber color, 🇪🇬 flag indicator
  - **MSA shown for reference**: Smaller text, teal color, 📖 book indicator
  - **Real Egyptian vocabulary**: Uses actual Egyptian words (شُغْل not عَمَل for "work")
  - **Letter breakdown for Egyptian**: Separate breakdown for Egyptian word variant
  - **Grammar explanations**: Notes on differences between dialects

- **Word Deduplication**:
  - **Lessons avoid repeated words**: AI excludes your saved vocabulary when generating new lessons
  - **Fresh content always**: Up to 50 already-practiced words excluded from new lessons

### Phase 13
- **Unified Word Tracking**:
  - **Simplified status model**: `active` (practicing) vs `learned` (archived)
  - **All practiced words auto-save**: Arabic words automatically added to vocabulary
  - **Delete functionality**: Permanently remove words from vocabulary
  - **Filter icon in header**: Clearer signal for opening settings menu
  - **Dynamic dialect pronunciations**: Fetched from OpenAI during exercise feedback

### Phase 12
- **My Vocabulary Overhaul**:
  - **New database schema**: `saved_words` and `word_contexts` tables for word-centric data model
  - **Dialect pronunciations**: Each word stores both Standard MSA and Egyptian Arabic pronunciations
  - **Bottom navigation**: Lessons + My Words tabs (vocabulary now prominent)
  - **My Vocabulary screen**: Search, filter by status, sort (recent/A-Z)
  - **Word detail modal**: Full breakdown with letter breakdown, Hebrew cognate, source contexts
  - **Selection mode**: Select any saved words for custom practice sessions
  - **Lookup Mode**: Type any word (English or Arabic) to get full breakdown
  - **Floating + button**: Quick access to lookup mode from My Vocabulary screen
  - **Save from lookup**: Save words directly to vocabulary from lookup results

### Phase 11
- **Multi-Word Phrase Support**:
  - **Arabic dialect selector**: Choose Standard Arabic (MSA) or Egyptian Arabic when creating lessons
  - **Word-by-word letter breakdown**: Each word in a phrase displays on its own horizontal line
  - **Hebrew cognates per word**: Checks each word in phrases for cognates (e.g., العمل → עמל)
  - **Check Answer button lights up**: Uses btn-primary gradient when answer fields are filled

### Phase 10
- **Bug Fixes**:
  - **Skip progress saving**: Skipping a question now saves progress for resume
  - **Mastery regression**: Incorrect answers regress mastery level (mastered→practiced→learning)
- **UX Improvements**:
  - **Exit confirmation**: Modal asks "Leave Exercise?" when user has progress
  - **Browser warning**: `beforeunload` event warns before closing tab during exercise
  - **Skeleton loading in ExerciseView**: Shimmer animation while vocabulary loads
  - **OpenAI retry logic**: 3 retries with exponential backoff (1s, 2s, 4s)
  - **Undo card swipes**: 5-second undo toast after dismiss/save/later actions
  - **Improved transliteration**: q/k equivalence, double consonant normalization (kitta = quitta)
  - **Action button labels**: Skip, Later, Save text labels under icons
  - **Saved Words back navigation**: Uses browser history instead of always going home
  - **Consistent empty state**: All content types show same "Ready to learn?" prompt

### Phase 9
- **Design Polish**:
  - **Skeleton loading**: Shimmer animation while lessons load
  - **Heart pop animation**: Bouncy effect when saving a word
  - **Progress bar glow**: Green/red glow on correct/incorrect segments
  - **Softer modal backdrops**: Less harsh with more blur
  - **btn-primary gradient**: Consistent button styling with active:scale-95
  - **Empty state icon**: Book emoji with softer text styling
  - **Custom font classes**: `.font-arabic` and `.font-hebrew` for proper script rendering
  - **Accessibility**: Added aria-labels to modal close buttons

### Phase 8
- **Enhanced Saved Words**:
  - **Word detail modal**: Tap any saved word to see full breakdown
  - **Practice mode**: Select words and practice as custom lesson
  - **Selection UI**: Checkboxes, Select All/Clear, action bar
  - **Custom exercise route**: `/exercise/saved?ids=...`
  - Mastery levels still update during practice

### Phase 7
- **Polished bottom sheet menu**: All controls in one place with refined styling
  - Drag handle for mobile feel
  - Colored language buttons (teal for Arabic, amber for Spanish with glow)
  - Compact 4-column grid for lesson types
  - Purple gradient "Create Lesson" button
  - Max-width constrained on desktop
  - Saved Words link
- **Direct lesson start**: "Start Lesson" goes directly to exercise (no preview modal)
- **Removed floating button**: LessonGenerator opens from menu only
- **Cleaner header**: Just hamburger button + centered title showing current type + language
- **Clearer instructions**: "Write in English" instead of "Translate"
- **Improved answer validation**: Accepts synonyms, typos, and alternative meanings
- **Horizontal RTL letter breakdown**: Arabic letters displayed right-to-left with proper RTL wrapping

### Phase 6
- **Arabic dual-input mode**: Type BOTH transliteration AND translation for Arabic exercises
- **Transliteration validation**: Generous fuzzy matching with Arabic chat numbers (7=h, 5=kh, 3=', etc.)
- **Actionable empty states**: "Create Lesson" button when filtering to content types with no lessons

### Phase 5
- Language + content type filtering (persists to localStorage)
- Generator syncs with current language filter
- Persistent user preferences

### Phase 1-4
- Lesson discovery with swipeable cards
- Content types: words, phrases, dialogs, paragraphs
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
- Review mode for weak vocabulary (partially addressed by saved words practice)
- Cross-device sync (currently single-device)
