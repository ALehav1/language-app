# Change Log

This file tracks significant changes to the codebase organized by Pull Request.

---

## PR-2: PracticeItem Domain Abstraction

**Date:** January 11, 2026  
**Status:** ✅ Complete  
**Intent:** Establish language-agnostic practice domain layer (zero behavior change)

### Behavioral Changes
**None** - This PR intentionally introduces zero behavior changes.

### Files Created
- `src/domain/practice/PracticeItem.ts` - Canonical domain type
- `src/domain/practice/adapters/fromVocabularyItems.ts` - DbVocabularyItem → PracticeItem
- `src/domain/practice/adapters/fromSavedWords.ts` - SavedWord → PracticeItem
- `src/domain/practice/__tests__/adapters.test.ts` - Transformation tests (7 tests)
- `src/domain/practice/__tests__/adapter-equivalence.test.ts` - Equivalence tests (4 tests)
- `docs/architecture/adr/ADR-001-practice-item.md` - Architecture decision record
- `docs/architecture/adr/README.md` - ADR index
- `docs/verification/pr-2-practice-item.md` - PR verification note
- `docs/verification/CHANGELOG.md` - This file

### Files Modified
- `src/hooks/useVocabulary.ts` - Refactored to use domain adapters internally
- `src/hooks/useExercise.test.ts` - Fixed async timing tests (now 19/19 passing)
- `docs/architecture/dependency-map.md` - Added domain layer section
- `README.md` - Added domain section + updated test coverage

### How to Verify
```bash
npm run test:run  # Should show 46/46 passing
npm run lint      # Should show no errors
```

**Test Results:** 46/46 passing (100%)
- useExercise: 19/19
- useCardStack: 16/16  
- Domain adapters: 11/11

### Rollback Instructions
```bash
# Remove domain layer
rm -rf src/domain/

# Restore useVocabulary
git checkout src/hooks/useVocabulary.ts

# Remove tests
git checkout src/hooks/useExercise.test.ts

# Remove docs
rm docs/architecture/adr/ADR-001-practice-item.md
rm docs/architecture/adr/README.md
rm docs/verification/pr-2-practice-item.md
rm docs/verification/CHANGELOG.md
git checkout docs/architecture/dependency-map.md
git checkout README.md
```

**Impact of Rollback:** Zero - no consumers using PracticeItem yet

---

## PR-1: Inventory & Baseline Tests

**Date:** January 11, 2026  
**Status:** ✅ Complete  
**Intent:** Create dependency map + baseline tests (zero production changes)

### Behavioral Changes
**None** - No production code modified

### Files Created
- `src/test/setup.ts` - Vitest configuration with localStorage mock
- `src/hooks/useExercise.test.ts` - Baseline tests (19 tests)
- `src/hooks/useCardStack.test.ts` - Baseline tests (16 tests)
- `docs/architecture/dependency-map.md` - Complete hook dependency mapping
- `docs/verification/pr-1-inventory-baseline.md` - PR verification note

### Files Modified
- `package.json` - Added test scripts
- `README.md` - Added testing section
- `vitest.config.ts` - Test configuration

### How to Verify
```bash
npm run test:run  # Should show all tests passing
npm run lint      # Should show no errors
```

### Rollback Instructions
```bash
git checkout package.json README.md vitest.config.ts
rm -rf src/test/
rm src/hooks/*.test.ts
rm docs/architecture/dependency-map.md
rm docs/verification/pr-1-inventory-baseline.md
```

---

## Planned PRs

### PR-3: Exercise Queue Semantics
**Status:** Planned  
**Intent:** Fix skip behavior (move to end, not just increment index)

**Will Modify:**
- ADR-003 (write first)
- `src/hooks/useExercise.ts` implementation
- `src/hooks/useExercise.test.ts` (update to reflect intended behavior)

**Behavioral Change:** YES - Skip will move item to end of queue

---

### PR-4: Memory Unification + Language Correctness
**Status:** Planned  
**Intent:** Consolidate fragmented memory tables + fix language hardcoding

**Will Modify:**
- ADR-002 (canonical mastery system)
- Database schema (migration)
- `useSavedWords`, `useSavedSentences`, `useSavedPassages`
- Multiple UI components

**Behavioral Change:** YES - Major consolidation

---

## Guidelines

### When to Update This File
- After completing any PR
- Before marking PR as "done"
- Include verification commands
- Include rollback steps

### What to Include
- **Intent:** What problem does this solve?
- **Behavioral Changes:** List any user-visible changes
- **Files Created/Modified:** Exhaustive list
- **Verification:** Exact commands to run
- **Rollback:** Exact steps to undo

### What NOT to Include
- In-progress work
- Planned but not implemented changes
- Exploratory code that was deleted

---

**Last Updated:** January 11, 2026 (PR-2 completion)
