# Lookup Sentence View Regressions — 2026-01-12

**Date Reported:** 2026-01-12 14:50–14:55 UTC-05:00  
**Validation Source:** User screenshots at 375px width  
**Branch:** `p0-1/navigation-language-entry`  
**Context:** Lookup passage/sentence analysis view showing defects after P0-1 implementation

---

## ISSUE #1: Example Sentences Not Collapsed by Default

### Expected Behavior
- Example sentences in Lookup word view should be **collapsed by default**
- User taps to expand/view sentences
- Ref: `.windsurfrules` Section 10 — "Example sentences must be **collapsed by default**"

### Observed Behavior
- Example sentences appear fully expanded on load in Lookup word results
- No collapse/expand control visible

### Suspected Component
- **File:** `src/features/lookup/LookupView.tsx`
- **Lines:** 291–320 (example sentences rendering)
- **State:** No collapse state tracked for example sentences section

### Suspected Root Cause
- `showExampleSentences={false}` passed to `WordDisplay` (line 273)
- Manual rendering of example sentences outside WordDisplay (lines 292–320)
- No `useState` hook for collapsed/expanded state
- Missing expand/collapse button

---

## ISSUE #2: Per-Sentence Save Button Does Not Show Saved Location

### Expected Behavior
- Each saved sentence must show **where it is saved** (Practice or Archive)
- User must be able to **move** sentence between Practice ↔ Archive
- User must be able to **delete** sentence from saved location
- Ref: `.windsurfrules` Section 10 — "Items must always show **where they are saved**"

### Observed Behavior
- Sentence save button shows only "✓ Saved" or "💬 Save Sentence"
- No indication of Practice vs Archive
- No move or delete actions visible

### Suspected Component
- **File:** `src/features/lookup/LookupView.tsx`
- **Lines:** 295–318 (example sentence save buttons)
- **Lines:** 400–417 (passage sentence save buttons)
- **Hook:** `useSavedSentences` (lines 5, 32)

### Suspected Root Cause
- `isSentenceSaved()` returns boolean only, not status object
- No state tracking saved location (practice vs archive)
- Save button does not check `savedStatus` field
- No UI for move/delete actions

---

## ISSUE #3: Arabic Sentence Word Breakdown Not Rendering RTL Per-Word-Per-Line

### Expected Behavior
- Word breakdown: **one word per line**
- Each word rendered **RTL**
- Text **right-justified**
- Logical order preserved
- Ref: `.windsurfrules` Section 14 — "Word breakdown: one word per line, rendered RTL, logical order preserved"

### Observed Behavior
- Words appear in horizontal flex-wrap layout (inline)
- Not one-per-line vertical stack
- Unclear if RTL directionality is applied correctly

### Suspected Component
- **File:** `src/features/lookup/LookupView.tsx`
- **Lines:** 481–525 (word breakdown rendering in passage view)
- **Container:** `<div className="flex flex-wrap gap-2">` (line 484)

### Suspected Root Cause
- Layout using `flex flex-wrap` creates horizontal word chips
- Missing `flex-col` for vertical stacking
- Missing `dir="rtl"` on container
- Missing `text-right` or `items-end` for right-justification

---

## ISSUE #4: Arabic Font Sizes Too Small at 375px

### Expected Behavior
- Arabic text must be **comfortably readable on 375px**
- Font size must be **larger than Latin body text**
- Ref: `.windsurfrules` Section 14 — "Font size must be comfortably readable on 375px, larger than Latin body text"

### Observed Behavior
- Arabic sentence text appears small/cramped
- Transliteration and English translation more prominent than Arabic

### Suspected Component
- **File:** `src/features/lookup/LookupView.tsx`
- **Lines:** 426–427 (Egyptian sentence: `text-xl`)
- **Lines:** 449–450 (MSA sentence: `text-xl`)
- **Lines:** 503–510 (Word breakdown Arabic)

### Suspected Root Cause
- `text-xl` (20px) too small for Arabic at 375px
- Should be `text-2xl` (24px) or `text-3xl` (30px)
- Word breakdown uses dynamic size but may be undersized

---

## ISSUE #5: "Save Passage" Button Appears for Sentences

### Expected Behavior
- "Save Passage" button appears **only for passages** (multi-sentence input)
- "Save Sentence" button for single sentences
- Ref: `.windsurfrules` Section 10 — "There must be **no global 'Save Passage' button** for sentences"

### Observed Behavior
- "Save Passage" button visible even when analyzing single sentence
- Button text does not change based on content type

### Suspected Component
- **File:** `src/features/lookup/LookupView.tsx`
- **Lines:** 335–357 (Save Passage button always rendered in passage mode)
- **Lines:** 58–65 (`isPassageInput()` detection logic)

### Suspected Root Cause
- `mode === 'passage'` does not distinguish between single-sentence and multi-sentence passages
- Button always shows "Save Passage" when `passageResult` exists
- Need to check `passageResult.sentences.length === 1` and gate button or change text

---

## ISSUE #6: Language Pill Active State Mismatch

### Expected Behavior
- Only **one language pill** appears active (highlighted)
- Active pill matches current `language` state from `LanguageContext`
- Ref: `.windsurfrules` Section 12 — "Only one language pill may appear active"

### Observed Behavior
- Both Arabic and Spanish pills appear highlighted, OR
- Active pill does not match selected language

### Suspected Component
- **File:** `src/components/LanguageSwitcher.tsx`
- **Lines:** Button styling logic for active state
- **Context:** `LanguageContext` state not synchronized

### Suspected Root Cause
- Conditional class logic may be inverted or incorrect
- `language === 'arabic'` check may not match button value
- Missing z-index or style priority causing visual overlap

---

## Rendering Location Summary

| Issue | Component | File Path | Lines |
|-------|-----------|-----------|-------|
| #1 Example Sentences Collapsed | Lookup word result | `src/features/lookup/LookupView.tsx` | 291–320 |
| #2 Sentence Save Location | Lookup example sentences | `src/features/lookup/LookupView.tsx` | 295–318 |
| #2 Sentence Save Location | Lookup passage sentences | `src/features/lookup/LookupView.tsx` | 400–417 |
| #3 Word Breakdown RTL | Lookup passage word breakdown | `src/features/lookup/LookupView.tsx` | 481–525 |
| #4 Arabic Font Size | Lookup passage sentences | `src/features/lookup/LookupView.tsx` | 426, 449, 503–510 |
| #5 Save Passage Button | Lookup passage header | `src/features/lookup/LookupView.tsx` | 335–357 |
| #6 Language Pill Active | Header language switcher | `src/components/LanguageSwitcher.tsx` | Full component |

---

## State Fields Involved

| State/Hook | Location | Purpose | Issue(s) |
|------------|----------|---------|----------|
| `exampleSentencesExpanded` | Missing in LookupView | Track collapse/expand for example sentences | #1 |
| `isSentenceSaved()` | `useSavedSentences` hook | Returns boolean only, not status object | #2 |
| `savedSentences` state | LookupView line 41 | Tracks Set of saved sentences (no status) | #2 |
| Word breakdown container | LookupView line 484 | Uses `flex flex-wrap` not vertical | #3 |
| Arabic font classes | LookupView 426, 449 | `text-xl` too small | #4 |
| `mode` state | LookupView line 43 | Distinguishes word vs passage, not single vs multi-sentence | #5 |
| `language` context | LanguageContext | Active language state | #6 |
| LanguageSwitcher button classes | LanguageSwitcher component | Active state conditional styling | #6 |

---

## PHASE A COMPLETE

**Next Step:** PHASE B — Implement 6 fixes in one commit.

**DO NOT PROCEED** until user approves Phase A diagnosis.
