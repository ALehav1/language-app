# Component Architecture - Unified Content Display

## Problem Statement

Currently, words, sentences, and passages are displayed with **bespoke implementations** in each view:
- Different font sizes
- Different layouts
- Different features (some have Hebrew cognates, some don't)
- Different save mechanisms
- Inconsistent UX

**Goal**: A rich, consistent experience for words, sentences, and passages regardless of entry point (lesson, lookup, saved items, example within feedback).

---

## Current State Audit

### Places Where WORDS Are Displayed

| Location | File | Current Implementation | Issues |
|----------|------|----------------------|--------|
| Exercise Feedback | `ExerciseFeedback.tsx` | Inline JSX + lookupWord API | Has Hebrew cognate, example sentences |
| Lookup (single word) | `LookupView.tsx` | Inline JSX | Has word breakdown for phrases |
| Lookup (passage words) | `LookupView.tsx` | Inline JSX in map | Recently fixed: larger fonts, Hebrew inline |
| My Vocabulary list | `MyVocabularyView.tsx` | Inline JSX | Has detail modal |
| My Vocabulary detail | `MyVocabularyView.tsx` | Modal with inline JSX | Uses WordDetailCard partially |
| Word Detail Card | `WordDetailCard.tsx` | Shared component | Used inconsistently |
| Lesson Generator | `LessonGenerator.tsx` | Inline JSX | Basic display |

### Places Where SENTENCES Are Displayed

| Location | File | Current Implementation | Issues |
|----------|------|----------------------|--------|
| Exercise Feedback examples | `ExerciseFeedback.tsx` | Clickable buttons → modal | Has both dialects |
| Lookup example sentences | `LookupView.tsx` | Save buttons | Different from feedback |
| Lookup passage sentences | `LookupView.tsx` | Full card with word breakdown | Most complete |
| My Sentences list | `MySentencesView.tsx` | List items | Has detail modal |
| My Sentences detail | `MySentencesView.tsx` | Modal | Shows both dialects |
| WordDetailCard examples | `WordDetailCard.tsx` | Clickable → modal | Recently added |

### Places Where PASSAGES Are Displayed

| Location | File | Current Implementation | Issues |
|----------|------|----------------------|--------|
| Lookup passage result | `LookupView.tsx` | Full breakdown | Most complete |
| My Passages list | `MyPassagesView.tsx` | List items | Basic |
| My Passages detail | `MyPassagesView.tsx` | Modal | Shows translation |

---

## Proposed Unified Architecture

### Core Principle
**One component per content type, used everywhere.**

```
┌─────────────────────────────────────────────────────────────┐
│                    SHARED COMPONENTS                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐ │
│  │   WordDisplay   │  │ SentenceDisplay │  │PassageDisplay│ │
│  │                 │  │                 │  │             │ │
│  │ - Arabic text   │  │ - Both dialects │  │ - Full text │ │
│  │ - Translation   │  │ - Transliteration│ │ - Sentences │ │
│  │ - Pronunciations│  │ - English       │  │ - Words     │ │
│  │ - Hebrew cognate│  │ - Word breakdown│  │             │ │
│  │ - Letter breakdn│  │ - Save option   │  │             │ │
│  │ - Save option   │  │                 │  │             │ │
│  └────────┬────────┘  └────────┬────────┘  └──────┬──────┘ │
│           │                    │                   │        │
│           └────────────────────┼───────────────────┘        │
│                                │                            │
│                    ┌───────────▼───────────┐                │
│                    │    SaveDecisionPanel  │                │
│                    │  (shared save logic)  │                │
│                    └───────────────────────┘                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Component Specifications

#### 1. `WordDisplay` Component

**Props:**
```typescript
interface WordDisplayProps {
  // Core data
  arabic: string;
  arabicEgyptian?: string;
  translation: string;
  transliteration?: string;
  transliterationEgyptian?: string;
  
  // Optional enrichments
  hebrewCognate?: HebrewCognate | null;
  letterBreakdown?: LetterBreakdown[];
  exampleSentences?: ExampleSentence[];
  
  // Display options
  size?: 'compact' | 'normal' | 'large';
  showHebrewCognate?: boolean;
  showLetterBreakdown?: boolean;
  showExampleSentences?: boolean;
  showSaveOption?: boolean;
  
  // State
  isSaved?: boolean;
  savedStatus?: 'active' | 'learned';
  
  // Callbacks
  onSave?: (decision: SaveDecision, memoryAid?: MemoryAid) => void;
  onTap?: () => void; // For opening detail modal
}
```

**Features:**
- Arabic text with proper RTL and font sizing
- Egyptian pronunciation shown first (larger), MSA second (smaller)
- Hebrew cognate displayed inline when available
- Letter breakdown (horizontal RTL)
- Example sentences (clickable to expand)
- Save decision panel integration
- Memory aid support

**Used In:**
- Exercise feedback (word being practiced)
- Lookup results (single word)
- Lookup word breakdown (each word in phrase/passage)
- My Vocabulary list items
- My Vocabulary detail modal
- Anywhere a word needs to be displayed

#### 2. `SentenceDisplay` Component

**Props:**
```typescript
interface SentenceDisplayProps {
  // Core data - both dialects
  arabicMsa: string;
  arabicEgyptian: string;
  transliterationMsa: string;
  transliterationEgyptian: string;
  english: string;
  explanation?: string;
  
  // Word breakdown
  words?: WordInSentence[];
  
  // Display options
  size?: 'compact' | 'normal' | 'large';
  dialectPreference?: 'egyptian' | 'standard';
  showWordBreakdown?: boolean;
  showSaveOption?: boolean;
  
  // State
  isSaved?: boolean;
  
  // Callbacks
  onSave?: () => void;
  onWordTap?: (word: WordInSentence) => void;
  onTap?: () => void; // For opening detail modal
}
```

**Features:**
- Shows preferred dialect first (Egyptian by default)
- Both dialect versions visible
- Word-by-word breakdown with tap-to-save
- Each word shows Hebrew cognate inline
- Save sentence option
- Explanation/grammar notes

**Used In:**
- Exercise feedback example sentences
- Lookup example sentences
- Lookup passage sentences
- My Sentences list/detail
- Anywhere a sentence needs to be displayed

#### 3. `PassageDisplay` Component

**Props:**
```typescript
interface PassageDisplayProps {
  // Core data
  originalText: string;
  fullTranslation: string;
  fullTransliteration: string;
  sourceLanguage: 'arabic' | 'english';
  
  // Sentence breakdown
  sentences: SentenceInPassage[];
  
  // Display options
  dialectPreference?: 'egyptian' | 'standard';
  showSentenceBreakdown?: boolean;
  showSaveOption?: boolean;
  
  // State
  isSaved?: boolean;
  
  // Callbacks
  onSave?: () => void;
  onSentenceTap?: (sentence: SentenceInPassage) => void;
}
```

**Used In:**
- Lookup passage results
- My Passages list/detail

---

## Data Flow

### Unified Data Types

```typescript
// Core word data - used everywhere
interface ArabicWord {
  arabic: string;              // MSA with harakat
  arabicEgyptian?: string;     // Egyptian variant if different
  translation: string;
  transliteration: string;     // MSA
  transliterationEgyptian?: string;
  hebrewCognate?: HebrewCognate | null;
  letterBreakdown?: LetterBreakdown[];
}

// Core sentence data - used everywhere
interface ArabicSentence {
  arabicMsa: string;
  arabicEgyptian: string;
  transliterationMsa: string;
  transliterationEgyptian: string;
  english: string;
  explanation?: string;
  words?: ArabicWord[];
}

// Core passage data
interface ArabicPassage {
  originalText: string;
  fullTranslation: string;
  sentences: ArabicSentence[];
}
```

### Hebrew Cognate Lookup

**Always use static lookup table** (`hebrewCognates.ts`), never rely on AI:

```typescript
// Called automatically by WordDisplay component
const cognate = findHebrewCognate(word.arabic) || findHebrewCognate(word.arabicEgyptian);
```

---

## Migration Plan

### Phase 1: Create Shared Components
1. Create `src/components/WordDisplay.tsx` - unified word display
2. Create `src/components/SentenceDisplay.tsx` - unified sentence display
3. Create `src/components/PassageDisplay.tsx` - unified passage display

### Phase 2: Refactor Views to Use Shared Components
1. `ExerciseFeedback.tsx` → use WordDisplay, SentenceDisplay
2. `LookupView.tsx` → use WordDisplay, SentenceDisplay, PassageDisplay
3. `MyVocabularyView.tsx` → use WordDisplay
4. `MySentencesView.tsx` → use SentenceDisplay
5. `MyPassagesView.tsx` → use PassageDisplay
6. `WordDetailCard.tsx` → deprecate, replace with WordDisplay

### Phase 3: Cleanup
1. Remove duplicate inline JSX
2. Remove WordDetailCard (replaced by WordDisplay)
3. Update all imports
4. Test all entry points

---

## Entry Points Matrix

Every cell should provide the SAME rich experience:

| Entry Point | Words | Sentences | Passages |
|-------------|-------|-----------|----------|
| Lesson Exercise | WordDisplay | - | - |
| Exercise Feedback | WordDisplay | SentenceDisplay (examples) | - |
| Lookup (word) | WordDisplay | SentenceDisplay (examples) | - |
| Lookup (phrase) | WordDisplay (breakdown) | - | - |
| Lookup (passage) | WordDisplay (in sentences) | SentenceDisplay | PassageDisplay |
| My Vocabulary | WordDisplay | - | - |
| My Sentences | WordDisplay (breakdown) | SentenceDisplay | - |
| My Passages | WordDisplay (in sentences) | SentenceDisplay | PassageDisplay |

---

## Implementation Checklist

- [ ] Create `WordDisplay` component
- [ ] Create `SentenceDisplay` component  
- [ ] Create `PassageDisplay` component
- [ ] Refactor `ExerciseFeedback.tsx`
- [ ] Refactor `LookupView.tsx`
- [ ] Refactor `MyVocabularyView.tsx`
- [ ] Refactor `MySentencesView.tsx`
- [ ] Refactor `MyPassagesView.tsx`
- [ ] Deprecate `WordDetailCard.tsx`
- [ ] Update `agents.md` with new architecture
- [ ] Test all entry points for consistency
