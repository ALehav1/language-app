import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useExercise } from './useExercise';
import type { VocabularyItem } from '../types';
import type { RenderHookResult } from '@testing-library/react';

/**
 * PR-3: Exercise Queue Semantics Tests
 * 
 * These tests define the INTENDED behavior per ADR-003.
 * Implementation follows test-first discipline per SAFE_CHANGES.md
 */

/**
 * C1: Helper to wait for deterministic hydration
 * Waits until hook is fully initialized and ready
 */
async function waitForHydration(result: RenderHookResult<ReturnType<typeof useExercise>, any>['result']) {
  await waitFor(() => {
    // Handle initial null result during React rendering
    if (!result.current) {
      throw new Error('Hook not yet rendered');
    }
    expect(result.current.isHydrated).toBe(true);
    expect(result.current.currentItem).not.toBeNull();
  }, { timeout: 3000 });
}

// Mock OpenAI
vi.mock('../lib/openai', () => ({
  evaluateAnswer: vi.fn().mockResolvedValue({
    isCorrect: true,
    feedback: 'Correct!',
  }),
}));

// Mock transliteration validation
vi.mock('../utils/transliteration', () => ({
  validateTransliteration: vi.fn(() => true),
}));

describe('useExercise - Queue Semantics (PR-3)', () => {
  const mockItems: VocabularyItem[] = [
    {
      id: 'item-a',
      word: 'مرحبا',
      translation: 'hello',
      transliteration: 'marhaba',
      language: 'arabic',
      content_type: 'word',
      mastery_level: 'new',
      times_practiced: 0,
      last_reviewed: null,
      next_review: null,
      created_at: '2026-01-01T00:00:00Z',
    },
    {
      id: 'item-b',
      word: 'شكرا',
      translation: 'thank you',
      transliteration: 'shukran',
      language: 'arabic',
      content_type: 'word',
      mastery_level: 'new',
      times_practiced: 0,
      last_reviewed: null,
      next_review: null,
      created_at: '2026-01-01T00:00:00Z',
    },
    {
      id: 'item-c',
      word: 'نعم',
      translation: 'yes',
      transliteration: 'naam',
      language: 'arabic',
      content_type: 'word',
      mastery_level: 'new',
      times_practiced: 0,
      last_reviewed: null,
      next_review: null,
      created_at: '2026-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('Test 1: Skip rotates item to end of queue', () => {
    it('moves current item to end and advances to next', async () => {
      const { result } = renderHook(() =>
        useExercise({ vocabItems: mockItems, lessonId: 'queue-test-1' })
      );

      await waitForHydration(result);

      // Initial state: queue = [A, B, C], current = A
      expect(result.current.currentItem?.id).toBe('item-a');

      // Skip A → queue becomes [B, C, A], current = B
      act(() => {
        result.current.skipQuestion();
      });

      expect(result.current.currentItem?.id).toBe('item-b');

      // Skip B → queue becomes [C, A, B], current = C
      act(() => {
        result.current.skipQuestion();
      });

      expect(result.current.currentItem?.id).toBe('item-c');

      // After answering C, next should be A (which was skipped first)
      await act(async () => {
        await result.current.submitAnswer('yes');
      });

      await act(async () => {
        result.current.continueToNext();
      });

      // Wait for state update to propagate
      await waitFor(() => {
        expect(result.current.currentItem?.id).toBe('item-a');
      });
    });

    it('preserves original order among unvisited items', async () => {
      const { result } = renderHook(() =>
        useExercise({ vocabItems: mockItems, lessonId: 'queue-test-1b' })
      );

      await waitForHydration(result);

      // Skip first item
      act(() => {
        result.current.skipQuestion();
      });

      // Current should now be item-b (original second position)
      expect(result.current.currentItem?.id).toBe('item-b');

      // Next should be item-c (original third position)
      await act(async () => {
        await result.current.submitAnswer('thank you');
      });

      await act(async () => {
        result.current.continueToNext();
      });

      await waitFor(() => {
        expect(result.current.currentItem?.id).toBe('item-c');
      });
    });
  });

  describe('Test 2: Skip does NOT create an AnswerResult', () => {
    it('answers array remains empty after multiple skips', async () => {
      const { result } = renderHook(() =>
        useExercise({ vocabItems: mockItems, lessonId: 'queue-test-2' })
      );

      await waitForHydration(result);

      expect(result.current.answers).toHaveLength(0);

      // Skip all three items
      act(() => {
        result.current.skipQuestion();
      });

      expect(result.current.answers).toHaveLength(0);

      act(() => {
        result.current.skipQuestion();
      });

      expect(result.current.answers).toHaveLength(0);

      act(() => {
        result.current.skipQuestion();
      });

      expect(result.current.answers).toHaveLength(0);
      expect(result.current.phase).toBe('prompting'); // Still in exercise
    });
  });

  describe('Test 3: Completion requires all items answered', () => {
    it('does NOT complete after skipping all items', async () => {
      const onComplete = vi.fn();
      const { result } = renderHook(() =>
        useExercise({
          vocabItems: mockItems,
          lessonId: 'queue-test-3',
          onComplete,
        })
      );

      await waitForHydration(result);

      // Skip all three items - should cycle back to first
      act(() => {
        result.current.skipQuestion();
        result.current.skipQuestion();
        result.current.skipQuestion();
      });

      expect(result.current.phase).toBe('prompting');
      expect(onComplete).not.toHaveBeenCalled();
    });

    it('completes only after answering all items (even if some were skipped)', async () => {
      const onComplete = vi.fn();
      const { result } = renderHook(() =>
        useExercise({
          vocabItems: mockItems,
          lessonId: 'queue-test-3b',
          onComplete,
        })
      );

      await waitForHydration(result);

      // Skip item A
      act(() => {
        result.current.skipQuestion();
      });

      // Answer item B
      await act(async () => {
        await result.current.submitAnswer('thank you');
      });

      await act(async () => {
        result.current.continueToNext();
      });

      // Answer item C
      await act(async () => {
        await result.current.submitAnswer('yes');
      });

      await act(async () => {
        result.current.continueToNext();
      });

      // Now answer item A (which was skipped)
      await act(async () => {
        await result.current.submitAnswer('hello');
      });

      await act(async () => {
        result.current.continueToNext();
      });

      // Now should be complete
      await waitFor(() => {
        expect(result.current.phase).toBe('complete');
      });

      expect(onComplete).toHaveBeenCalled();
      expect(result.current.answers).toHaveLength(3);
    });
  });

  describe('Test 4: Resume restores exact queue state', () => {
    it('restores queue position and remaining items after skip + answer', async () => {
      const lessonId = 'queue-test-4';

      // First session: skip A, answer B, then close
      const { result: result1, unmount: unmount1 } = renderHook(() =>
        useExercise({ vocabItems: mockItems, lessonId })
      );

      await waitForHydration(result1);

      // Skip A
      act(() => {
        result1.current.skipQuestion();
      });

      // Answer B
      await act(async () => {
        await result1.current.submitAnswer('thank you');
      });

      // Don't continue - just unmount (simulating closing app)
      unmount1();

      // Second session: resume
      const { result: result2 } = renderHook(() =>
        useExercise({ vocabItems: mockItems, lessonId })
      );

      // Should restore to where we left off
      // Since we answered B but didn't call continueToNext(), B is still in queue
      // Queue was saved as [B, C, A], pos=0, so resume shows B
      await waitFor(() => {
        expect(result2.current.currentItem?.id).toBe('item-b');
      });

      expect(result2.current.answers).toHaveLength(1); // B was answered
      expect(result2.current.totalItems).toBe(3);
    });
  });

  describe('Test 5: Backward compatibility (V1 → V2 migration)', () => {
    it('upgrades old saved progress format to queue-based format', async () => {
      const lessonId = 'queue-test-5';

      // Simulate old V1 saved progress (no queue, just currentIndex)
      const oldProgress = {
        currentIndex: 1,
        answers: [
          {
            itemId: 'item-a',
            correct: true,
            userAnswer: 'hello',
            correctAnswer: 'hello',
            feedback: 'Correct!',
          },
        ],
        savedAt: Date.now(),
      };

      localStorage.setItem(
        `exercise-progress-${lessonId}`,
        JSON.stringify(oldProgress)
      );

      // Mount hook - should migrate V1 → V2
      const { result } = renderHook(() =>
        useExercise({ vocabItems: mockItems, lessonId })
      );

      await waitForHydration(result);

      // Verify V1 answers were preserved
      expect(result.current.answers).toHaveLength(1);
      expect(result.current.answers[0].itemId).toBe('item-a');
      
      // Verify V2 format was persisted after migration
      const persisted = JSON.parse(localStorage.getItem(`exercise-progress-${lessonId}`)!);
      expect(persisted.version).toBe(2);
      expect(persisted.queue).toBeDefined();
      expect(Array.isArray(persisted.queue)).toBe(true);
    });
  });

  describe('Test 6: Queue invariants hold', () => {
    it('queue length decreases after answer, cursor position stays', async () => {
      const { result } = renderHook(() =>
        useExercise({ vocabItems: mockItems, lessonId: 'queue-test-6' })
      );

      await waitForHydration(result);

      // Initial: 3 items in queue
      expect(result.current.totalItems).toBe(3);

      // Answer first item
      await act(async () => {
        await result.current.submitAnswer('hello');
      });

      await act(async () => {
        result.current.continueToNext();
      });

      // Queue should now have 2 items (A removed, B & C remain)
      // Current should be item-b (cursor stayed at position 0, but A was removed)
      await waitFor(() => {
        expect(result.current.currentItem?.id).toBe('item-b');
      });
    });

    it('queue length unchanged after skip, cursor advances', async () => {
      const { result } = renderHook(() =>
        useExercise({ vocabItems: mockItems, lessonId: 'queue-test-6b' })
      );

      await waitForHydration(result);

      const initialTotal = result.current.totalItems;

      // Skip
      act(() => {
        result.current.skipQuestion();
      });

      // Total unchanged (item moved to end, not removed)
      expect(result.current.totalItems).toBe(initialTotal);

      // But current item changed (cursor advanced)
      expect(result.current.currentItem?.id).toBe('item-b');
    });
  });
});
