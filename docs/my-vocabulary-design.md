# My Vocabulary - Feature Design Document

**Version**: 1.2  
**Date**: January 5, 2026  
**Status**: Approved - Arabic Focus

---

## Executive Summary

Transform "Saved Words" from a minor feature into the central experience of the app. The core insight: **learning a language is about collecting and mastering words in context**. Words are the atomic unit, but the sentences, phrases, and dialogues where they appear are essential for remembering how to actually speak.

**IMPORTANT**: Phase 12 focuses on **Arabic only**. Spanish will be a separate, simpler experience designed later. Arabic and Spanish vocabulary should NOT be mixed in the same cards or views.

---

## Core Philosophy

> "It's not just vocabulary. I need to be able to remember the words in use."

- **Words are the atomic unit** - practical for organization and review
- **Context is king** - every saved word carries its source sentence(s)/phrase(s)
- **Active collection** - users discover great words and deliberately save them
- **Spaced mastery** - words move through stages: needs review → solid → retired

---

## Data Model

### SavedWord (New Primary Entity)

```typescript
interface SavedWord {
  id: string;
  user_id: string;
  
  // The word itself
  word: string;                    // Arabic/Spanish word
  translation: string;             // English meaning
  language: 'arabic';  // Phase 12 is Arabic-only. Spanish will be separate.
  
  // Dialect-specific pronunciations (Arabic only)
  pronunciation_standard?: string;  // MSA/Fusha transliteration
  pronunciation_egyptian?: string;  // Egyptian Arabic transliteration
  
  // Learning metadata
  letter_breakdown?: LetterBreakdown[];  // For Arabic
  hebrew_cognate?: HebrewCognate;        // For Arabic
  
  // Source context - WHERE this word was found
  source_contexts: SourceContext[];      // Array - word can appear in multiple places
  
  // Organization
  topic?: string;                  // User-assigned or auto-detected topic
  tags?: string[];                 // User tags
  
  // Review status
  status: 'needs_review' | 'solid' | 'retired';
  times_practiced: number;
  times_correct: number;
  last_practiced?: Date;
  next_review?: Date;              // For spaced repetition
  
  // Timestamps
  created_at: Date;
  updated_at: Date;
}

interface SourceContext {
  id: string;
  saved_word_id: string;
  
  // The full context
  content_type: 'word' | 'phrase' | 'dialog' | 'paragraph';
  full_text: string;               // The complete phrase/sentence/dialog
  full_transliteration?: string;   // For Arabic
  full_translation: string;        // English translation
  
  // Dialog-specific
  speaker?: string;                // "A" or "B"
  dialog_context?: string;         // Stage direction
  
  // Source reference
  lesson_id?: string;              // Which lesson it came from
  vocabulary_item_id?: string;     // Original vocab item reference
  
  created_at: Date;
}
```

### Key Design Decisions

1. **Word as primary, context as child** - One word can have multiple source contexts
2. **Denormalized for speed** - Word data copied, not just referenced
3. **Status tri-state** - `needs_review` (default) → `solid` (user marks) → `retired` (removed from active review)
4. **Topic field** - Simple string, not complex taxonomy (keep it practical)

---

## User Flows

### Flow 1: Saving a Word from a Phrase

**Scenario**: User sees "كيف العمل؟" (How's work?) and wants to save "العمل" (work)

1. User completes exercise, sees feedback screen
2. Letter breakdown shows each word on its own line
3. User taps the word "العمل" 
4. Word card expands with save option
5. User taps "Save Word"
6. Word saved with full phrase as source context
7. Toast: "العمل saved to My Vocabulary"

**Alternative**: User can still save the entire phrase as one item

### Flow 2: Browsing My Vocabulary

**Entry Point**: Bottom navigation "My Words" (prominent, not hidden)

**Default View**: 
- Search bar at top
- Filter chips: "All" | "Needs Review" | "Solid" | "Arabic" | "Spanish"
- Sort: "A-Z" | "Recent" | "Topic"
- Word cards in scrollable list

**Word Card (Collapsed)**:
```
┌─────────────────────────────────────┐
│ العمل                    🔴 Review  │
│ al-'amal • work                     │
│ "كيف العمل؟" - How's work?          │
│                          ☐ Select   │
└─────────────────────────────────────┘
```

**Word Card (Expanded)** - tap to expand:
```
┌─────────────────────────────────────┐
│ العمل                    🔴 Review  │
│ al-'amal                            │
│ work, labor                         │
├─────────────────────────────────────┤
│ 📖 Letter Breakdown                 │
│ ا ل ع م ل                          │
│ (Alif)(Lam)(Ayn)(Meem)(Lam)        │
├─────────────────────────────────────┤
│ 🔗 Hebrew Cognate                   │
│ עמל (amal) - labor, toil           │
├─────────────────────────────────────┤
│ 💬 Found In:                        │
│ • "كيف العمل؟" - How's work?        │
│ • "أنا في العمل" - I'm at work      │
├─────────────────────────────────────┤
│ [Mark Solid] [Practice] [Remove]    │
└─────────────────────────────────────┘
```

### Flow 3: Searching & Filtering

**Search**: 
- Searches word, transliteration, translation, AND source contexts
- "work" finds العمل even if searching in English

**Filters** (can combine):
- Status: Needs Review / Solid / All
- Language: Arabic / Spanish / All
- Topic: (dropdown of user's topics)

**Sort**:
- Alphabetical (by word in target language)
- Alphabetical (by English translation)
- Recently added
- By topic
- Needs review first

### Flow 4: Selecting Words for Practice

1. User enters "selection mode" (button or long-press)
2. Checkboxes appear on each word card
3. User selects any number of words
4. Bottom action bar appears: "Practice 5 words"
5. Tapping starts exercise with selected words
6. Exercise uses source contexts for prompts when available

### Flow 5: Marking Status

**From word card**:
- "Mark Solid" button → status changes, visual indicator updates
- "Mark for Review" button → moves back to needs_review

**From practice**:
- After answering correctly: "Got it? [Yes, solid] [Still learning]"
- Quick way to update status during practice

### Flow 6: Removing/Retiring Words

**Soft delete (Retire)**:
- Word moves to "retired" status
- Hidden from default views
- Can be restored
- "Retired" filter to see them

**Hard delete**:
- Confirmation required
- Permanently removes word and all contexts

---

## UI Components

### 1. Bottom Navigation Update

```
┌─────────────────────────────────────┐
│  [Lessons]  [My Words]  [Profile]   │
│     📚         📝          👤       │
│              (42)                   │
└─────────────────────────────────────┘
```

- "My Words" becomes primary navigation item
- Badge shows count of words needing review

### 2. Word Save Modal (from exercise)

When tapping a word in letter breakdown:

```
┌─────────────────────────────────────┐
│         Save "العمل"?               │
│                                     │
│  al-'amal • work                    │
│                                     │
│  From: "كيف العمل؟"                  │
│        How's work?                  │
│                                     │
│  Topic: [Work ▼] (optional)         │
│                                     │
│  [Cancel]           [Save Word]     │
└─────────────────────────────────────┘
```

### 3. My Vocabulary Main Screen

```
┌─────────────────────────────────────┐
│ My Vocabulary                    ⚙️ │
├─────────────────────────────────────┤
│ 🔍 Search words...                  │
├─────────────────────────────────────┤
│ [All] [Needs Review 12] [Solid 30]  │
│ [Arabic] [Spanish]                  │
├─────────────────────────────────────┤
│ Sort: A-Z ▼        [Select] [+ Add] │
├─────────────────────────────────────┤
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ العمل                  🔴       │ │
│ │ al-'amal • work                 │ │
│ │ "كيف العمل؟"                    │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ مرحبا                  🟢       │ │
│ │ marhaba • hello                 │ │
│ │ "مرحبا، كيف حالك؟"              │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ... more words ...                  │
│                                     │
└─────────────────────────────────────┘
```

### 4. Practice Selection Bar

When words are selected:

```
┌─────────────────────────────────────┐
│ 5 words selected                    │
│ [Clear]              [Practice →]   │
└─────────────────────────────────────┘
```

---

## Database Schema Changes

### New Table: `saved_words`

```sql
CREATE TABLE saved_words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  
  -- Word data
  word TEXT NOT NULL,
  translation TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'arabic',  -- Phase 12 is Arabic-only
  
  -- Dialect-specific pronunciations (Arabic only)
  pronunciation_standard TEXT,    -- MSA/Fusha transliteration
  pronunciation_egyptian TEXT,    -- Egyptian Arabic transliteration
  
  -- Learning metadata (JSONB for flexibility)
  letter_breakdown JSONB,
  hebrew_cognate JSONB,
  
  -- Organization
  topic TEXT,
  tags TEXT[],
  
  -- Review status
  status TEXT NOT NULL DEFAULT 'needs_review' 
    CHECK (status IN ('needs_review', 'solid', 'retired')),
  times_practiced INTEGER DEFAULT 0,
  times_correct INTEGER DEFAULT 0,
  last_practiced TIMESTAMPTZ,
  next_review TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicates per user
  UNIQUE(user_id, word, language)
);

CREATE INDEX idx_saved_words_user ON saved_words(user_id);
CREATE INDEX idx_saved_words_status ON saved_words(user_id, status);
CREATE INDEX idx_saved_words_language ON saved_words(user_id, language);
CREATE INDEX idx_saved_words_topic ON saved_words(user_id, topic);
```

### New Table: `word_contexts`

```sql
CREATE TABLE word_contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  saved_word_id UUID REFERENCES saved_words(id) ON DELETE CASCADE,
  
  -- Context data
  content_type TEXT NOT NULL 
    CHECK (content_type IN ('word', 'phrase', 'dialog', 'paragraph')),
  full_text TEXT NOT NULL,
  full_transliteration TEXT,
  full_translation TEXT NOT NULL,
  
  -- Dialog-specific
  speaker TEXT,
  dialog_context TEXT,
  
  -- Source reference
  lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
  vocabulary_item_id UUID REFERENCES vocabulary_items(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_word_contexts_word ON word_contexts(saved_word_id);
```

### Migration Strategy

**No migration needed** - existing saved vocabulary was test data only.

1. Create new tables
2. Update all code to use new tables
3. Drop old `saved_vocabulary` table

---

## Implementation Phases

### Phase 12A: Database & Core Infrastructure
- [ ] Create new database tables
- [ ] Create TypeScript types
- [ ] Create hooks: `useSavedWords`, `useWordContexts`
- [ ] Drop old `saved_vocabulary` table (no migration needed)

### Phase 12B: Save Word Flow
- [ ] Make letter breakdown words tappable
- [ ] Create word save modal
- [ ] Implement save with context
- [ ] Update feedback screen save button

### Phase 12C: My Vocabulary Screen
- [ ] New route `/vocabulary` (or update `/saved`)
- [ ] Search functionality
- [ ] Filter by status, language
- [ ] Sort options
- [ ] Word card component (collapsed/expanded)

### Phase 12D: Selection & Practice
- [ ] Selection mode UI
- [ ] Multi-select functionality
- [ ] Practice selected words
- [ ] Update status from practice

### Phase 12E: Navigation & Polish
- [ ] Add bottom navigation
- [ ] Review count badge
- [ ] Empty states
- [ ] Loading states
- [ ] Animations

### Phase 12F: Lookup Mode (Word Input)
- [ ] Add "Look Up" entry point (floating button or nav item)
- [ ] Text input for any word/phrase (Arabic, Spanish, or English)
- [ ] Language auto-detection
- [ ] OpenAI integration for translation + breakdown
- [ ] Display results with full breakdown (both dialects for Arabic)
- [ ] Save to vocabulary option
- [ ] Handle multi-word input (break down each word)

---

## Lookup Mode Feature

### Overview

Allow users to type or paste ANY word/phrase and get a full breakdown - translation, transliteration, letter breakdown, Hebrew cognates - with the option to save to their vocabulary.

**Entry Points**:
- Floating "+" button on My Vocabulary screen
- "Look Up" option in bottom navigation
- Search bar with "Look up new word" option when no results

### User Flow

1. User taps "Look Up" or "+" button
2. Input modal appears with text field
3. User types/pastes word(s) in any language
4. System detects language and processes:
   - **Arabic input** → translate to English, generate full breakdown
   - **English input** → translate to Arabic with full breakdown
5. Results displayed with both dialect pronunciations, letter breakdown, Hebrew cognate
6. User can save word(s) to vocabulary

### Input Processing

```
User Input: "work" (English)
↓
OpenAI API Call:
- Translate to Arabic: العمل
- Generate pronunciations (Standard + Egyptian)
- Generate letter breakdown
- Find Hebrew cognates
↓
Display Results:
┌─────────────────────────────────────┐
│ 🔍 "work"                           │
├─────────────────────────────────────┤
│ العمل                               │
│                                     │
│ Standard (MSA): al-'amal            │
│ Egyptian: el-shoghol                │
│                                     │
│ 📖 Letter Breakdown                 │
│ ا ل ع م ل                          │
│                                     │
│ 🔗 Hebrew: עמל (amal) - labor       │
│                                     │
│ [Save to My Vocabulary]             │
└─────────────────────────────────────┘
```

### Multi-Word Input

If user enters a phrase like "How's work?":
- Translate the full phrase
- Break down into individual words
- Allow saving individual words OR the full phrase
- Each word gets its own breakdown

### Technical Implementation

```typescript
interface LookupResult {
  input: string;
  detected_language: 'arabic' | 'spanish' | 'english';
  
  // If input was English, provide both translations
  arabic_result?: {
    word: string;
    pronunciation_standard: string;
    pronunciation_egyptian: string;
    translation: string;
    letter_breakdown: LetterBreakdown[];
    hebrew_cognate?: HebrewCognate;
  };
  
  spanish_result?: {
    word: string;
    translation: string;
  };
  
  // If input was Arabic/Spanish, provide English translation
  english_translation?: string;
  
  // For phrases, break down into words
  word_breakdowns?: LookupResult[];
}

async function lookupWord(input: string): Promise<LookupResult> {
  // 1. Detect language
  // 2. Call OpenAI for translation + breakdown
  // 3. Return structured result
}
```

### OpenAI Prompt for Lookup

```
Given the input "${input}", provide:
1. Detect the language (arabic, spanish, or english)
2. If English: translate to Arabic (with Standard and Egyptian pronunciations) and Spanish
3. If Arabic: translate to English, provide letter breakdown, Hebrew cognate if exists
4. If Spanish: translate to English

For Arabic, always provide:
- Standard Arabic (MSA) pronunciation
- Egyptian Arabic pronunciation (may differ significantly)
- Letter-by-letter breakdown with diacritics

Return as JSON...
```

### UI Components

**Lookup Modal**:
```
┌─────────────────────────────────────┐
│ Look Up Word              [X Close] │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ Type any word or phrase...     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Examples: "hello", "مرحبا", "hola"  │
│                                     │
│           [Look Up]                 │
└─────────────────────────────────────┘
```

**Results View**:
- Shows detected language
- Full breakdown for each language option
- Save buttons for each result
- Option to look up another word

---

## Open Questions

1. **Topics**: Should topics be predefined or user-created? (Recommend: user-created with suggestions)

2. ~~**Manual word add**: Should users be able to add words manually, not just from lessons?~~ **ANSWERED: Yes, via Lookup Mode (see below)**

3. **Export**: Should users be able to export their vocabulary? (Recommend: Future feature)

4. **Sync**: Currently single-user app. When auth is added, how to handle? (Recommend: Design for it now, implement later)

---

## Success Metrics

- Users save 3x more words than before
- 50%+ of saved words have source context viewed
- Users return to "My Words" screen regularly
- Words marked "solid" have high retention in practice

---

## Appendix: Current vs. New Comparison

| Aspect | Current | New |
|--------|---------|-----|
| Save granularity | Whole vocab item only | Individual words from phrases |
| Context | Lost after saving | Preserved and displayed |
| Organization | Flat list | Search, filter, sort, topics |
| Status | Binary (saved/not) | needs_review / solid / retired |
| Practice | Select from list | Select any combination |
| Navigation | Hidden in menu | Primary bottom nav |
| Word details | Basic | Full breakdown + all contexts |

---

*This document should be reviewed and approved before implementation begins.*
