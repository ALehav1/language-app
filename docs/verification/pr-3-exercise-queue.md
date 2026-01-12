# PR-3: Exercise Queue Semantics & Versioned Persistence

**Status:** ✅ Verified  
**Date:** 2025-01-11  
**Tests:** 55/55 passing (9 new queue tests, 46 baseline tests updated)  
**TypeScript:** 0 errors

---

## Summary

PR-3 refactors `useExercise` to implement **queue-based exercise semantics** with **versioned persistence**, fixing the broken skip behavior and enabling safe resume from any point in an exercise session.

### What Changed

**Before (V1):**
- Skip incremented `currentIndex`, could skip past end and complete
- Progress saved only after `continueToNext()`, not after `submitAnswer()`
- No migration path for schema changes

**After (V2 - PR-3):**
- Skip **rotates current item to end of queue**, always shows next unanswered item
- Progress saved immediately after any state change (answers, skips, continue)
- V1→V2 migration preserves all answered items and queue position

---

## Skip Semantics (ADR-003)

### Queue Rotation Behavior

```
Initial: [A, B, C]  currentPos=0  → current=A

Skip A:  [B, C, A]  currentPos=0  → current=B  (A rotated to end)
Skip B:  [C, A, B]  currentPos=0  → current=C  (B rotated to end)
Answer C: [A, B]    currentPos=0  → current=A  (C removed from queue)
```

### Key Invariants

1. **Skip does NOT create an answer** - `answers` array unchanged
2. **Skip does NOT complete** - completion requires all items answered
3. **Queue length decreases only on answer** - skip preserves queue length
4. **Items cycle until answered** - skipped items always return

---

## Persistence Schema

### V2 Format (Canonical)

```typescript
interface SavedProgressV2 {
  version: 2;
  queue: string[];           // Item IDs in current queue order
  currentPos: number;        // Cursor into queue (0-based)
  answers: AnswerResult[];   // Completed answers
  savedAt: number;           // Timestamp (ms since epoch)
}
```

### V1 Format (Legacy)

```typescript
interface SavedProgressV1 {
  currentIndex: number;      // Absolute index into vocabItems
  answers: AnswerResult[];
  savedAt: number;
}
```

---

## Migration Path (V1→V2)

### Automatic Upgrade

When `useExercise` loads V1 progress:

1. **Detect format:** Check for `version: 2` field
2. **If V1:** Run migration in `hydrateProgress()`
3. **Build queue:** Items from `currentIndex` forward, excluding answered
4. **Set position:** Always `currentPos = 0` (start of reconstructed queue)
5. **Persist V2:** Write upgraded format to localStorage

### Migration Logic

```typescript
function hydrateProgress(saved: SavedProgress, vocabItems: VocabularyItem[]): SavedProgressV2 | null {
  if (isV2Progress(saved)) return saved;  // Already upgraded
  
  // V1→V2 migration
  const answeredIds = new Set(saved.answers.map(a => a.itemId));
  const queue = vocabItems
    .slice(saved.currentIndex)     // Start from where V1 left off
    .filter(item => !answeredIds.has(item.id))
    .map(item => item.id);
  
  return {
    version: 2,
    queue,
    currentPos: 0,               // Queue already represents remaining items
    answers: saved.answers,
    savedAt: saved.savedAt,
  };
}
```

### Migration Proof (Test 5)

```typescript
// V1 fixture: currentIndex=1, answered=[item-a]
const v1Progress = {
  currentIndex: 1,
  answers: [{ itemId: 'item-a', correct: true, ... }],
  savedAt: Date.now()
};

// After mount with vocabItems=[a,b,c]:
// → Queue migrated to [b, c] (items from index 1, excluding answered item-a)
// → V2 persisted to localStorage
// → Answers preserved: 1 item (item-a)
```

---

## Deterministic Hydration

### Problem Solved

Previously, tests were flaky due to race conditions between:
- localStorage read
- Initial state setup
- First render/persistence write

### Solution

Added `isHydrated` flag ensuring:

1. **Single hydration pass** - idempotent initialization
2. **Persistence guard** - no writes until hydration complete
3. **Test helper** - `waitForHydration()` ensures stable state before assertions

```typescript
// In useExercise.ts
const [isHydrated, setIsHydrated] = useState(false);

useEffect(() => {
  if (isHydrated) return;  // Already hydrated
  if (vocabItems.length === 0) return;
  
  const hydratedProgress = hydrateProgress(savedProgress, vocabItems);
  // ... restore queue/answers
  setIsHydrated(true);  // Signal hydration complete
}, [vocabItems.length, savedProgress, isHydrated]);

// Persistence guard
useEffect(() => {
  if (!isHydrated) return;  // Don't persist until hydration done
  // ... save progress
}, [isHydrated, queue, currentPos, answers, phase]);
```

---

## Rollback Instructions

If PR-3 causes issues in production:

### Option 1: Revert to V1 (Full Rollback)

```bash
git revert <pr-3-commit-sha>
npm run test:run  # Verify 46/46 baseline tests pass
```

**Impact:** 
- Skip behavior reverts to broken (can complete without answering)
- Loses queue-based resume capability
- V2 progress in localStorage ignored, new sessions start fresh

### Option 2: V2→V1 Downgrade (Data Preservation)

If you need to preserve user progress:

```typescript
// Add to useExercise.ts before hydrateProgress()
function downgradeV2toV1(saved: SavedProgressV2, vocabItems: VocabularyItem[]): SavedProgressV1 {
  // Find currentIndex by mapping queue[currentPos] back to vocabItems
  const currentId = saved.queue[saved.currentPos];
  const currentIndex = vocabItems.findIndex(item => item.id === currentId);
  
  return {
    currentIndex: Math.max(0, currentIndex),
    answers: saved.answers,
    savedAt: saved.savedAt,
  };
}
```

Then remove queue logic and revert skip to index increment.

---

## Test Coverage

### New Queue Tests (9)

Located in `src/hooks/useExercise.queue.test.ts`:

1. **Skip rotates to end** - 2 tests
2. **Skip creates no answer** - 1 test
3. **Completion requires all answered** - 2 tests
4. **Resume restores queue state** - 1 test
5. **V1→V2 migration** - 1 test
6. **Queue invariants** - 2 tests

### Updated Baseline Tests (3)

Located in `src/hooks/useExercise.test.ts`:

1. **Skip behavior** - Changed to "does NOT complete"
2. **Persistence format** - Changed to verify V2 schema
3. **Save timing** - Changed from "BUG" to "FIXED"

---

## Breaking Changes

### Public API

**No breaking changes** to hook return shape. Added:

```typescript
interface UseExerciseReturn {
  // ... existing fields
  isHydrated: boolean;  // New: hydration completion signal
}
```

### Behavior Changes

1. **Skip semantics:** Rotates instead of incrementing
2. **Completion:** Requires all answered (skip alone cannot complete)
3. **Persistence timing:** Saves after submit (was: only after continue)

### Data Format

V1 localStorage entries automatically upgraded to V2 on first load.  
**No user action required.**

---

## Verification Checklist

- [x] 55/55 tests passing
- [x] 0 TypeScript errors
- [x] V1→V2 migration tested with fixture
- [x] Queue rotation verified (skip 3x loops back to first item)
- [x] Resume tested (skip + answer + remount)
- [x] Deterministic hydration (no flaky tests)
- [x] Documentation updated (ADR-003, this note, CHANGELOG)

---

## References

- **ADR-003:** `/docs/architecture/adr/ADR-003-exercise-queue-semantics.md`
- **Queue Tests:** `/src/hooks/useExercise.queue.test.ts`
- **Implementation:** `/src/hooks/useExercise.ts`
- **Safe Changes:** `/docs/quality/SAFE_CHANGES.md`
