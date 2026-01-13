# Content Parity Validation Checklist — 2026-01-12

**Date:** 2026-01-12 (PHASE C complete)  
**Branch:** `p0-1/navigation-language-entry`  
**Scope:** Lookup view content model unification

---

## Manual Validation Steps

### Test at 375px Width (iPhone SE / 12 Mini baseline)

#### 1. Spanish Passage Lookup
- [ ] Enter Spanish multi-sentence passage
- [ ] Verify detected language shows Spanish
- [ ] Verify full passage translation appears (not just first sentence)
- [ ] Verify sentence list is collapsed by default
- [ ] Tap to expand sentence list
- [ ] Verify sentences show Spanish → English translation
- [ ] **Screenshot:** `spanish-passage-lookup-375px.png`

#### 2. Spanish Sentence Lookup
- [ ] Enter single Spanish sentence
- [ ] Verify it enters sentence mode (not passage mode)
- [ ] Verify NO "Save Passage" button appears
- [ ] Verify sentence translation is complete
- [ ] **Screenshot:** `spanish-sentence-lookup-375px.png`

#### 3. Arabic Sentence Lookup
- [ ] Enter single Arabic sentence
- [ ] Verify font size is readable (text-2xl or larger)
- [ ] Verify sentence mode activated
- [ ] Verify collapsible sections default to collapsed
- [ ] **Screenshot:** `arabic-sentence-lookup-375px.png`

#### 4. Arabic Passage Lookup
- [ ] Enter Arabic multi-sentence passage
- [ ] Verify passage mode activated
- [ ] Verify "Save Passage" button appears (if 2+ sentences)
- [ ] Verify sentence list collapsed by default
- [ ] Expand sentences
- [ ] Verify each sentence has independent save button
- [ ] **Screenshot:** `arabic-passage-lookup-375px.png`

#### 5. Word Click Behavior
- [ ] Open passage with word breakdown
- [ ] Click a word in breakdown
- [ ] Verify word detail modal/view opens (NOT immediate save)
- [ ] Verify save action is in word detail, not on chip
- [ ] **Screenshot:** `word-click-opens-detail-375px.png`

#### 6. Sentence Click Behavior
- [ ] View passage with multiple sentences
- [ ] Click a sentence card
- [ ] Verify switches to Sentence View
- [ ] Verify back button returns to passage
- [ ] **Screenshot:** `sentence-click-switches-view-375px.png`

#### 7. Save Sentence State
- [ ] Save a sentence from passage
- [ ] Verify shows "Saved to Practice"
- [ ] Verify Move to Archive button appears
- [ ] Verify Delete button appears
- [ ] Tap Move to Archive
- [ ] Verify label changes to "Saved to Archive"
- [ ] Verify Move to Practice button now shows
- [ ] **Screenshot:** `sentence-saved-state-375px.png`

#### 8. Save Passage Button Gating
- [ ] Enter single sentence
- [ ] Verify NO "Save Passage" button
- [ ] Enter 2+ sentence passage
- [ ] Verify "Save Passage" button DOES appear
- [ ] **Screenshot:** `save-passage-gating-375px.png`

---

## Screenshot Storage

Save all screenshots to:
```
docs/screenshots/content-parity-validation-2026-01-12/
```

Required screenshots:
1. `spanish-passage-lookup-375px.png`
2. `spanish-sentence-lookup-375px.png`
3. `arabic-sentence-lookup-375px.png`
4. `arabic-passage-lookup-375px.png`
5. `word-click-opens-detail-375px.png`
6. `sentence-click-switches-view-375px.png`
7. `sentence-saved-state-375px.png`
8. `save-passage-gating-375px.png`

---

## Known Limitations (Deferred to Next Pass)

### Not Implemented in This Phase:
- **Word Detail Modal:** `handleWordClick()` defined but modal not implemented
  - Currently logs to console, does not open modal
  - Requires separate WordDetailModal component integration

- **Full Sentence View:** Sentence view shows basic card only
  - Missing: AddedContextTile integration
  - Missing: WordBreakdownList integration
  - Basic transition skeleton in place

- **Exercise Detail Updates:** Exercise feedback not updated
  - Still uses inline rendering
  - Does not use new primitives (CollapsibleSection, AddedContextTile, WordBreakdownList)

- **Vocabulary Detail Updates:** My Vocabulary view not updated
  - Does not use new primitives
  - Word detail rendering unchanged

### Completed in This Phase:
✅ Content type detection (word/sentence/passage)
✅ View transition handlers (sentence click, word click stubs)
✅ CollapsibleSection extracted and wired in Lookup
✅ AddedContextTile created (not yet wired)
✅ WordBreakdownList created (not yet wired)
✅ Spanish language support in analyzePassage
✅ Typography improvements (Arabic text-2xl → text-3xl)
✅ Save semantics already fixed in previous phase B1-B3

---

## Build Status

**Tests:** 166/166 passing  
**Build:** ✅ Passing  
**Lint:** Non-blocking warnings only (markdown, CSS)

---

## Next Steps

**PHASE D (Manual Validation):**
1. Capture 8 required screenshots at 375px
2. Test all checklist items
3. Report any regressions

**Future Enhancement Pass:**
1. Implement WordDetailModal integration
2. Complete Sentence View with AddedContextTile + WordBreakdownList
3. Apply primitives to Exercise Detail
4. Apply primitives to Vocabulary Detail
5. Add comprehensive integration tests
