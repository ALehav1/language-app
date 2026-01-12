# ADR-004: Interactive Text Selection (Word + Sentence Deep-Linking)

**Status:** Accepted  
**Date:** January 11, 2026  
**Deciders:** Development team  
**Related:** ADR-001 (PracticeItem), ADR-003 (Queue Semantics), PR-4

---

## Context

### The Problem

Users currently see example sentences and multi-sentence content (passages, dialogs) but cannot interact with individual words or sentences:

**Example sentences in ExerciseFeedback:**
```
Egyptian: "أنا بحب القهوة"
English: "I love coffee"
```
- User cannot tap "القهوة" to see word details
- No way to save individual words from examples
- No deep-linking into sentence context

**Multi-sentence content (passages/dialogs):**
```
"مرحبا. كيف حالك؟ أنا بخير، شكرا."
"Hello. How are you? I'm fine, thanks."
```
- User cannot tap a sentence to expand it
- No word-level interaction within sentences
- No sentence-level saving

### Why This Matters

1. **Learning from context:** Words are easier to remember when seen in sentences
2. **Vocabulary building:** Users discover new words while reading examples
3. **User autonomy:** Explicit control over what to save (app philosophy)
4. **Spanish readiness:** Interaction layer must work for any language

### Current State (PR-3 Baseline)

**Existing components:**
- `WordDisplay.tsx` - Shows word details with enrichments
- `SaveDecisionPanel.tsx` - Save controls (active/learned/skip)
- `LookupModal` - Modal pattern for word lookup
- `ExerciseFeedback` - Displays example sentences (static text)

**Missing pieces:**
- No tokenization utilities for clickable text
- No sentence splitting logic
- No click handlers for words/sentences
- No context passing from click → detail view

---

## Decision

### Core Behavior

**Clickable Words (from example sentences):**
1. User sees example sentence with clickable words
2. User taps any word → modal opens with WordDisplay
3. Modal pre-fills: selected word, parent sentence, dialect context
4. SaveDecisionPanel enables saving word to `saved_words`

**Clickable Sentences (from passages/dialogs):**
1. User sees multi-sentence content with clickable sentences
2. User taps sentence → sentence detail modal opens
3. Modal shows sentence with clickable words
4. User can save entire sentence OR individual words from it

### Navigation Approach: Modal

**Decision:** Use modal approach (not routes)

**Rationale:**
- ✅ Consistent with existing LookupModal pattern
- ✅ Preserves context (user doesn't lose place in exercise/passage)
- ✅ Simpler implementation (no routing overhead)
- ✅ Better mobile UX (swipe to dismiss)
- ❌ Not shareable via URL (acceptable for now - not a requirement)

**Implementation:**
- Reuse existing modal patterns
- WordDetailModal → renders WordDisplay + SaveDecisionPanel
- SentenceDetailModal → renders sentence + ClickableText (word mode) + SaveDecisionPanel

---

## Tokenization Strategy

### Goals

1. **Preserve RTL rendering** - Arabic text must not break visually
2. **Handle punctuation** - Treat punctuation as non-clickable separators
3. **Preserve whitespace** - Visual layout unchanged from original
4. **Mobile-friendly** - 48×48px minimum touch targets

### Word Tokenization

**Utility:** `src/utils/text/tokenizeWords.ts`

```typescript
interface Token {
  text: string;
  type: 'word' | 'punctuation' | 'whitespace';
  index: number;  // Position in original string
}

function tokenizeWords(text: string, language: Language): Token[]
```

**Rules:**
- Arabic: Split on whitespace, preserve diacritics
- English: Split on whitespace and punctuation
- Punctuation: Treat as separate non-clickable tokens
- Whitespace: Preserve for layout

**Test cases:**
- Arabic with punctuation: "مرحبا، كيف حالك؟"
- English with punctuation: "Hello, how are you?"
- Mixed numerals: "I have 3 cats"

### Sentence Splitting

**Utility:** `src/utils/text/splitSentences.ts`

```typescript
interface Sentence {
  text: string;
  index: number;  // Position in original string
}

function splitSentences(text: string, language: Language): Sentence[]
```

**Rules:**
- Arabic: Split on [.!?؟]
- English: Split on [.!?]
- Keep punctuation with sentence
- Handle edge cases (abbreviations - best effort, document limitations)

**Test cases:**
- Arabic: "مرحبا. كيف حالك؟"
- English: "Hello. How are you?"
- Multiple sentences with mixed punctuation

---

## ClickableText Component

### Interface

```typescript
interface ClickableTextProps {
  text: string;
  language: Language;
  dir: 'rtl' | 'ltr';
  mode: 'word' | 'sentence';
  onWordClick?: (context: WordSelectionContext) => void;
  onSentenceClick?: (context: SentenceSelectionContext) => void;
}
```

### Behavior

**Word mode:**
- Tokenizes text into words
- Each word wrapped in clickable span (48×48 target)
- Click triggers onWordClick with context

**Sentence mode:**
- Splits text into sentences
- Each sentence wrapped in clickable row/card
- Click triggers onSentenceClick with context

### Styling

- Clickable items: Subtle hover/active states
- Touch targets: Minimum 48×48px
- RTL support: `dir` attribute on container
- Punctuation: Visually attached, not clickable

---

## Context Passing

### WordSelectionContext

```typescript
interface WordSelectionContext {
  selectedText: string;        // The clicked word
  parentSentence: string;       // Full sentence containing word
  sourceView: 'exercise' | 'lookup' | 'vocab' | 'lesson';
  language: Language;
  dialect?: ArabicDialect;      // Optional, for Arabic
  contentType: ContentType;     // 'word' | 'sentence' | 'passage' | 'dialog'
}
```

### SentenceSelectionContext

```typescript
interface SentenceSelectionContext {
  selectedSentence: string;     // The clicked sentence
  parentPassage?: string;       // Full passage if from multi-sentence content
  sourceView: 'exercise' | 'lookup' | 'vocab' | 'lesson';
  language: Language;
  dialect?: ArabicDialect;
  contentType: ContentType;
}
```

**Usage:**
- Context passed from click handler → modal
- Modal uses context to pre-fill WordDisplay/SentenceDisplay
- SaveDecisionPanel saves with provenance metadata

---

## Save Flow

### Word Saving (from clicked word)

```
User clicks word in sentence
    ↓
onWordClick(context) triggered
    ↓
WordDetailModal opens
    ↓
WordDisplay renders with:
    - selectedText as target word
    - parentSentence for context
    - Existing lookup/analysis pipeline
    ↓
SaveDecisionPanel saves to saved_words
    - word: selectedText
    - source: 'sentence_click'
    - context: parentSentence
```

### Sentence Saving (from clicked sentence)

```
User clicks sentence in passage
    ↓
onSentenceClick(context) triggered
    ↓
SentenceDetailModal opens
    ↓
Renders:
    - Full sentence
    - ClickableText in word mode (words clickable within sentence)
    - SaveDecisionPanel for sentence itself
    ↓
User can:
    - Save entire sentence (contentType: 'sentence')
    - OR click individual word → WordDetailModal (nested flow)
```

---

## Where Clickability Is Enabled

### Phase 1 (PR-4)

1. **ExerciseFeedback example sentences**
   - Location: `src/features/exercises/ExerciseFeedback.tsx`
   - Replace static text with ClickableText (word mode)

2. **Passage/Dialog displays**
   - Location: Anywhere multi-sentence content shown
   - Render with ClickableText (sentence mode)
   - Each sentence opens SentenceDetailModal

### Future (Post-PR-4)

3. **LookupView results** - Clickable example sentences in lookup results
4. **Saved sentences view** - Clickable words in MySentencesView
5. **Lesson preview** - Clickable vocab in lesson cards

---

## Consequences

### Positive

✅ **Vocabulary discovery** - Users learn from context  
✅ **Consistent interaction** - Same pattern everywhere  
✅ **Provenance tracking** - Know where words came from  
✅ **Spanish-ready** - Language-parameterized tokenization  
✅ **Mobile-first** - Touch targets and modal UX  
✅ **Reuses existing UI** - WordDisplay, SaveDecisionPanel unchanged  

### Negative

⚠️ **Tokenization complexity** - Arabic RTL requires careful testing  
⚠️ **Touch target layout** - Inline clickable words need padding  
⚠️ **Modal nesting** - Sentence modal → word modal (two layers)  

### Risks & Mitigations

**Risk:** Tokenization breaks Arabic rendering (joined forms, diacritics)

**Mitigation:**
- Comprehensive unit tests for Arabic strings
- Visual regression testing at 375/768/1024 breakpoints
- Document known limitations (e.g., abbreviations)

**Risk:** Nested modals confuse users (sentence → word)

**Mitigation:**
- Clear visual hierarchy (sentence modal has "back" context)
- Test user flow: passage → sentence → word → save

**Risk:** Click targets too small on mobile

**Mitigation:**
- Enforce 48×48 minimum in ClickableText component
- Test on actual mobile devices (not just browser resize)

---

## Alternatives Considered

### Alternative 1: Route-Based Navigation

**Approach:** `/lookup?text=...&from=...&sentence=...`

**Rejected because:**
- More routing overhead (URL params, history management)
- Loses context (user navigates away from exercise)
- Worse mobile UX (no swipe to dismiss)
- Shareable URLs not a requirement (no collaboration features)

### Alternative 2: Inline Expansion (No Modal)

**Approach:** Clicked word expands inline with details

**Rejected because:**
- Breaks reading flow (content shifts)
- Hard to fit SaveDecisionPanel inline
- Inconsistent with existing lookup pattern
- Difficult on mobile (limited screen space)

### Alternative 3: Multiple Tokenizers per Language

**Approach:** `tokenizeArabic()`, `tokenizeEnglish()`, etc.

**Rejected because:**
- Code duplication
- Harder to add new languages (Spanish)
- Single parameterized tokenizer simpler to test
- Language-specific logic encapsulated in strategy pattern if needed

---

## Implementation Plan

### Phase 1: Utilities + Tests

1. Create `src/utils/text/tokenizeWords.ts`
2. Create `src/utils/text/splitSentences.ts`
3. Write unit tests (10+ test cases each)
4. Verify RTL rendering with actual Arabic strings

### Phase 2: ClickableText Component

1. Create `src/components/text/ClickableText.tsx`
2. Support word and sentence modes
3. Write component tests (render, click, RTL)
4. Test at 375/768/1024 breakpoints

### Phase 3: Context Types

1. Create `src/types/selection.ts`
2. Define WordSelectionContext, SentenceSelectionContext
3. Export from types/index.ts

### Phase 4: Modals

1. Create `src/components/WordDetailModal.tsx` (or reuse LookupModal)
2. Create `src/components/SentenceDetailModal.tsx`
3. Wire to WordDisplay + SaveDecisionPanel
4. Test save flow with mocked Supabase

### Phase 5: Wire Into ExerciseFeedback

1. Update ExerciseFeedback to use ClickableText
2. Add word click handler
3. Test: click word → modal → save → verify in saved_words

### Phase 6: Wire Into Passage/Dialog Displays

1. Identify all multi-sentence rendering locations
2. Update to use ClickableText (sentence mode)
3. Add sentence click handler
4. Test: click sentence → modal → word click → save

---

## Non-Goals (Explicitly Out of Scope)

❌ **Spanish dialect variations** - Will add when Spanish content introduced  
❌ **Audio pronunciation** - Voice features are PR-5+  
❌ **Morphological analysis** - No root extraction yet  
❌ **Smart quote detection** - Keep punctuation handling simple  
❌ **Shareable URLs** - No collaboration features yet  
❌ **Offline support** - Not a requirement  

---

## Validation Criteria

PR-4 is complete when:

- [ ] Utilities created + unit tests passing (tokenizeWords, splitSentences)
- [ ] ClickableText component created + tested
- [ ] WordSelectionContext + SentenceSelectionContext types defined
- [ ] Word click opens modal with WordDisplay
- [ ] Sentence click opens sentence modal
- [ ] SaveDecisionPanel works from both word and sentence contexts
- [ ] All tests passing (55 baseline + new PR-4 tests)
- [ ] TypeScript: 0 errors
- [ ] Mobile breakpoints verified (375/768/1024)
- [ ] Documentation updated (ARCHITECTURE, dependency-map, CHANGELOG)
- [ ] Verification note created

---

## Testing Strategy

### Unit Tests (Utilities)

**tokenizeWords.ts:**
- Arabic with punctuation
- English with punctuation
- Mixed numerals
- Edge cases (empty string, single word)

**splitSentences.ts:**
- Arabic punctuation (؟.)
- English punctuation (.!?)
- Multiple sentences
- Edge cases (no punctuation, abbreviations)

### Component Tests (ClickableText)

- Renders tokens preserving whitespace
- Click calls onWordClick with correct context
- RTL rendering (dir="rtl" applied)
- Touch targets minimum 48×48

### Integration Tests (Feature Wiring)

**ExerciseFeedback:**
- Render with example sentence
- Click word → modal opens
- Verify selectedText matches clicked word
- Save flow → verify insert to saved_words (mocked)

**Passage Display:**
- Render multi-sentence content
- Click sentence → sentence modal opens
- Click word within sentence → word modal opens
- Verify nested modal flow

### Regression Tests

- All 55 existing tests still pass
- No behavior change in existing components
- TypeScript clean

---

## References

- **PR-3 Verification:** `/docs/verification/pr-3-exercise-queue.md`
- **ADR-001:** PracticeItem domain abstraction
- **ADR-003:** Exercise queue semantics
- **SAFE_CHANGES.md:** Change control protocol
- **ARCHITECTURE.md:** Current component architecture
