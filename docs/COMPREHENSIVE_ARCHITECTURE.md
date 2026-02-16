# Language Learning App - Comprehensive Architecture Documentation

**Generated:** January 13, 2026
**Version:** 1.2 (Latest)
**Audience:** Developers, Technical Stakeholders

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Overview](#system-overview)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Core Architecture](#core-architecture)
6. [Data Architecture](#data-architecture)
7. [State Management](#state-management)
8. [User Flows](#user-flows)
9. [Component Architecture](#component-architecture)
10. [API Integration](#api-integration)
11. [Domain Layer](#domain-layer)
12. [Testing Strategy](#testing-strategy)

---

## Executive Summary

The Language Learning App is an AI-powered Arabic and Spanish learning platform built with React 19, TypeScript, and Vite. It leverages OpenAI's GPT-4 and DALL-E 3 for intelligent lesson generation, semantic answer validation, and visual memory aids. The app uses Supabase for data persistence and follows a feature-based folder structure with a domain abstraction layer for language-agnostic practice items.

### Key Metrics
- **Total Lines of Code:** ~17,518 (82 active TypeScript/TSX files)
- **Test Coverage:** 166/166 tests passing
- **Supported Languages:** Arabic (Egyptian + MSA), Spanish (LatAm + Spain)
- **Content Types:** Words, Sentences, Dialogs, Passages
- **Deployment:** Vercel (https://language-m6q3yz1z4-alehav1s-projects.vercel.app)

### Design Philosophy
- **No gamification** - Explicit save control, no badges/streaks/points
- **User-centric** - Features driven by learning needs, not engagement metrics
- **Multi-dialect support** - Egyptian Arabic primary, MSA as reference
- **Rich enrichments** - Hebrew cognates, memory aids, AI tutor integration

---

## System Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React 19)                     │
│  ┌────────────┐  ┌─────────────┐  ┌──────────────────────┐ │
│  │  MainMenu  │  │ LessonLibrary│  │  MyVocabularyView   │ │
│  │   (Home)   │  │  (AI Gen)    │  │  (Saved Words)      │ │
│  └──────┬─────┘  └──────┬──────┘  └──────────┬───────────┘ │
│         │                 │                     │            │
│         └─────────────────┴─────────────────────┘            │
│                           │                                  │
│              ┌────────────┴────────────┐                     │
│              │   ExerciseView          │                     │
│              │   (Practice Flow)       │                     │
│              └────────────┬────────────┘                     │
│                           │                                  │
│  ┌────────────────────────┴────────────────────────────┐    │
│  │            Custom Hooks & State Management           │    │
│  │  (useExercise, useSavedWords, useVocabulary, etc.)  │    │
│  └────────────────────────┬─────────────────────────────┘    │
└───────────────────────────┼──────────────────────────────────┘
                            │
         ┌──────────────────┴──────────────────┐
         │                                     │
    ┌────▼────┐                          ┌────▼─────┐
    │ OpenAI  │                          │ Supabase │
    │  API    │                          │PostgreSQL│
    │         │                          │ Storage  │
    │GPT-4o   │                          │          │
    │DALL-E 3 │                          │  Tables: │
    └─────────┘                          │  lessons │
                                         │  vocab   │
                                         │  saved   │
                                         │  contexts│
                                         └──────────┘
```

### Request Flow Example: Creating a Lesson

```
User clicks "Create Lesson"
    ↓
LessonGenerator component
    ↓
1. Fetch saved words (exclude from new lesson)
    ↓ Supabase query
2. Call OpenAI GPT-4o with prompt
    ↓ API call (5-10s)
3. Parse JSON response
    ↓
4. Insert lesson record
    ↓ Supabase insert
5. Insert vocabulary_items
    ↓ Supabase batch insert
6. Navigate to ExerciseView
    ↓
7. Fetch vocabulary items
    ↓ Supabase query
8. Initialize exercise state
    ↓
9. Display first question
```

---

## Technology Stack

### Frontend Core
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.2.3 | UI framework (latest) |
| **TypeScript** | 5.9.3 | Type safety (strict mode) |
| **Vite** | 7.3.0 | Build tool & dev server |
| **React Router** | 7.11.0 | Client-side routing |
| **TailwindCSS** | 3.4.19 | Utility-first styling |

### Backend Services
| Service | Purpose | Models/Features |
|---------|---------|-----------------|
| **Supabase** | Database + Storage | PostgreSQL, file uploads |
| **OpenAI** | AI/ML capabilities | GPT-4o, GPT-4o-mini, DALL-E 3 |

### Testing & Quality
| Tool | Version | Purpose |
|------|---------|---------|
| **Vitest** | 4.0.16 | Unit testing framework |
| **React Testing Library** | Latest | Component testing |
| **TypeScript Compiler** | 5.9.3 | Type checking & linting |

### Development Tools
- **Vercel** - Deployment platform
- **Git** - Version control
- **npm** - Package management

---

## Project Structure

```
language-app/
├── src/                          # Source code (8,434 lines)
│   ├── components/               # 26 reusable UI components
│   │   ├── modals/              # WordDetailModal, SentenceDetailModal
│   │   ├── BottomNav.tsx
│   │   ├── Card.tsx
│   │   ├── ClickableText.tsx
│   │   ├── CollapsibleSection.tsx
│   │   ├── LanguageSwitcher.tsx
│   │   ├── MemoryAidEditor.tsx
│   │   ├── MemoryAidTile.tsx
│   │   ├── SaveDecisionPanel.tsx
│   │   ├── WordBreakdownList.tsx
│   │   └── WordDisplay.tsx      # Unified word rendering
│   │
│   ├── features/                 # Feature modules
│   │   ├── home/
│   │   │   └── MainMenu.tsx     # Entry point (3 tiles)
│   │   ├── lessons/
│   │   │   ├── LessonLibrary.tsx
│   │   │   ├── LessonGenerator.tsx
│   │   │   └── LessonFeed.tsx
│   │   ├── exercises/
│   │   │   ├── ExerciseView.tsx  # Main practice flow
│   │   │   ├── ExercisePrompt.tsx
│   │   │   ├── AnswerInput.tsx
│   │   │   └── ExerciseFeedback.tsx
│   │   ├── vocabulary/
│   │   │   ├── VocabularyLanding.tsx
│   │   │   ├── MyVocabularyView.tsx
│   │   │   └── LookupModal.tsx
│   │   ├── lookup/
│   │   │   └── LookupView.tsx    # Translation lookup
│   │   ├── sentences/
│   │   │   └── MySentencesView.tsx
│   │   └── passages/
│   │       └── MyPassagesView.tsx
│   │
│   ├── hooks/                    # Custom React hooks (12 hooks)
│   │   ├── useExercise.ts       # Exercise logic (19 tests)
│   │   ├── useCardStack.ts      # Card management (16 tests)
│   │   ├── useSavedWords.ts     # Vocabulary CRUD
│   │   ├── useLessons.ts        # Lesson fetching
│   │   ├── useVocabulary.ts     # Adapter hook
│   │   └── useLessonProgress.ts # Progress tracking
│   │
│   ├── lib/                      # External service clients
│   │   ├── openai.ts            # OpenAI API wrapper (953 lines)
│   │   └── supabase.ts          # Supabase client
│   │
│   ├── utils/                    # Utility functions
│   │   ├── arabicLetters.ts     # Letter breakdown
│   │   ├── arabicBreakdown.ts
│   │   ├── egyptianDictionary.ts # 150+ MSA→Egyptian mappings
│   │   ├── egyptianInference.ts  # Rule-based generation
│   │   ├── hebrewCognates.ts    # 150+ Semitic roots
│   │   ├── transliteration.ts
│   │   ├── tokenizeWords.ts
│   │   └── splitSentences.ts
│   │
│   ├── types/                    # TypeScript definitions
│   │   ├── lesson.ts
│   │   ├── vocabulary.ts
│   │   ├── exercise.ts
│   │   └── supabase.ts
│   │
│   ├── contexts/                 # React Context
│   │   └── LanguageContext.tsx  # Global language state
│   │
│   ├── domain/                   # Domain layer (PR-2)
│   │   └── practice/
│   │       ├── types.ts         # PracticeItem abstraction
│   │       ├── fromVocabularyItems.ts
│   │       ├── fromSavedWords.ts
│   │       └── toVocabularyItem.ts
│   │
│   ├── test/                     # Test configuration
│   │   └── setup.ts
│   │
│   ├── _archive/                 # Deprecated code (excluded)
│   │   └── deprecated_components/
│   │
│   ├── main.tsx                  # React entry point
│   └── vite-env.d.ts
│
├── docs/                         # Documentation
│   ├── architecture/            # ADRs
│   ├── planning/                # Feature planning
│   ├── verification/            # Test reports
│   └── DESIGN_NOTES/            # Design decisions
│
├── supabase/                     # Database migrations
│   └── migrations/
│       ├── 001_initial_schema.sql
│       ├── 002_fresh_schema.sql
│       ├── 005_add_letter_breakdown.sql
│       ├── 006_add_content_type.sql
│       ├── 007_add_memory_aids.sql
│       └── 20260105_saved_words.sql
│
├── dist/                         # Build output (Vite)
├── public/                       # Static assets
│
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config (strict)
├── vite.config.ts                # Vite config
├── vitest.config.ts              # Test config
├── tailwind.config.js            # Styling config
├── vercel.json                   # Deployment config
│
├── README.md                     # User guide (19.4 KB)
├── ARCHITECTURE.md               # Technical reference (21.4 KB)
└── CHANGELOG.md                  # Version history
```

### Directory Purpose

**src/components/** - Shared, reusable UI components
- WordDisplay: Unified word rendering with all enrichments
- SaveDecisionPanel: Practice/Archive/Skip workflow
- MemoryAidTile: Collapsible memory aids
- ClickableText: Interactive text with word/sentence clicking

**src/features/** - Feature-specific views and logic
- Each feature has its own folder with views, components, and sometimes hooks
- Organized by user-facing capability (lessons, lookup, vocabulary, exercises)

**src/hooks/** - Custom React hooks for data and business logic
- Data hooks: useSavedWords, useLessons, useVocabulary
- Logic hooks: useExercise, useCardStack
- All follow consistent pattern: {data, loading, error, CRUD operations}

**src/lib/** - External service integrations
- openai.ts: Wraps OpenAI SDK with retry logic
- supabase.ts: Configured Supabase client

**src/utils/** - Pure functions for text processing
- Arabic-specific: letters, breakdown, Egyptian inference
- Hebrew cognates: Semitic root connections
- Text processing: tokenization, sentence splitting

**src/types/** - TypeScript type definitions
- Interfaces matching database schema
- Component prop types
- API response types

**src/domain/** - Language-agnostic domain layer (PR-2)
- PracticeItem: Universal representation of learnable content
- Adapters: Transform database types → PracticeItem → UI types

---

## Core Architecture

### Architectural Patterns

**1. Feature-Based Organization**
- Code organized by user-facing feature (lessons, lookup, vocabulary)
- Each feature encapsulates views, components, and logic
- Reduces coupling between unrelated features

**2. Custom Hooks for State Management**
- No Redux or external state library
- Custom hooks encapsulate data fetching and business logic
- Hooks return consistent interface: {data, loading, error, actions}

**3. Domain Abstraction Layer**
- PracticeItem provides language/modality-agnostic representation
- Adapters transform between database and domain models
- Enables future features (voice input, video content)

**4. Optimistic Updates**
- UI updates immediately on user action
- Database sync happens asynchronously
- Rollback on error via refetch

**5. Context for Global State**
- LanguageContext: Global language selection
- Persisted in localStorage
- Drives filtering, routing, and feature availability

### Data Flow Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Component Layer                    │
│  (React components, views, UI interactions)          │
└───────────────────┬──────────────────────────────────┘
                    │
                    │ Uses hooks
                    ▼
┌─────────────────────────────────────────────────────┐
│                 Custom Hooks Layer                   │
│  (useSavedWords, useExercise, useLessons, etc.)     │
│                                                      │
│  Pattern:                                            │
│  - Fetch data from DB/API                           │
│  - Transform via domain adapters                     │
│  - Manage local state (loading, error)              │
│  - Expose CRUD operations                           │
│  - Optimistic updates + rollback                    │
└───────────────────┬──────────────────────────────────┘
                    │
        ┌───────────┴────────────┐
        │                        │
        ▼                        ▼
┌───────────────┐      ┌─────────────────┐
│ Domain Layer  │      │  Service Layer   │
│               │      │                  │
│ PracticeItem  │      │ OpenAI client    │
│ abstractions  │      │ Supabase client  │
│               │      │                  │
│ Adapters:     │      │ Retry logic      │
│ - fromVocab   │      │ Error handling   │
│ - fromSaved   │      └─────────┬────────┘
│ - toVocab     │                │
└───────┬───────┘                │
        │                        │
        │                        ▼
        │              ┌──────────────────┐
        │              │  External APIs   │
        │              │                  │
        │              │ OpenAI (GPT-4o)  │
        │              │ Supabase (PG)    │
        └──────────────► Storage buckets  │
                       └──────────────────┘
```

### Component Hierarchy

```
main.tsx
  └─ LanguageProvider (Context)
       └─ BrowserRouter
            └─ RouteGuard (ensures language selected)
                 └─ Routes
                      ├─ MainMenu (/)
                      │    ├─ Language cards (inline, always visible)
                      │    └─ Learning tools (Lessons, Lookup, My Vocabulary)
                      │
                      ├─ LessonLibrary (/lessons)
                      │    ├─ LessonGenerator (modal)
                      │    └─ LessonFeed
                      │
                      ├─ ExerciseView (/exercise/:id)
                      │    ├─ ExercisePrompt
                      │    ├─ AnswerInput
                      │    └─ ExerciseFeedback
                      │         ├─ WordDisplay
                      │         ├─ ContextTile
                      │         ├─ MemoryAidTile
                      │         ├─ ChatTile
                      │         └─ SaveDecisionPanel
                      │
                      ├─ LookupView (/lookup)
                      │    ├─ WordDisplay
                      │    ├─ ContextTile
                      │    ├─ MemoryAidTile
                      │    └─ SaveDecisionPanel
                      │
                      └─ VocabularyLanding (/vocabulary)
                           └─ MyVocabularyView
                                ├─ WordDisplay
                                ├─ WordDetailModal
                                └─ LookupModal
```

---

## Data Architecture

See separate document: [DATA_ARCHITECTURE.md](./DATA_ARCHITECTURE.md)

### Database Tables (Supabase PostgreSQL)

**Core Tables:**
1. **lessons** - AI-generated lesson metadata
2. **vocabulary_items** - Lesson content (words, sentences, dialogs, passages)
3. **saved_words** - User's saved vocabulary with memory aids
4. **word_contexts** - Original sentences where words were encountered
5. **lesson_progress** - Completion history

**Planned Tables (referenced in code but not migrated):**
6. **saved_sentences** - Saved sentence collection
7. **saved_passages** - Saved passage collection

### Entity Relationships

```
lessons
  ├─ vocabulary_items (CASCADE DELETE)
  └─ lesson_progress (CASCADE DELETE)

saved_words
  └─ word_contexts (CASCADE DELETE)

vocabulary_items
  └─ word_contexts (SET NULL on delete)
```

---

## State Management

### Global State (LanguageContext)

**File:** `src/contexts/LanguageContext.tsx`

**Purpose:** Single global state for language selection

```typescript
interface LanguageContextValue {
  language: Language; // 'arabic' | 'spanish'
  setLanguage: (lang: Language) => void;
}
```

**Persistence:** localStorage key `language-app-selected-language`

**Usage:**
- Filters database queries by language
- Determines which features to show (transliteration, cognates)
- Drives OpenAI prompt generation
- Controls routing and UI language

### Local State (Custom Hooks)

**Pattern:** All data hooks follow this structure:

```typescript
function useDataHook(options?) {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await supabase.from('table').select('*');
            setData(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [dependencies]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const updateItem = useCallback(async (id, updates) => {
        // Optimistic update
        setData(prev => prev.map(item =>
            item.id === id ? { ...item, ...updates } : item
        ));

        try {
            await supabase.from('table').update(updates).eq('id', id);
        } catch (err) {
            await fetchData(); // Rollback
        }
    }, []);

    return { data, loading, error, updateItem, refetch: fetchData };
}
```

**Key Hooks:**
- **useSavedWords** - Vocabulary CRUD with optimistic updates
- **useExercise** - Exercise state machine (prompting → feedback → complete)
- **useVocabulary** - Adapter between database and UI types
- **useLessons** - Lesson list fetching

### Persisted State (localStorage)

**1. Language Selection**
```
Key: 'language-app-selected-language'
Value: 'arabic' | 'spanish'
Lifetime: Permanent
```

**2. Exercise Progress**
```
Key: 'exercise-progress-{lessonId}'
Value: SavedProgressV2 {
  version: 2,
  queue: string[],
  currentPos: number,
  answers: AnswerResult[],
  savedAt: number
}
Lifetime: 24 hours
```

**3. Egyptian Inference Cache**
```
Key: 'egyptian-inference-cache'
Value: { [msaWord]: { egyptian, confidence, source } }
Lifetime: Permanent
```

### Session State (React State)

**What lives only in React state:**
- UI state (modals open/closed, selected filters)
- Loading states for async operations
- Error messages
- Form inputs
- Undo windows (5-second card swipe undo)

**Lifetime:** Lost on page refresh

---

## User Flows

See separate document: [USER_FLOWS.md](./USER_FLOWS.md)

### Primary User Journeys

1. **Lesson Creation & Practice**
   - MainMenu → LessonLibrary → LessonGenerator → ExerciseView → Complete
   - Duration: 10-15 minutes per lesson
   - OpenAI calls: 1 (lesson generation), N (answer validation), M (word enrichment)

2. **Quick Lookup & Save**
   - MainMenu → LookupView → Paste text → View translation → Save
   - Duration: 30-60 seconds
   - OpenAI calls: 1 (lookup), 0-1 (memory aid generation)

3. **Vocabulary Review**
   - MainMenu → MyVocabularyView → Browse → Edit details
   - Duration: 5-10 minutes
   - OpenAI calls: 0-1 (if regenerating memory aid)

4. **Practice Saved Words**
   - MyVocabularyView → Selection mode → Practice → Complete
   - Duration: 5-10 minutes
   - OpenAI calls: N (answer validation)

---

## Component Architecture

### Shared Component Library

**WordDisplay.tsx** - Unified word rendering
- **Purpose:** Single source of truth for word display
- **Features:**
  - Dialect-aware (Egyptian primary, MSA reference)
  - Letter breakdown (organized by word)
  - Hebrew cognates (Semitic roots)
  - Example sentences (collapsible)
- **Usage:** ExerciseFeedback, LookupView, MyVocabularyView, WordDetailModal

**SaveDecisionPanel.tsx** - Save workflow
- **Purpose:** Consistent save/archive/skip interface
- **States:**
  - New word: [Practice | Archive | Skip]
  - Already saved: [Move to Practice/Archive | Delete]
- **Features:**
  - Loading states with spinners
  - Success feedback (checkmark for 2s)
  - Optimistic updates

**MemoryAidTile.tsx** - Collapsible memory aids
- **Purpose:** Container for memory aid generation/editing
- **Features:**
  - Default collapsed with "(saved)" indicator
  - Expands to show MemoryAidEditor
  - State persists during session

**MemoryAidEditor.tsx** - DALL-E integration
- **Purpose:** Generate and edit memory aids
- **Features:**
  - Text note input
  - DALL-E 3 image generation
  - Custom prompt support
  - Image preview

**ContextTile.tsx** - Word context display
- **Purpose:** Show root, usage, and cultural context
- **Features:**
  - Root information (e.g., ك-ت-ب = writing)
  - Egyptian usage explanation
  - MSA comparison
  - Optional cultural notes

**ChatTile.tsx** - AI tutor integration
- **Purpose:** Interactive Q&A about words/phrases
- **Features:**
  - GPT-4o-mini powered
  - Context-aware (knows current word)
  - Suggestion prompts
  - Chat history persists in session

### Component Patterns

**1. Collapsible Sections**
```typescript
<CollapsibleSection
  title="Example Sentences"
  count={sentences.length}
  defaultExpanded={false}
>
  {sentences.map(s => <Sentence {...s} />)}
</CollapsibleSection>
```

**2. Clickable Text for Deep Dives**
```typescript
<ClickableText
  text={arabicSentence}
  language="arabic"
  onWordClick={(word) => setSelectedWord(word)}
  onSentenceClick={(sentence) => setSelectedSentence(sentence)}
/>
```

**3. Modal Navigation**
```typescript
<WordDetailModal
  word={selectedWord}
  onPrevious={() => navigateToWord(currentIndex - 1)}
  onNext={() => navigateToWord(currentIndex + 1)}
  onClose={() => setSelectedWord(null)}
/>
```

---

## API Integration

### OpenAI Integration

**Client Setup:** `src/lib/openai.ts`

```typescript
import OpenAI from 'openai';

export const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // ⚠️ Development only
});
```

**Functions:**

**1. generateLessonContent()** - AI lesson generation
- **Model:** GPT-4o
- **Input:** Topic, level, language, dialect, excluded words
- **Output:** Title, description, 7-10 vocabulary items with enrichments
- **Cost:** ~$0.01-0.02 per lesson

**2. evaluateAnswer()** - Semantic answer validation
- **Model:** GPT-4o
- **Input:** User answer, correct answer, language
- **Output:** {correct: boolean, feedback: string}
- **Cost:** ~$0.0001-0.0002 per validation
- **Optimization:** Exact match check before API call

**3. lookupWord()** - Translation with enrichments
- **Model:** GPT-4o
- **Input:** Word, language, direction
- **Output:** Both dialects, letter breakdown, Hebrew cognate, examples, context
- **Cost:** ~$0.01-0.015 per lookup

**4. analyzePassage()** - Sentence-by-sentence breakdown
- **Model:** GPT-4o
- **Input:** Multi-sentence text, language
- **Output:** Sentence breakdown with word-level analysis
- **Cost:** ~$0.02-0.04 per passage

**5. generateMemoryAidImage()** - Visual mnemonics
- **Model:** DALL-E 3
- **Input:** Word, translation, custom prompt
- **Output:** Base64 image (1024x1024)
- **Cost:** $0.04 per image (most expensive operation)

**Retry Logic:**

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 1000
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (error.message.includes('API key')) throw error; // No retry on auth errors

      if (attempt < maxRetries - 1) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
}
```

### Supabase Integration

**Client Setup:** `src/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false, // No authentication
      autoRefreshToken: false,
    },
  }
);
```

**Query Patterns:**

**1. Simple Fetch:**
```typescript
const { data, error } = await supabase
  .from('lessons')
  .select('*')
  .order('created_at', { ascending: false });
```

**2. Filtered Fetch:**
```typescript
let query = supabase.from('saved_words').select('*');

if (status !== 'all') {
  query = query.eq('status', status);
}
if (language) {
  query = query.eq('language', language);
}

const { data } = await query;
```

**3. Batch Insert:**
```typescript
const { data, error } = await supabase
  .from('vocabulary_items')
  .insert(itemsArray)
  .select();
```

**4. Update with Optimistic UI:**
```typescript
// 1. Update UI immediately
setData(prev => prev.map(item =>
  item.id === id ? { ...item, ...updates } : item
));

// 2. Sync to database
const { error } = await supabase
  .from('table')
  .update(updates)
  .eq('id', id);

// 3. Rollback on error
if (error) {
  await fetchData(); // Refetch to restore correct state
}
```

---

## Domain Layer

### PracticeItem Abstraction

**File:** `src/domain/practice/types.ts`

**Purpose:** Language and modality-agnostic representation of learnable content

```typescript
interface PracticeItem {
  id: string;
  language: PracticeLanguage; // 'arabic' | 'spanish' | 'hebrew' | 'english'
  contentType: PracticeContentType; // 'word' | 'sentence' | 'passage' | 'dialog'
  targetText: string; // The content to practice
  translation: string; // English meaning
  transliteration?: string;

  // Interaction modes
  promptType: PromptType; // How to display the question
  answerType: AnswerType; // What input to expect

  // Metadata
  masteryLevelRaw: string;
  timesPracticed: number;

  // Enrichments (optional)
  letterBreakdown?: LetterBreakdown[];
  hebrewCognate?: HebrewCognate;
  exampleSentences?: ExampleSentence[];
  memoryNote?: string;
  memoryImageUrl?: string;

  // Source tracking
  origin: PracticeOrigin; // Where did this item come from?
  linkage?: PracticeLinkage; // How to update the source

  createdAt: string;
}
```

### Adapters

**1. fromVocabularyItems** - Database → Domain
```typescript
// Transforms vocabulary_items table rows into PracticeItems
const practiceItems = fromVocabularyItems(dbRows);
```

**2. fromSavedWords** - Saved vocabulary → Domain
```typescript
// Transforms saved_words table rows into PracticeItems
const practiceItems = fromSavedWords(savedWords);
```

**3. toVocabularyItem** - Domain → UI (legacy)
```typescript
// Transforms PracticeItem back to VocabularyItem for backward compatibility
const vocabItems = practiceItems.map(toVocabularyItem);
```

### Design Rationale (from ADR-001)

**Goals:**
1. **Voice-ready** - promptType and answerType enable audio practice
2. **Source tracking** - Know where content came from for analytics
3. **Modality-agnostic** - Support text, audio, video in future
4. **Language-explicit** - Never assume language
5. **Preserve raw state** - Don't transform mastery levels

**Non-Goals:**
- Bidirectional transformations (not needed)
- Unified mastery tracking (different sources use different scales)
- Automatic prompt/answer type detection (explicit configuration preferred)

---

## Testing Strategy

### Unit Testing (Vitest)

**Test Files:**
- `useExercise.test.ts` - 19 tests (exercise state machine)
- `useCardStack.test.ts` - 16 tests (card stack management)
- `tokenizeWords.test.ts` - Word tokenization
- `splitSentences.test.ts` - Sentence splitting
- Component tests for modals and interactive text
- Domain adapter tests (transformations + equivalence)

**Test Philosophy:**
1. **Baseline tests** - Document current behavior (including bugs)
2. **No test changes without intent** - Tests lock in behavior
3. **Fix bugs, then update tests** - Not the reverse

**Example Baseline Test:**
```typescript
it('BUG: does NOT auto-complete after last item (stays in feedback)', () => {
  // Test documents the bug without fixing it
  // When fixed, this test will be updated
});
```

### Component Testing

**Tools:** React Testing Library

**Patterns:**
- Test user interactions, not implementation details
- Query by role, label, or text (not by class or id)
- Mock external dependencies (OpenAI, Supabase)
- Use data-testid sparingly

### Integration Testing

**Status:** Not implemented

**Recommendation:** Add Cypress or Playwright for end-to-end flows:
- Lesson creation → practice → save → review
- Lookup → save → practice
- Multi-language switching

---

## Security Considerations

### Current Issues

**1. API Keys in Frontend** ⚠️
- OpenAI API key exposed in browser
- Supabase anonymous key publicly accessible
- **Risk:** Unauthorized usage, quota exhaustion
- **Mitigation:** Move to backend proxy (Vercel Functions)

**2. No Authentication**
- All data is public
- No Row Level Security (RLS)
- **Risk:** Data leakage in multi-user scenario
- **Mitigation:** Implement Supabase Auth + RLS

**3. No Rate Limiting**
- Frontend can spam expensive OpenAI requests
- **Risk:** Cost overrun
- **Mitigation:** Backend rate limiting + request quotas

### Recommended Security Architecture

```
Frontend (React)
    ↓ POST /api/lesson/generate
Backend (Vercel Functions)
    ↓ Rate limit check (per user/IP)
    ↓ Auth validation (JWT)
    ↓ OpenAI API call (server-side key)
    ↓ Response
Frontend
```

---

## Performance Considerations

### Current Bottlenecks

**1. OpenAI API Latency**
- Lesson generation: 5-10 seconds
- Answer validation: 1-3 seconds
- Word lookup: 2-5 seconds
- DALL-E generation: 10-15 seconds

**2. Database Queries**
- Saved words + contexts: ~800ms for 100 words
- No pagination (loads all at once)

**3. Memory Aids**
- Base64 images stored in database
- Large payloads for vocabulary fetches

### Optimization Opportunities

**1. Parallel API Calls**
```typescript
// Current (sequential)
const egyptian = await lookupWord(word, 'egyptian');
const msa = await lookupWord(word, 'msa');

// Optimized (parallel)
const [egyptian, msa] = await Promise.all([
  lookupWord(word, 'egyptian'),
  lookupWord(word, 'msa')
]);
```

**2. Prefetch Next Exercise**
```typescript
// Load next word data while showing feedback for current word
useEffect(() => {
  if (phase === 'feedback' && hasNext) {
    prefetchWord(nextItemId);
  }
}, [phase, nextItemId]);
```

**3. Pagination**
```typescript
// Current: Load all words
const { data } = await supabase.from('saved_words').select('*');

// Optimized: Load 20 at a time
const { data } = await supabase
  .from('saved_words')
  .select('*')
  .range(offset, offset + 19);
```

**4. Image Storage Migration**
```typescript
// Current: Base64 in database
memory_image_url: 'data:image/png;base64,iVBORw0KGgo...'

// Optimized: Supabase Storage
memory_image_url: 'https://[project].supabase.co/storage/v1/object/public/memory-images/[uuid].png'
```

---

## Deployment

### Vercel Configuration

**File:** `vercel.json`

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**Production URL:** https://language-m6q3yz1z4-alehav1s-projects.vercel.app

### Build Process

```bash
# 1. Install dependencies
npm install

# 2. Type check
npm run lint

# 3. Run tests
npm test

# 4. Build for production
npm run build
# → Outputs to dist/

# 5. Preview production build
npm run preview
```

### Environment Variables

**Required:**
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `VITE_OPENAI_API_KEY` - OpenAI API key

**Setup:**
1. Copy `.env.example` to `.env`
2. Fill in credentials
3. **Never commit `.env`** (in .gitignore)

---

## Future Architecture Considerations

### Scalability

**1. Multi-User Support**
- Add Supabase Auth
- Implement Row Level Security (RLS)
- User-specific vocabulary and progress

**2. Backend API Layer**
- Move OpenAI calls to serverless functions
- Add rate limiting and cost controls
- Enable caching for common requests

**3. Real-Time Features**
- Supabase real-time subscriptions
- Live progress sharing
- Collaborative learning

### Feature Extensions

**1. Voice Input/Output**
- PracticeItem already supports voice modes
- Integrate Web Speech API or Azure Speech
- Audio pronunciation practice

**2. Additional Languages**
- Hebrew (Hebrew cognates already implemented)
- French, German, Mandarin
- Domain layer designed for easy extension

**3. Advanced Analytics**
- Spaced repetition algorithms
- Learning velocity tracking
- Personalized review schedules

**4. Offline Support**
- Service Worker for caching
- IndexedDB for offline storage
- Sync on reconnect

---

## Conclusion

The Language Learning App is a well-architected, production-ready application with solid foundations for growth. The codebase demonstrates:

✅ **Strengths:**
- Type-safe with strict TypeScript
- Well-documented (ARCHITECTURE.md, README.md, ADRs)
- Comprehensive testing (166/166 tests passing)
- Clean separation of concerns
- Domain abstraction layer for future extensibility

⚠️ **Areas for Improvement:**
- Security (API keys in frontend)
- Performance (no pagination, large payloads)
- Error handling consistency
- Production readiness (rate limiting, monitoring)

**Next Steps:**
1. Review [ISSUES_ANALYSIS.md](./ISSUES_ANALYSIS.md) for detailed issue breakdown
2. Review [RECOMMENDATIONS.md](./RECOMMENDATIONS.md) for prioritized improvements
3. Implement Phase 1 security fixes (move API keys to backend)
4. Add pagination for vocabulary views
5. Migrate memory aid images to Supabase Storage

---

**Document Version:** 1.0
**Last Updated:** January 13, 2026
**Maintained By:** Development Team
