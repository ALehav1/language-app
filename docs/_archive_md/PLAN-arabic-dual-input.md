# Feature: Arabic Transliteration + Translation Input

**Status:** COMPLETE
**Created:** January 4, 2026
**Implemented:** January 4, 2026
**Deployed:** January 4, 2026

---

## Goal

For Arabic exercises, users must provide both:
1. **Transliteration** - Type the Arabic word in English letters (e.g., "marhaba")
2. **Translation** - Type the English meaning (e.g., "hello")

This applies to words, phrases, and sentences - but ONLY for Arabic (not Spanish).

---

## Current Flow

```
Arabic word (مرحبا) → User types English translation (hello) → Check/Feedback
```

## New Flow

```
Arabic word (مرحبا) → User types transliteration (marhaba)
                    → User types translation (hello)
                    → Check both → Feedback (shows both results)
```

---

## Proposed Changes

### 1. [MODIFY] `src/types/lesson.ts` - AnswerResult

**Current (lines 43-49):**
```typescript
export interface AnswerResult {
    itemId: string;
    correct: boolean;
    userAnswer: string;
    correctAnswer: string;
    feedback?: string;
}
```

**New:**
```typescript
export interface AnswerResult {
    itemId: string;
    correct: boolean;
    userAnswer: string;
    correctAnswer: string;
    feedback?: string;
    // NEW: For Arabic dual-input mode
    userTransliteration?: string;
    correctTransliteration?: string;  // From item.transliteration
    transliterationCorrect?: boolean;
}
```

---

### 2. [MODIFY] `src/features/exercises/AnswerInput.tsx`

**Current props:**
```typescript
interface AnswerInputProps {
    onSubmit: (answer: string) => void;
    disabled?: boolean;
    isLoading?: boolean;
}
```

**New props:**
```typescript
interface AnswerInputProps {
    onSubmit: (answer: string, transliteration?: string) => void;
    disabled?: boolean;
    isLoading?: boolean;
    requireTransliteration?: boolean;  // NEW: Arabic mode
}
```

**Behavior when `requireTransliteration=true`:**
- Show TWO input fields stacked vertically
- First: "Type pronunciation..." (transliteration)
- Second: "Type English meaning..." (translation)
- Both must be filled before submit enabled
- Single "Check Answer" button submits both

---

### 3. [MODIFY] `src/hooks/useExercise.ts`

**Current signature (line 37):**
```typescript
submitAnswer: (userAnswer: string) => Promise<void>;
```

**New signature:**
```typescript
submitAnswer: (userAnswer: string, userTransliteration?: string) => Promise<void>;
```

**Validation logic:**
```typescript
// For Arabic with transliteration:
if (userTransliteration && currentItem.transliteration) {
    const translitCorrect = validateTransliteration(
        userTransliteration,
        currentItem.transliteration
    );
    // Check translation (existing logic)
    const translationCorrect = /* existing semantic check */;

    // BOTH must be correct for overall correct
    const correct = translitCorrect && translationCorrect;
}
```

---

### 4. [MODIFY] `src/features/exercises/ExerciseView.tsx`

Pass dual-input flag to AnswerInput:
```typescript
<AnswerInput
    onSubmit={submitAnswer}
    disabled={phase !== 'prompting'}
    isLoading={isValidating}
    requireTransliteration={
        currentItem?.language === 'arabic' &&
        !!currentItem?.transliteration  // Only if transliteration exists
    }
/>
```

---

### 5. [MODIFY] `src/features/exercises/ExerciseFeedback.tsx`

**Current (lines 82-87)** shows pronunciation in "Word Details":
```tsx
{item.transliteration && (
    <div className="flex items-center gap-2 text-white/50 text-sm">
        <span className="text-white/30">Pronunciation:</span>
        <span className="font-medium text-white/70">{item.transliteration}</span>
    </div>
)}
```

**New:** Add dual result feedback in Result Header section:
```tsx
{/* Show transliteration result if it was required */}
{result.userTransliteration && (
    <div className="space-y-2 mt-4">
        <div className={`flex items-center gap-2 ${result.transliterationCorrect ? 'text-green-400' : 'text-red-400'}`}>
            <span>{result.transliterationCorrect ? '✓' : '✗'}</span>
            <span>Pronunciation: {result.userTransliteration}</span>
            {!result.transliterationCorrect && (
                <span className="text-white/50">(expected: {result.correctTransliteration})</span>
            )}
        </div>
        <div className={`flex items-center gap-2 ${result.correct && result.transliterationCorrect ? 'text-green-400' : 'text-red-400'}`}>
            <span>{/* translation check */}</span>
            <span>Translation: {result.userAnswer}</span>
        </div>
    </div>
)}
```

---

## Transliteration Validation Rules

```typescript
function validateTransliteration(user: string, correct: string): boolean {
    // Normalize both
    const normalizeTranslit = (s: string) => s
        .toLowerCase()
        .trim()
        .replace(/['`ʼ]/g, "'")  // Normalize apostrophes
        .replace(/aa/g, "a")     // Common variations
        .replace(/ee/g, "i")
        .replace(/oo/g, "u");

    const userNorm = normalizeTranslit(user);
    const correctNorm = normalizeTranslit(correct);

    // Exact match after normalization
    if (userNorm === correctNorm) return true;

    // Allow 1-2 character typos (Levenshtein distance)
    if (levenshteinDistance(userNorm, correctNorm) <= 2) return true;

    return false;
}
```

---

## UI Design

```
┌─────────────────────────────────────────┐
│                  مرحبا                  │
│              (Arabic word)              │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ Type pronunciation...           │    │  ← Input 1 (transliteration)
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ Type English meaning...         │    │  ← Input 2 (translation)
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │          Check Answer           │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

---

## Decisions Made

| Question | Decision | Rationale |
|----------|----------|-----------|
| Partial credit? | **No** - both must be correct | Keeps scoring simple; show individual feedback instead |
| Input order? | **Transliteration first** | Matches learning flow: "how to say it" → "what it means" |
| Hint during prompt? | **No** | Defeats the purpose; could add hint after wrong attempt (P2) |
| What if no transliteration in DB? | **Skip dual mode** | Use single-input (translation only) as fallback |

---

## Edge Cases

1. **Null transliteration**: Some Arabic items might not have `transliteration` in DB
   - Solution: Check `!!currentItem?.transliteration` before enabling dual mode

2. **SavedProgress format change**: localStorage stores `AnswerResult[]`
   - Solution: Clear old progress OR handle missing fields gracefully

3. **Phrases/sentences**: Longer transliterations are harder to type
   - Solution: Be more lenient with typos (Levenshtein distance 3+ for longer strings)

---

## Task Breakdown

```
[x] 1. Update AnswerResult type with transliteration fields
[x] 2. Add validateTransliteration() utility function
[x] 3. Modify AnswerInput.tsx for dual input mode
[x] 4. Update useExercise.submitAnswer to accept & validate transliteration
[x] 5. Update ExerciseView to pass requireTransliteration prop
[x] 6. Modify ExerciseFeedback to show dual results
[x] 7. Handle null transliteration fallback (skips dual mode if no transliteration)
[x] 8. Test with existing Arabic lessons (manual testing)
[x] 9. Clear/handle old localStorage progress format (handled gracefully - old format still works)
```

---

## Files Modified

| File | Change | Status |
|------|--------|--------|
| `src/types/lesson.ts` | Add transliteration fields to AnswerResult | Done |
| `src/features/exercises/AnswerInput.tsx` | Dual input mode | Done |
| `src/hooks/useExercise.ts` | Accept & validate transliteration | Done |
| `src/features/exercises/ExerciseView.tsx` | Pass requireTransliteration prop | Done |
| `src/features/exercises/ExerciseFeedback.tsx` | Show dual results | Done |
| `src/utils/transliteration.ts` | validateTransliteration function (NEW) | Done |

---

## Out of Scope (P2)

- Hint after wrong attempt
- Audio pronunciation playback
- Speech-to-text input for transliteration
- Partial credit scoring
