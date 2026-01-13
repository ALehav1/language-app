# Content Parity Design — 2026-01-12

**Status:** PHASE B — Design (awaiting approval)  
**Goal:** Unify Lookup, Exercise Detail, and Vocabulary Detail content models

---

## 1. Content Type Transition Diagram

### Current State: Passage → Sentence → Word Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         PASSAGE VIEW                             │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ • Full passage translation                                  │ │
│  │ • Added Context for passage                                 │ │
│  │ • "Save Passage" button (if 2+ sentences)                  │ │
│  │                                                              │ │
│  │ Sentence List (collapsed by default):                       │ │
│  │  ┌──────────────────────────────────────────────┐          │ │
│  │  │ Sentence 1: Arabic + Translation              │          │ │
│  │  │   → Click → Opens SENTENCE VIEW               │ ────────┼─┼─┐
│  │  └──────────────────────────────────────────────┘          │ │ │
│  │  ┌──────────────────────────────────────────────┐          │ │ │
│  │  │ Sentence 2: Arabic + Translation              │          │ │ │
│  │  │   → Click → Opens SENTENCE VIEW               │ ────────┼─┼─┤
│  │  └──────────────────────────────────────────────┘          │ │ │
│  └────────────────────────────────────────────────────────────┘ │ │
└─────────────────────────────────────────────────────────────────┘ │
                                                                     │
┌────────────────────────────────────────────────────────────────┐ │
│                        SENTENCE VIEW                            │◄┘
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ • Arabic (MSA + Egyptian, based on preference)            │  │
│  │ • Translation                                              │  │
│  │ • Explanation                                              │  │
│  │ • Added Context for sentence                               │  │
│  │ • Save controls:                                           │  │
│  │    - "Save Sentence" OR                                    │  │
│  │    - "Saved to Practice/Archive" + Move + Delete          │  │
│  │                                                              │  │
│  │ Word Breakdown (collapsed by default):                     │  │
│  │  ┌────────────────────────────────────────────┐            │  │
│  │  │ Word 1: Arabic + Gloss                      │            │  │
│  │  │   → Click → Opens WORD DETAIL VIEW          │ ──────────┼──┼─┐
│  │  └────────────────────────────────────────────┘            │  │ │
│  │  ┌────────────────────────────────────────────┐            │  │ │
│  │  │ Word 2: Arabic + Gloss                      │            │  │ │
│  │  │   → Click → Opens WORD DETAIL VIEW          │ ──────────┼──┼─┤
│  │  └────────────────────────────────────────────┘            │  │ │
│  └──────────────────────────────────────────────────────────┘  │ │
└────────────────────────────────────────────────────────────────┘ │
                                                                    │
┌───────────────────────────────────────────────────────────────┐ │
│                      WORD DETAIL VIEW                          │◄┘
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ • Arabic (MSA + Egyptian dialect split)                  │  │
│  │ • Translation + Transliteration                          │  │
│  │ • Hebrew Cognate (Arabic only)                           │  │
│  │ • Letter Breakdown (Arabic only)                         │  │
│  │ • Added Context (root, usage, cultural notes)            │  │
│  │ • Memory Aid (note + AI image)                           │  │
│  │ • Example Sentences (collapsed by default)               │  │
│  │ • Save controls:                                          │  │
│  │    - "Save Word" OR                                       │  │
│  │    - "Saved to Practice/Archive" + Move + Delete         │  │
│  └─────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────┘
```

### Required Behavior Rules

| Content Type | Clicking Behavior | Save Behavior | Where It Appears |
|--------------|-------------------|---------------|------------------|
| **Passage** | N/A (top-level) | Saves passage + all enrichments | Lookup (multi-sentence input) |
| **Sentence** | Switches to Sentence View | Saves one sentence to Practice/Archive | Lookup (example sentences, passage breakdown) |
| **Word** | Opens full Word Detail modal/view | Saves one word to Practice/Archive | Lookup (single word), Sentence breakdown, Exercise |

---

## 2. Canonical Components Inventory

### Components That Exist ✅

| Component | Location | Purpose | Current Usage |
|-----------|----------|---------|---------------|
| **WordDisplay** | `src/components/WordDisplay.tsx` | Display single word with all enrichments | Lookup word results, used as base |
| **SentenceDisplay** | `src/components/SentenceDisplay.tsx` | Display single sentence with word breakdown | Exercise feedback, should be used everywhere |
| **SaveDecisionPanel** | `src/components/SaveDecisionPanel.tsx` | Unified save UI (Practice/Archive choice) | WordDisplay |
| **MemoryAidTile** | `src/components/MemoryAidTile.tsx` | Memory note + AI image | Lookup word view |
| **ContextTile** | `src/components/ContextTile.tsx` (?) | Added Context display | **VERIFY IF EXISTS** |

### Components That Need Extraction 🔧

| Missing Component | What It Should Do | Currently Duplicated In |
|-------------------|-------------------|-------------------------|
| **PassageDisplay** | Display passage with collapsed sentence list | `LookupView.tsx` (lines 369-593) |
| **SentenceSaveControls** | Show "Saved to Practice/Archive" + Move/Delete | `LookupView.tsx` (inline in example sentences + passage sentences) |
| **AddedContextTile** | Display root/usage/cultural notes consistently | `LookupView.tsx` (inline), exercises, vocabulary |
| **CollapsibleSection** | Generic expand/collapse UI | `LookupView.tsx` (example sentences), should be reusable |

---

## 3. Bug → Cause → Fix Strategy Mapping

### Issue #1: Inconsistent Click Behavior

**Bug:**
- Clicking a word in passage breakdown sometimes saves it, sometimes does nothing
- No clear signal that clicking opens Word Detail

**Architectural Cause:**
- Word chips in `LookupView.tsx` lines 545-587 are `<button>` elements that call `handleSavePassageWord()`
- They don't transition to Word Detail View
- Violates rule: "Clicking a word must NEVER 'just check it'"

**Fix Strategy:**
1. Extract word click handler to open Word Detail modal/view
2. Move save action to Word Detail View's SaveDecisionPanel
3. Add visual indicator (chevron/arrow) that word is tappable

---

### Issue #2: Missing Added Context in Sentence View

**Bug:**
- Sentence cards show only translation + explanation
- No "Added Context" tile for sentence-level context

**Architectural Cause:**
- Added Context is only implemented for Word view in `LookupView.tsx`
- Sentence rendering (lines 430-539) has no context tile
- API may not return sentence-level context

**Fix Strategy:**
1. Verify if API returns sentence-level context
2. If yes: add `AddedContextTile` to sentence view
3. If no: document as future enhancement, focus on word/passage context
4. For now: ensure passage-level context appears when viewing passage

---

### Issue #3: Save Button Appears in Wrong Context

**Bug:**
- Word chips in word breakdown have inline save buttons
- Violates rule: "Clicking a word → Opens full Word Detail view"

**Architectural Cause:**
- Lines 555-558 in `LookupView.tsx`: word buttons call `onClick={() => !wordSaved && handleSavePassageWord(word)}`
- This short-circuits to save instead of opening detail

**Fix Strategy:**
1. Remove save logic from word chip `onClick`
2. Change to: `onClick={() => handleWordClick(word)}`
3. `handleWordClick` opens Word Detail modal
4. Word Detail modal handles save

---

### Issue #4: Sentence Click Doesn't Transition to Sentence View

**Bug:**
- Currently, sentence cards in passage breakdown are NOT clickable
- They show inline save controls, but can't be expanded

**Architectural Cause:**
- Lines 430-539 render sentences as static cards
- No `onClick` handler to switch to Sentence View
- Missing view state management

**Fix Strategy:**
1. Add `onSentenceClick(sentence)` handler
2. Switch to Sentence View (new state: `selectedSentence`)
3. Sentence View shows:
   - Full sentence detail
   - Word breakdown (collapsed)
   - Added Context
   - Save controls

---

### Issue #5: Arabic Word Breakdown Still Horizontal in Some Views

**Bug:**
- Word breakdown in passages may still use horizontal layout despite B2 fix
- Inconsistent between views

**Architectural Cause:**
- B2 fixed `LookupView.tsx` passage word breakdown (lines 541-589)
- Other views (Exercises, Vocabulary) may not use same layout

**Fix Strategy:**
1. Audit all views that show word breakdown
2. Ensure all use vertical RTL layout (`space-y-2 dir="rtl"`)
3. Extract to `WordBreakdownList` component for consistency

---

### Issue #6: Language Pill State Mismatch

**Bug:**
- Active language pill doesn't always match lookup language
- Possible stale state from previous screen

**Architectural Cause:**
- `LanguageContext` is single source of truth
- But lookup may derive language from input detection
- Mismatch between context state and detected language

**Fix Strategy:**
1. Ensure `setLanguage()` is called when lookup detects language
2. OR: Add separate "lookup language" indicator that respects detection
3. Keep pill state synchronized with actual lookup behavior

---

## 4. View-Specific Current State

### Lookup View (`src/features/lookup/LookupView.tsx`)

**Current Implementation:**
- ✅ Uses `WordDisplay` for single word results
- ✅ Has passage rendering with sentence breakdown
- ✅ Example sentences collapse by default (B1 fix)
- ✅ Per-sentence save shows Practice/Archive (B1 fix)
- ✅ Word breakdown is vertical RTL (B2 fix)
- ✅ "Save Passage" hidden for single sentences (B3 fix)

**Missing:**
- ❌ Word click doesn't open Word Detail
- ❌ Sentence click doesn't open Sentence View
- ❌ Added Context not shown for sentences

---

### Exercise Feedback (`src/features/exercises/ExerciseFeedback.tsx`)

**Current Implementation:**
- Uses `WordDisplay` for word enrichment
- Shows example sentences inline

**Needs Audit:**
- Does word click open detail?
- Does sentence click open detail?
- Is word breakdown vertical RTL?
- Is Added Context present?

---

### Vocabulary Detail (`src/features/vocabulary/MyVocabularyView.tsx`)

**Current Implementation:**
- Shows saved word/sentence/dialog/passage
- Has edit/move/delete controls

**Needs Audit:**
- Does it use `WordDisplay` / `SentenceDisplay`?
- Does word breakdown match?
- Is navigation to sub-items working?

---

## 5. Proposed Component Hierarchy

### Unified Content Display Architecture

```
ContentDisplay (context-aware wrapper)
├─ PassageDisplay
│  ├─ PassageHeader (translation, context, save)
│  └─ SentenceList (collapsible)
│     └─ SentenceCard (clickable)
│        └─ onClick → SentenceView
│
├─ SentenceView
│  ├─ SentenceHeader (dialects, translation, explanation)
│  ├─ AddedContextTile
│  ├─ SentenceSaveControls
│  └─ WordBreakdownList (collapsible)
│     └─ WordCard (clickable)
│        └─ onClick → WordDetailModal
│
└─ WordDetailModal
   ├─ WordDisplay (full enrichment)
   ├─ AddedContextTile
   ├─ MemoryAidTile
   ├─ SaveDecisionPanel
   └─ ExampleSentences (collapsible)
```

---

## 6. Refactoring Plan (High-Level)

### Step 1: Extract Reusable Components
- Create `PassageDisplay.tsx`
- Create `SentenceSaveControls.tsx`
- Create `AddedContextTile.tsx` (or verify existing)
- Create `CollapsibleSection.tsx`
- Create `WordBreakdownList.tsx`

### Step 2: Add Navigation Handlers
- `handleWordClick(word)` → opens WordDetailModal
- `handleSentenceClick(sentence)` → switches to SentenceView
- Modal/view state management in parent

### Step 3: Update Lookup View
- Replace inline passage rendering with `<PassageDisplay>`
- Replace inline sentence rendering with `<SentenceView>`
- Add modal for `<WordDetailModal>`

### Step 4: Audit and Update Other Views
- ExerciseFeedback → use unified components
- MyVocabularyView → use unified components
- Ensure all follow same interaction model

### Step 5: Verify Language Scoping
- Ensure active language pill matches lookup
- Ensure all content is language-scoped
- Test Arabic/Spanish switching

---

## PHASE B COMPLETE — AWAITING APPROVAL

**Next Step:** PHASE C — Implementation

Do NOT proceed to Phase C without explicit approval.
