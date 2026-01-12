# ADR-003: Exercise Queue Semantics

**Status:** Accepted (PR-3)  
**Date:** January 11, 2026  
**Deciders:** Development team  
**Related:** ADR-001 (PracticeItem), PR-3 (Queue Implementation)

---

## Context

### The Problem

The current `useExercise` skip behavior is broken:

```typescript
// Current broken implementation
skipQuestion() {
  setCurrentIndex(prev => prev + 1);  // Just increments - doesn't move to end
}
```

**Issues:**
1. Skipping just increments index - item disappears from exercise
2. No way to revisit skipped items
3. Skip on last item completes exercise (incorrect)
4. Resume behavior undefined for skipped items

**Why This Matters for Voice + Spanish:**
- Voice exercises need robust queue operations (retry mispronunciations, revisit difficult items)
- Spanish expansion multiplies exercise volume - proper queue management becomes critical
- Current implementation makes it impossible to "see all items before finishing"

### Current State (PR-2 Baseline)

Tests document the broken behavior:
- `useExercise.test.ts` lines 237-260: Skip completion bug documented
- Index-based navigation works but skip semantics are wrong
- localStorage persistence assumes linear progression

---

## Decision

### Queue-Based Exercise Flow

**Skip rotates current item to end of remaining queue:**

```
Initial queue:  [A, B, C]
Skip A     →    [B, C, A]  (A moves to end)
Skip B     →    [C, A, B]  (B moves to end)
Answer C   →    [A, B]     (C removed, answered)
Answer A   →    [B]        (A removed, answered)
Answer B   →    []         (B removed, exercise complete)
```

**Key Semantics:**

1. **Skip Operation:**
   - Rotates current item to end of remaining queue
   - Does NOT create an AnswerResult
   - Does NOT advance to next item until continue/submit
   - Preserves original order among unvisited items

2. **Completion Condition:**
   - Exercise completes when answers exist for ALL items
   - Skip does not satisfy completion
   - onComplete fires only after last item answered

3. **Resume Behavior:**
   - Persisted queue state: `{ queue: string[], currentPos: number, answers: AnswerResult[] }`
   - Resume restores exact queue position
   - Skipped items remain in queue at their rotated positions

4. **Backward Compatibility:**
   - Old saved progress `{currentIndex, answers}` upgrades deterministically
   - Queue initialized from vocabItems order, cursor set to currentIndex
   - No data loss on resume

---

## Implementation Strategy

### Persistence Shape (Versioned)

```typescript
interface SavedProgressV2 {
  version: 2;
  queue: string[];           // item IDs in current queue order
  currentPos: number;        // cursor into queue (0-based)
  answers: AnswerResult[];   // keyed by item ID
  savedAt: string;           // ISO timestamp
}

interface SavedProgressV1 {
  currentIndex: number;
  answers: AnswerResult[];
  savedAt: string;
}
```

**Migration:** `hydrateProgress(saved: unknown): SavedProgressV2`
- Detect version by presence of `queue` field
- V1 → V2: reconstruct queue from vocabItems, set currentPos = currentIndex

### State Machine

```
[Prompting] 
  ├─ submitAnswer() → [Feedback]
  ├─ skipQuestion() → [Prompting] (same item rotated to end, advance cursor)
  └─ reset() → [Prompting] (fresh queue)

[Feedback]
  ├─ continueToNext() → [Prompting] (next in queue) OR [Complete] (if queue empty)
  └─ reset() → [Prompting] (fresh queue)

[Complete]
  └─ reset() → [Prompting] (fresh queue)
```

### Queue Invariants

1. **Queue contains only unanswered items**
   - Item removed from queue when answer created
   - Skip keeps item in queue

2. **currentPos always valid**
   - `0 <= currentPos < queue.length` OR queue empty
   - After answer: cursor stays at same position (next item shifts into place)
   - After skip: cursor advances by 1 (current item rotated to end)

3. **Deterministic initialization**
   - Queue = vocabItems.map(v => v.id)
   - Answers = []
   - currentPos = 0

---

## Consequences

### Positive

✅ **Skip works correctly** - Items can be deferred and revisited  
✅ **Predictable completion** - Exercise only completes when all items answered  
✅ **Resume works** - Exact queue position restored  
✅ **Voice-ready** - Queue operations support retry/repeat patterns  
✅ **Backward compatible** - Old saved progress upgrades cleanly  

### Negative

⚠️ **Complexity increase** - Queue logic more complex than index-based  
⚠️ **Persistence migration** - Must handle V1 → V2 upgrade  
⚠️ **Testing burden** - More edge cases (skip sequences, resume states)  

### Risks

**Risk:** Queue state corruption if vocabItems change mid-session  
**Mitigation:** Treat vocabItems change as reset event (clear saved progress)

**Risk:** Migration bugs leave users with broken resume  
**Mitigation:** Comprehensive backward compat tests + graceful fallback to fresh start

---

## Alternatives Considered

### 1. Skip Marks Item as "Deferred" (Visited Last)

**Rejected:** Adds complexity without clear benefit. Queue rotation is simpler and gives equivalent UX.

### 2. Skip Decrements Completion Counter

**Rejected:** Allows completing without answering all items. Violates "practice everything" principle.

### 3. Keep Index-Based, Add "Deferred Items" Array

**Rejected:** Dual tracking (index + deferred array) is more complex than single queue.

---

## Test Plan (PR-3)

### Minimum Test Coverage

1. **Skip rotates item to end**
   - Given A,B,C current A → skip → current becomes B, queue = [B,C,A]

2. **Skip doesn't create answer**
   - Skip twice → answers.length === 0

3. **Completion requires all items answered**
   - Skip all items, answer all → phase === 'complete'
   - Skip some, leave others → phase !== 'complete'

4. **Resume restores queue**
   - Start A,B,C → skip A → answer B → persist
   - Remount → queue = [C,A], currentPos = 0

5. **Backward compatibility**
   - Provide V1 saved shape {currentIndex: 1, answers: [...]}
   - Hydrate → queue reconstructed, currentPos = 1

6. **Queue invariants hold**
   - After skip: queue.length unchanged, cursor advances
   - After answer: queue.length decreases, cursor stays

---

## Implementation Notes

### PR-3 Scope

1. Add `SavedProgressV2` type + `hydrateProgress()` migration
2. Refactor `useExercise` state to `{ queue, currentPos, answers }`
3. Implement skip rotation logic
4. Update persistence to save queue state
5. Write tests (6 minimum scenarios above)
6. **No UI changes**

### Out of Scope

- Voice-specific queue operations (PR-5+)
- Multiple queue types (difficulty-based, spaced repetition) (PR-6+)
- Analytics on skip patterns (future)

---

## Validation Criteria

PR-3 is complete when:
- [ ] All 6 minimum tests passing
- [ ] Backward compat test proves V1 → V2 upgrade
- [ ] No regressions in existing useExercise tests
- [ ] Skip moves item to end (verified in test)
- [ ] Completion only after all items answered (verified in test)
- [ ] Resume restores exact queue state (verified in test)
- [ ] TypeScript passes with zero errors
- [ ] Documentation updated (dependency map, CHANGELOG)

---

## References

- PR-1: Baseline tests documenting broken skip behavior
- PR-2: Domain seam established (PracticeItem)
- `useExercise.test.ts` lines 237-260: Current skip bug documented
