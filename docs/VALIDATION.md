# Validation Checklist — Language Learning App

## Lookup Sentence View Fixes (2026-01-12)

**Branch:** `p0-1/navigation-language-entry`  
**Commits:** `73ab08c`, `0a7fb55`, `e4d8a2f`  
**Testing Width:** 375px (iPhone SE/12 Mini baseline)

### Manual Validation Checklist

#### 1. Example Sentences Collapse/Expand
- [ ] Navigate to Lookup → translate a single Arabic word
- [ ] Example sentences section shows **collapsed by default**
- [ ] Header shows "Example Sentences (N)" with down chevron
- [ ] Tap to expand → chevron rotates up, sentences appear
- [ ] Tap again → collapses back

#### 2. Per-Sentence Save State (Word Example Sentences)
- [ ] Expand example sentences
- [ ] Each sentence shows "💬 Save Sentence" button
- [ ] Tap Save on one sentence
- [ ] Button changes to show "✓ Saved to Practice"
- [ ] "Move to Archive" and "Delete" buttons appear
- [ ] Tap "Move to Archive" → text changes to "✓ Saved to Archive"
- [ ] "Move to Practice" button now available
- [ ] Tap Delete → sentence no longer shows as saved

#### 3. Per-Sentence Save State (Passage Sentences)
- [ ] Navigate to Lookup → paste multi-sentence Arabic passage
- [ ] Each sentence card shows "💬 Save Sentence" button
- [ ] Save a sentence → shows "✓ Saved to Practice"
- [ ] Move and Delete buttons work correctly
- [ ] Each sentence has **independent save state**

#### 4. Arabic Sentence Font Sizes
- [ ] On 375px width device/browser
- [ ] Arabic sentence text is **comfortably readable**
- [ ] Primary sentence (Egyptian or MSA) uses `text-2xl` (24px)
- [ ] Arabic text is **larger than English translation**
- [ ] No squinting required to read Arabic

#### 5. Word Breakdown RTL Vertical Layout
- [ ] In passage sentence view, scroll to "Word Breakdown" section
- [ ] Words appear **one per line** (vertical stack)
- [ ] Each word is **right-aligned** within its card
- [ ] Arabic text displays RTL correctly
- [ ] Order is preserved (right to left, top to bottom)
- [ ] Save indicator (+/✓) appears on **left side** of card

#### 6. Save Passage Button Gating
- [ ] Paste a **single sentence** (e.g., "أنا في غرفتي")
- [ ] Verify it enters passage mode (sentence breakdown appears)
- [ ] **"Save Passage" button should NOT appear**
- [ ] Only per-sentence save button visible
- [ ] Paste a **multi-sentence passage** (2+ sentences)
- [ ] **"Save Passage" button DOES appear** in header

### Screenshot Requirements

Capture at **375px width** and save to `docs/screenshots/lookup-sentence-fixes-2026-01-12/`:

1. **example-sentences-collapsed.png**
   - Lookup word result showing collapsed example sentences section

2. **example-sentences-expanded.png**
   - Same view with sentences expanded

3. **sentence-saved-practice.png**
   - Sentence showing "✓ Saved to Practice" with Move/Delete buttons

4. **sentence-saved-archive.png**
   - Sentence showing "✓ Saved to Archive" with Move/Delete buttons

5. **arabic-sentence-readable.png**
   - Passage sentence showing Arabic text at text-2xl size

6. **word-breakdown-vertical-rtl.png**
   - Word breakdown section showing vertical stacked layout, right-aligned

7. **single-sentence-no-save-passage.png**
   - Single sentence in passage mode, showing NO "Save Passage" button

8. **multi-sentence-save-passage.png**
   - Multi-sentence passage showing "Save Passage" button in header

### Success Criteria

✅ All checklist items pass  
✅ All screenshots captured  
✅ Build passes: `npm run build`  
✅ Lint passes: `npm run lint` (markdown warnings allowed)  
✅ No console errors during normal flows

---

## Previous Validations

### P0-1 Navigation + Language Entry

See `docs/P0-1_COMPLETE.md` for P0-1 validation checklist.
