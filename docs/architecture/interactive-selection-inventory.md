# Interactive Text Selection - Surface Inventory

**Date:** January 11, 2026  
**PR-4 Status:** Implementation complete, awaiting UAT

---

## Purpose

This document inventories all locations where multi-sentence text is rendered and whether interactive text selection (clickable words/sentences) is implemented.

---

## Wired Surfaces (✅ Clickable)

### 1. ExerciseFeedback - Example Sentences
**File:** `src/features/exercises/ExerciseFeedback.tsx`  
**What it renders:** Egyptian and MSA example sentences from word lookups  
**Clickable:** ✅ Yes (word-level)  
**Implementation:** ClickableText component in word mode  
**User flow:** Exercise → Feedback → Expand sentences → Tap word → WordDetailModal  
**Notes:** Both Egyptian and MSA variants are clickable

### 2. MyPassagesView - Multi-Sentence Passages
**File:** `src/features/passages/MyPassagesView.tsx`  
**What it renders:** Saved passages with 2+ sentences (Arabic or English)  
**Clickable:** ✅ Yes (sentence-level for multi-sentence content)  
**Implementation:** splitSentences() + sentence buttons → SentenceDetailModal  
**User flow:** My Vocabulary → Passages → Open passage → Tap sentence → SentenceDetailModal → Tap word → WordDetailModal  
**Notes:** Single-sentence passages remain static (no unnecessary clicking)

---

## Legacy Components (⚠️ Not Wired - To Be Deprecated)

### 3. SentenceDisplay Component
**File:** `src/components/SentenceDisplay.tsx`  
**What it renders:** Arabic sentences with dual-dialect display and word breakdown  
**Clickable:** ❌ No (legacy component)  
**Current usage:** MySentencesView  
**Status:** Legacy component predating PR-4 architecture  
**Planned action:** DEFER to PR-6 (sentence component migration)  
**Justification:**
- SentenceDisplay has its own word breakdown UI (different pattern from ClickableText)
- MySentencesView shows single saved sentences (not multi-sentence passages)
- Wiring would require refactoring SentenceDisplay's internal word tap logic
- Low user impact: MySentencesView is for reviewing saved sentences, not discovering new content
- PR-6 will consolidate sentence rendering patterns

**Workaround for now:** Users can:
- Use Lookup to discover new sentences (uses new architecture)
- Use MyPassagesView for multi-sentence content (fully wired)
- MySentencesView word breakdown still functional (uses existing WordDisplay modal)

---

## Excluded Surfaces (Intentionally Not Clickable)

### 4. WordDisplay Component
**File:** `src/components/WordDisplay.tsx`  
**What it renders:** Single word details (letter breakdown, pronunciations)  
**Clickable:** ❌ N/A (displays single words, not sentences)  
**Notes:** Not applicable - this component shows word-level detail, not text selection

### 5. ExercisePrompt
**File:** `src/features/exercises/ExercisePrompt.tsx`  
**What it renders:** Question prompts during exercises  
**Clickable:** ❌ No (intentionally excluded)  
**Justification:** User is answering questions, not exploring content. Clickable text would interfere with exercise flow.

### 6. LessonCard / LessonFeed
**File:** `src/components/LessonCard.tsx`, `src/features/lessons/LessonFeed.tsx`  
**What it renders:** Lesson previews and metadata  
**Clickable:** ❌ No (intentionally excluded)  
**Justification:** These are navigation surfaces, not content consumption surfaces.

---

## LookupView Status

### 7. LookupView - Translation Results
**File:** `src/features/lookup/LookupView.tsx`  
**Status:** ⚠️ NEEDS VERIFICATION  
**What it renders:** Translation results (words, sentences, passages)  
**Expected behavior:**
- Single word lookup → shows WordDisplay (not clickable by design)
- Sentence lookup → should show example sentences (likely uses older pattern)
- Passage lookup → may render multi-sentence content

**Action required:** Verify LookupView rendering after UAT. If it uses legacy patterns:
- Option A: Wire in PR-4 if trivial
- Option B: Defer to PR-6 with SentenceDisplay migration

---

## Summary

### Currently Wired (PR-4)
- ✅ ExerciseFeedback example sentences (word-level)
- ✅ MyPassagesView multi-sentence passages (sentence-level)

### Deferred to PR-6
- ⚠️ SentenceDisplay component (used by MySentencesView)
- ⚠️ LookupView (pending verification)

### Intentionally Excluded
- ❌ ExercisePrompt (interferes with exercise flow)
- ❌ LessonCard/LessonFeed (navigation surfaces)
- ❌ WordDisplay (single-word component)

---

## Next Steps

1. **Phase 10 UAT:** Validate ExerciseFeedback + MyPassagesView flows work correctly
2. **LookupView audit:** Check if it needs wiring or already uses new patterns
3. **PR-6 planning:** Consolidate sentence rendering (SentenceDisplay → ClickableText migration)

---

## Design Principles (Established by PR-4)

**When to make text clickable:**
- ✅ Content consumption contexts (reading passages, reviewing examples)
- ✅ Discovery contexts (exploring new vocabulary)
- ❌ Exercise/test contexts (user is answering questions)
- ❌ Navigation contexts (menus, lesson lists)

**Clickability levels:**
- **Word-level:** For example sentences, short phrases
- **Sentence-level:** For multi-sentence passages, dialogs
- **Nested:** Sentences can contain clickable words

**Future expansion (post-PR-4):**
- Spanish content (reuse ClickableText with language='spanish')
- Audio integration (add pronunciation to WordDetailModal)
- Multi-word phrases (extend tokenization for idiomatic units)
