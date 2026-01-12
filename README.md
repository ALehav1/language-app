# Language Learning App

**AI-powered Arabic learning focused on Egyptian dialect**

Last Updated: January 10, 2026 (Evening) - UI Polish & Dialogs Support

**🚀 Current Production:** https://language-m6q3yz1z4-alehav1s-projects.vercel.app

---

## Quick Start

```bash
npm install
npm run dev
```

**Environment Setup:** Copy `.env.example` to `.env` and add your Supabase + OpenAI keys.

**Documentation:**
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Complete technical reference
- **[CLEANUP_ANALYSIS.md](./CLEANUP_ANALYSIS.md)** - File audit and deprecation log

---

## What Is This?

A language learning app that teaches **Egyptian Arabic** (how people actually speak) alongside Modern Standard Arabic (formal/written). Designed for 5-10 minute practice sessions.

**Core Philosophy:**
- No gamification (no streaks, points, badges)
- Explicit save control (you decide what to practice)
- Semantic validation (accepts synonyms and typos)
- Dialect-first (Egyptian primary, MSA reference)
- Interactive text selection (click words/sentences to explore and save)

---

## Current Features (v1.0)

### Navigation
**Main Menu** → 3 tiles:
- **Lessons** - AI-generated lessons
- **Lookup** - Translate any text
- **My Saved Vocabulary** - Words/Sentences/Passages/Dialogs with filtering

### User Flows

**1. Learn from AI Lesson:**
```
Main Menu → Lessons
    ↓
Browse category (Words/Phrases/Passages/Dialogs) OR Create New
    ↓
[If Create] Select topic, difficulty, dialect → AI generates lesson
    ↓
Start Exercise → Practice with dual input (transliteration + translation)
    ↓
Submit → Get semantic validation + detailed feedback
    ↓
ExerciseFeedback shows:
    - Word breakdown (Egyptian + MSA pronunciations)
    - Letter breakdown (right-to-left with vowels)
    - Hebrew cognates (if applicable)
    - Context tile (root, Egyptian usage, MSA comparison)
    - Example sentences (collapsible)
    - Memory Aid tile (create DALL-E image + notes)
    - Chat tile (ask AI tutor questions)
    ↓
Save Decision: Practice / Archive / Skip
    ↓
Next word in lesson → Repeat until complete
```

**2. Review Saved Vocabulary:**
```
Main Menu → My Saved Vocabulary
    ↓
Filter by status: Practice (active) or Archive (learned)
    ↓
Filter by type: Words / Sentences / Passages / Dialogs
    ↓
Sort: Recent / A-Z Arabic / A-Z English
    ↓
Click item → WordDisplay modal with full details
    ↓
View/edit memory aids, change status, or delete
```

**3. Look Up & Save New Content:**
```
Main Menu → Lookup
    ↓
Paste Arabic OR English text
    ↓
Get instant translation + word-by-word breakdown
    ↓
View same rich feedback as lessons:
    - Full translation with both dialects
    - Word breakdown for each word
    - Context, Memory Aid, Chat tiles
    - Example sentences
    ↓
Save individual words/phrases to Practice or Archive
```

**4. Create Custom Lesson:**
```
Main Menu → Lessons → Select category → Create New
    ↓
Choose topic (or use Quick Topic: Restaurant/Travel/Work/Family/Shopping)
    ↓
Select difficulty: Beginner / Intermediate / Advanced
    ↓
Select dialect: Egyptian (default) / MSA
    ↓
[System checks for similar lessons]
    ↓
AI generates vocabulary (excludes already-saved words)
    ↓
Start practicing immediately
```

### My Saved Vocabulary
- **Unified view** with content type filters (Words/Sentences/Passages/Dialogs)
- **Status filters** (Practice/Archive)
- **Search & Sort** (recent, A-Z Arabic, A-Z English)
- **Loading/Success feedback** on all save actions

### Arabic Features
- **Egyptian dictionary** - 150+ MSA→Egyptian mappings
- **Letter breakdown** - Shows vowel combinations, organized by word
- **Hebrew cognates** - 150+ Semitic root connections (single words only)
- **Transliteration validation** - Chat number support (7=h, 3=', etc.)
- **Context tiles** - Root analysis, Egyptian usage, MSA comparison, cultural notes
- **Memory aid tiles** - DALL-E visuals + personal notes (collapsible)
- **Chat tiles** - Interactive Q&A about any word/phrase with AI tutor

**Hebrew Cognate Rules:**
- Only displayed for Arabic single words (never sentences/passages/dialogs)
- Never displayed for Spanish content
- Shows when true Semitic root connection exists between Arabic and Hebrew
- Match can be with Egyptian OR MSA form

### Spanish Features
- **Default difficulty: INTERMEDIATE** - Spanish lessons start at intermediate level
- **Dual dialect support** - LatAm (primary) + Spain (reference)
- **No letter breakdown** - Latin script doesn't require phonetic decomposition
- **No transliteration** - Not needed for Latin-based languages
- **No Hebrew cognates** - Spanish is Romance, not Semitic
- **Context tiles** - Usage notes and cultural context (when applicable)
- **Memory aid tiles** - DALL-E visuals + personal notes (collapsible)
- **Chat tiles** - Interactive Q&A about any word/phrase with AI tutor

---

## Tech Stack

- React 19 + TypeScript + Vite
- TailwindCSS (glassmorphism dark theme)
- Supabase (database + storage)
- OpenAI API (GPT-4 + DALL-E 3)

---

## Project Structure

```
src/
├── domain/              # Domain layer (PR-2)
│   └── practice/        # Practice abstractions
│       ├── PracticeItem.ts           # Canonical practice type
│       ├── adapters/                 # DB → Domain transformations
│       │   ├── fromVocabularyItems.ts
│       │   └── fromSavedWords.ts
│       └── __tests__/                # Adapter tests (11 passing)
├── features/            # Feature modules
│   ├── home/           # Main menu
│   ├── lessons/        # Lesson browser & generator
│   ├── exercises/      # Practice flow
│   ├── vocabulary/     # Saved words (unified view)
│   ├── sentences/      # Legacy view
│   ├── passages/       # Legacy view
│   └── lookup/         # Translation lookup
├── components/         # Shared UI
├── hooks/             # Data & logic hooks
├── lib/               # External services
├── utils/             # Utilities (dialect, cognates, etc.)
└── types/             # TypeScript definitions
```

**Domain Layer (PR-2):**
- Language-agnostic practice abstraction
- Adapters decouple domain from database schemas
- Voice-ready (promptType/answerType fields)
- See [ADR-001](./docs/architecture/adr/ADR-001-practice-item.md) for design rationale

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed documentation.

---

## Key Components

**Display:**
- `WordDisplay` - Unified word display (everywhere)
- `SaveDecisionPanel` - Save controls with feedback
- `MemoryAidEditor` - Visual + note creation

**Data:**
- `useSavedWords` - Primary vocabulary hook
- `useLessons` - Lesson data
- `useExercise` - Exercise logic

---

## Routes

| Path | Purpose |
|------|---------|
| `/` | Main menu |
| `/lessons` | Browse/create lessons |
| `/exercise/:id` | Practice flow |
| `/words` | Unified vocabulary (Words/Sentences/Passages) |
| `/lookup` | Translation lookup |

**Legacy routes** (`/sentences`, `/passages`) still exist for backward compatibility but primary UX consolidates to `/words` with filtering.

---

## Testing

The project uses Vitest + React Testing Library for unit and integration testing.

**Run tests:**
```bash
npm test              # Watch mode
npm run test:run      # Single run
npm run test:ui       # Visual UI
npm run test:coverage # Coverage report
npm run lint          # TypeScript type checking
```

**Current Coverage:** 46/46 tests passing (100%)
- `useExercise` - 19/19 tests (exercise logic, persistence, baseline behaviors)
- `useCardStack` - 16/16 tests (undo window, card actions, localStorage)
- **Domain Adapters** - 11/11 tests (PR-2)
  - Transformation tests (7 tests)
  - Golden equivalence tests (4 tests)

**Test Philosophy:**
- Baseline tests document current behavior (including known bugs)
- Tests lock in behavior before refactoring
- No test changes without intentional behavior changes

See `docs/verification/` for PR notes and verification details.

---

## Development

**Mobile-First:** Test at 375px → 768px → 1024px

**TypeScript:** Strict mode, no `any` types

**Testing:** Manual testing only (automated tests planned)

---

## Recent Updates

### January 10, 2026 (Evening) - UI Polish & Consistency

**Lessons UI Restructure:**
- ✅ **4 Content Type Categories** - Words, Phrases, Passages, Dialogs
  - Each category shows "View Saved" and "Create New" buttons
  - Saved lessons filtered by selected category
  - Back navigation from filtered view
- ✅ **Quick Topics Integration** - Moved into LessonGenerator modal
  - Topics appear below input field: Restaurant, Travel, Work, Family, Shopping
  - Clicking fills topic field (doesn't auto-generate)
- ✅ **Compact Saved Lessons** - Reduced spacing throughout
  - Smaller padding (p-3 → p-2)
  - Smaller fonts and icons
  - More lessons visible on screen

**UI Consistency Improvements:**
- ✅ **Example Sentences** - Now collapsible (default: collapsed)
  - Consistent teal color scheme matching Memory Aid, Context, Chat tiles
  - Larger font sizes: Egyptian 2xl, MSA xl, English/transliteration base
  - Applied across Lessons, Lookup, and My Vocabulary views
- ✅ **Letter Breakdown** - Fixed RTL layout
  - Letters now start from right side and wrap correctly
  - Proper right-to-left flow with `dir="rtl"` and `justify-start`
- ✅ **Dialogs Filter** - Added to My Vocabulary view
  - Now shows all 4 content types: Words, Sentences, Passages, Dialogs
  - Dialogs treated as multi-sentence content

### January 10, 2026 (Morning) - Enhanced Context Tiles & Interactive Learning

**Enhanced Learning Experience:**
- ✅ **Context Tile (💡)** - Comprehensive word/phrase analysis in both Lessons and Lookup
  - **Root Information** - Arabic trilateral root with meaning (e.g., ك-ت-ب = writing)
  - **Egyptian Usage** - How Egyptians use this in everyday conversation
  - **MSA Comparison** - How it differs from/relates to Modern Standard Arabic
  - **Cultural Notes** - Contextual and cultural information when relevant
  - Renamed from "Word Context" to just "Context" (applies to all content types)
  - Available in both ExerciseFeedback (Lessons) and LookupModal

- ✅ **Memory Aid Tile (🎨)** - Dedicated collapsible tile for learning aids
  - Extracted from inline display to standalone expandable component
  - Shows "(saved)" indicator when memory aid exists
  - Contains full MemoryAidEditor with DALL-E image generation + notes
  - Collapsible header to reduce visual clutter
  - Persists in component state during session
  - Available in both Lessons and Lookup

- ✅ **Chat Tile (💬)** - NEW interactive AI tutor feature
  - Ask questions about any word/phrase in real-time
  - Context-aware responses (knows the word, translation, and Egyptian usage)
  - Powered by GPT-4o-mini for fast, focused answers
  - Chat history persists during session (in component state)
  - Expandable/collapsible interface to save space
  - Suggestion prompts: "When do I use this?", "What's the difference from...?", "Can you give more examples?"
  - 2-3 sentence max responses for quick learning
  - Available in both Lessons and Lookup

**Feature Parity Achieved:**
- Both **Lessons** and **Lookup** now show identical rich context:
  - Word/phrase breakdown with pronunciations
  - Context tile (root, usage, MSA comparison, cultural notes)
  - Memory Aid tile (notes + AI images)
  - Chat tile (interactive Q&A)
  - Example sentences (MSA + Egyptian versions)
  - Letter breakdown (organized by word)
  - Hebrew cognates

**UX Improvements:**
- ✅ **Text dialect labels** - Replaced flag emojis (🇪🇬 📖) with clear text:
  - "Egyptian" for Egyptian Arabic pronunciation
  - "MSA" for Modern Standard Arabic pronunciation
  - Egyptian always shows first (primary), MSA as reference
  - More accessible and easier to understand

- ✅ **Letter breakdown improvements**:
  - Now organized by word (one word per line/row)
  - Shows full phrase as quizzed (no dropped words)
  - Uses `generateArabicBreakdownByWord()` for proper word-by-word splitting

**New Components:**
- `ChatTile.tsx` - Interactive Q&A component with OpenAI integration
- `MemoryAidTile.tsx` - Collapsible wrapper for memory aid editor
- `ContextTile.tsx` - Displays root/usage/cultural context information

**Technical Implementation:**
- Chat uses OpenAI's `gpt-4o-mini` model for cost-effective, fast responses
- System prompt provides context about the word/phrase being studied
- Chat history stored in component state (persists during session)
- All tiles use collapsible/expandable pattern to reduce visual clutter
- Memory aid state managed locally and synced with SaveDecisionPanel

### January 10, 2026 (Earlier) - Lesson Management & Smart Deduplication

**Lesson Management Features (Phase 1):**
- ✅ **Delete Lesson** - Remove unwanted lessons from library
  - Confirmation dialog before deletion
  - Preserves any words already saved to vocabulary
  - Automatically deletes associated vocabulary items from lesson
  - Refreshes lesson list after deletion
- ✅ **Edit Lesson** - Update lesson title and description
  - Modal dialog with editable fields
  - Title field (required), Description field (optional)
  - Updates lesson metadata in database
  - Refreshes lesson list after save
- ✅ **Regenerate Lesson** - Replace lesson vocabulary with new content
  - Confirmation dialog explaining regeneration
  - Clears existing vocabulary items
  - Preserves lesson metadata and practice progress
  - Note: Full AI regeneration coming in Phase 2
- ✅ **Action buttons** - Each lesson shows Edit/Regenerate/Delete buttons
  - Organized in a clean button row below lesson info
  - Color-coded (Delete is red, others neutral)
  - Icons for visual clarity

**Smart Lesson Deduplication:**

**Lesson Creation Flow (New):**
- ✅ **Duplicate detection** - System checks for similar existing lessons before creating
- ✅ **Smart matching** - Finds lessons with matching keywords in title (case-insensitive)
- ✅ **Resume existing lessons** - Click any similar lesson to resume practice
- ✅ **Auto-numbering** - New versions automatically numbered ("Room 2", "Room 3")
- ✅ **Success confirmation** - Clear feedback when lesson is created
- ✅ **Flexible actions** - Start exercise immediately or view all lessons

**How Lesson Creation Works:**
1. User enters topic (e.g., "Room")
2. System searches existing lessons with same language and content type
3. If similar lesson found → Show "Similar Lesson Found" dialog with:
   - List of existing lessons (clickable to resume)
   - "Create New Version (N)" button
   - Cancel option
4. If no similar lessons → Generate new lesson directly
5. AI generates vocabulary (excluding up to 100 already-saved words)
6. Lesson auto-saves to database with:
   - Title (with version number if duplicate)
   - Description, language, difficulty, content type
   - All vocabulary items linked to lesson
7. Success dialog shows:
   - Lesson title and item count
   - "Start Exercise" button
   - "View All Lessons" button

**Key Technical Details:**
- Similarity check: Case-insensitive keyword matching in titles
- Searches last 20 lessons of same language/content type
- Version numbering based on count of similar lessons
- Lessons save automatically (no manual save needed)
- Generated content stored for potential future features

**Database Operations:**
- Delete: `DELETE FROM lessons WHERE id = ?` (cascade deletes vocabulary_items)
- Edit: `UPDATE lessons SET title = ?, description = ? WHERE id = ?`
- Regenerate: `DELETE FROM vocabulary_items WHERE lesson_id = ?` (keeps lesson record)

**Component Changes:**
- `LessonLibrary.tsx`: Added lesson management state, handlers, and dialog UIs
- Each lesson card now shows action buttons instead of just click-to-start
- Three modal dialogs: Delete confirmation, Edit form, Regenerate confirmation

### January 9, 2026 - Lesson Library Redesign & UX Improvements

**Lesson Management:**
- ✅ **New Lesson Library page** - Complete redesign of lesson navigation
- ✅ Collapsible "Your Saved Lessons" section (default: collapsed)
- ✅ Fixed-height scrollable dropdown (max 320px) with internal scrolling
- ✅ Sticky header - can collapse from anywhere without scrolling back up
- ✅ Compact lesson list view (clickable titles instead of large cards)
- ✅ Chronological sorting (newest lessons first)
- ✅ Single-column content type selector (dropdown-style, not grid)
- ✅ Proper padding throughout (no edge-to-edge content)

**Lesson Creation:**
- ✅ **Egyptian dialect is now default** (was MSA)
- ✅ Dialect buttons reordered: Egyptian first, MSA second
- ✅ Dialect selector confirmed functional (passes to AI generation)

**Vocabulary Classification:**
- ✅ **Dynamic classification** based on actual text analysis
- ✅ Words: Single word only (wordCount === 1)
- ✅ Sentences: Multiple words, one sentence (wordCount > 1 && sentenceCount === 1)
- ✅ Passages: Multiple sentences (sentenceCount > 1)
- ✅ Classification uses word count (space-separated) and sentence detection (punctuation)
- ✅ Content saved from any lesson type is classified by its actual structure

**Word Context & Save UX:**
- ✅ **Word Context section** - Shows root, everyday Egyptian usage, and MSA comparison
- ✅ Root display with Arabic trilateral root and meaning
- ✅ Egyptian usage explanation (how word is used in daily conversation)
- ✅ MSA comparison (how MSA differs from Egyptian usage)
- ✅ Optional cultural notes for additional context
- ✅ Improved save experience for already-saved words
- ✅ Replaced toggle buttons with explicit "Save to Practice" and "Save to Archive"
- ✅ Users can now update image/note in place without moving between Practice/Archive
- ✅ Fixed loading spinner to only show on clicked save button (not both)
- ✅ Skip button in lookup now clears result and allows next lookup
- ✅ Removed non-functional Continue button from saved words view
- ✅ Translation consistency check to prevent mismatches with example sentences
- ✅ **Fixed word mismatch bug** - Exercise details now show same word as quiz prompt

### January 8, 2026 - Foundation Milestone
- ✅ Main menu reorganized (2x2 grid: Lessons + Lookup / My Saved Vocabulary)
- ✅ Content type filtering (Words/Sentences/Passages)
- ✅ Loading/success feedback on all save buttons
- ✅ Deprecated files archived to `src/_archive/`
- ✅ TypeScript config excludes archive from compilation
- ✅ Comprehensive ARCHITECTURE.md created

### January 7, 2026
- ✅ Egyptian Arabic display fixed (WordDisplay unified across app)
- ✅ Letter breakdown with vowels (generateArabicBreakdown)
- ✅ Memory aid persistence fixed
- ✅ Image display improved (object-contain)

---

## Known Limitations

- **No user auth** - Single-user app
- **No cross-device sync** - localStorage for preferences
- **Resume expires** - 24-hour limit on saved progress
- **Manual testing only** - No automated test suite yet

---

## Future Enhancements

- Spanish language expansion
- Audio pronunciation
- Offline mode with sync
- Automated testing
- Community features

---

## License

MIT

---

**For detailed technical documentation, see [ARCHITECTURE.md](./ARCHITECTURE.md)**
