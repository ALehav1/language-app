import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useExercise } from './useExercise';
import type { VocabularyItem } from '../types';
import * as openai from '../lib/openai';

// Mock OpenAI
vi.mock('../lib/openai', () => ({
  evaluateAnswer: vi.fn(),
}));

// Mock transliteration validation
vi.mock('../utils/transliteration', () => ({
  validateTransliteration: vi.fn(() => true),
}));

describe('useExercise - Baseline Tests (PR 1)', () => {
  const mockItems: VocabularyItem[] = [
    {
      id: '1',
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
      id: '2',
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
      id: '3',
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
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Initialization', () => {
    it('starts in prompting phase with first item', () => {
      const { result } = renderHook(() =>
        useExercise({ vocabItems: mockItems })
      );

      expect(result.current.phase).toBe('prompting');
      expect(result.current.currentItem).toEqual(mockItems[0]);
      expect(result.current.currentIndex).toBe(0);
      expect(result.current.totalItems).toBe(3);
    });

    it('handles empty vocabulary list', () => {
      const { result } = renderHook(() =>
        useExercise({ vocabItems: [] })
      );

      expect(result.current.currentItem).toBeNull();
      expect(result.current.totalItems).toBe(0);
    });

    it('restores from localStorage if within 24 hours', () => {
      const savedProgress = {
        currentIndex: 1,
        answers: [
          {
            itemId: '1',
            correct: true,
            userAnswer: 'hello',
            correctAnswer: 'hello',
          },
        ],
        savedAt: Date.now() - 1000, // 1 second ago
      };

      localStorage.setItem(
        'exercise-progress-lesson-1',
        JSON.stringify(savedProgress)
      );

      const { result } = renderHook(() =>
        useExercise({ vocabItems: mockItems, lessonId: 'lesson-1' })
      );

      // Wait for initialization
      waitFor(() => {
        expect(result.current.currentIndex).toBe(1);
        expect(result.current.answers).toHaveLength(1);
        expect(result.current.hasSavedProgress).toBe(true);
      });
    });

    it('does not restore progress older than 24 hours', () => {
      const savedProgress = {
        currentIndex: 1,
        answers: [],
        savedAt: Date.now() - 25 * 60 * 60 * 1000, // 25 hours ago
      };

      localStorage.setItem(
        'exercise-progress-lesson-1',
        JSON.stringify(savedProgress)
      );

      const { result } = renderHook(() =>
        useExercise({ vocabItems: mockItems, lessonId: 'lesson-1' })
      );

      expect(result.current.currentIndex).toBe(0);
      expect(result.current.hasSavedProgress).toBe(false);
    });
  });

  describe('Exact Match Path (no semantic validation)', () => {
    it('accepts exact match without calling OpenAI', async () => {
      const { result } = renderHook(() =>
        useExercise({ vocabItems: mockItems })
      );

      await act(async () => {
        await result.current.submitAnswer('hello');
      });

      expect(result.current.phase).toBe('feedback');
      expect(result.current.lastAnswer).toMatchObject({
        correct: true,
        userAnswer: 'hello',
        correctAnswer: 'hello',
      });
      expect(openai.evaluateAnswer).not.toHaveBeenCalled();
    });

    it('is case-insensitive', async () => {
      const { result } = renderHook(() =>
        useExercise({ vocabItems: mockItems })
      );

      await act(async () => {
        await result.current.submitAnswer('HELLO');
      });

      expect(result.current.lastAnswer?.correct).toBe(true);
      expect(openai.evaluateAnswer).not.toHaveBeenCalled();
    });
  });

  describe('Semantic Validation Path', () => {
    it('calls OpenAI for non-exact match', async () => {
      vi.mocked(openai.evaluateAnswer).mockResolvedValue({
        correct: true,
        feedback: 'Close enough',
      });

      const { result } = renderHook(() =>
        useExercise({ vocabItems: mockItems })
      );

      await act(async () => {
        await result.current.submitAnswer('hi');
      });

      expect(openai.evaluateAnswer).toHaveBeenCalledWith(
        'hi',
        'hello',
        'arabic'
      );
      expect(result.current.lastAnswer).toMatchObject({
        correct: true,
        userAnswer: 'hi',
        correctAnswer: 'hello',
        feedback: 'Close enough',
      });
    });

    it('handles OpenAI failure gracefully', async () => {
      vi.mocked(openai.evaluateAnswer).mockRejectedValue(
        new Error('API Error')
      );

      const { result } = renderHook(() =>
        useExercise({ vocabItems: mockItems })
      );

      await act(async () => {
        await result.current.submitAnswer('hi');
      });

      expect(result.current.lastAnswer).toMatchObject({
        correct: false,
        feedback: 'Unable to verify answer.',
      });
    });
  });

  describe('Skip Behavior (CURRENT IMPLEMENTATION - ISSUE DOCUMENTED)', () => {
    it('increments index without recording answer', async () => {
      const { result } = renderHook(() =>
        useExercise({ vocabItems: mockItems })
      );

      expect(result.current.currentIndex).toBe(0);

      await act(async () => {
        result.current.skipQuestion();
      });

      // CURRENT BEHAVIOR: Just moves to next (does not move to end)
      expect(result.current.currentIndex).toBe(1);
      expect(result.current.answers).toHaveLength(0);
      expect(result.current.phase).toBe('prompting');
    });

    it('FIXED (PR-3): rotates items when skipping (does NOT complete)', async () => {
      const onComplete = vi.fn();
      const { result} = renderHook(() =>
        useExercise({
          vocabItems: mockItems,
          onComplete,
        })
      );

      // Wait for hydration
      await waitFor(() => {
        expect(result.current.isHydrated).toBe(true);
      });

      // Skip all items - rotates them to end of queue (PR-3 queue semantics)
      await act(async () => {
        result.current.skipQuestion();
      });
      await act(async () => {
        result.current.skipQuestion();
      });
      await act(async () => {
        result.current.skipQuestion();
      });

      // PR-3 BEHAVIOR: Skip rotates to end, does NOT complete
      expect(result.current.phase).toBe('prompting');
      expect(onComplete).not.toHaveBeenCalled();
    });

    it('saves progress after skip (PR-3: V2 format)', async () => {
      const { result } = renderHook(() =>
        useExercise({
          vocabItems: mockItems,
          lessonId: 'lesson-1',
        })
      );

      await waitFor(() => {
        expect(result.current.isHydrated).toBe(true);
      });

      await act(async () => {
        result.current.skipQuestion();
      });

      const saved = localStorage.getItem('exercise-progress-lesson-1');
      expect(saved).toBeTruthy();
      const progress = JSON.parse(saved!);
      // PR-3: V2 format with queue
      expect(progress.version).toBe(2);
      expect(progress.queue).toBeDefined();
      expect(Array.isArray(progress.queue)).toBe(true);
    });
  });

  describe('Continue and Completion', () => {
    it('advances to next item after feedback', async () => {
      const { result } = renderHook(() =>
        useExercise({ vocabItems: mockItems })
      );

      await act(async () => {
        await result.current.submitAnswer('hello');
      });

      expect(result.current.phase).toBe('feedback');

      act(() => {
        result.current.continueToNext();
      });

      expect(result.current.phase).toBe('prompting');
      expect(result.current.currentIndex).toBe(1);
    });

    it('BUG: does NOT auto-complete after last item (stays in feedback)', async () => {
      const onComplete = vi.fn();
      const { result } = renderHook(() =>
        useExercise({
          vocabItems: [mockItems[0]],
          onComplete,
          lessonId: 'lesson-1',
        })
      );

      await act(async () => {
        await result.current.submitAnswer('hello');
      });

      // DOCUMENTS BROKEN BEHAVIOR: should auto-complete but stays in feedback
      expect(result.current.phase).toBe('feedback');
      expect(onComplete).not.toHaveBeenCalled();

      // User must manually call continueToNext to trigger completion
      await act(async () => {
        result.current.continueToNext();
      });

      expect(result.current.phase).toBe('complete');
      expect(onComplete).toHaveBeenCalled();
    });
  });

  describe('Resume Capability', () => {
    it('FIXED (PR-3): saves progress after answers', async () => {
      const { result } = renderHook(() =>
        useExercise({
          vocabItems: mockItems,
          lessonId: 'lesson-1',
        })
      );

      await waitFor(() => {
        expect(result.current.isHydrated).toBe(true);
      });

      await act(async () => {
        await result.current.submitAnswer('hello');
      });

      // PR-3: Progress IS saved after submit (queue-based persistence)
      const saved = localStorage.getItem('exercise-progress-lesson-1');
      expect(saved).toBeTruthy();
      const progress = JSON.parse(saved!);
      expect(progress.version).toBe(2);
      expect(progress.answers).toHaveLength(1);
    });
  });

  describe('Reset Operations', () => {
    it('BUG: index does NOT update after submit (only after continue)', async () => {
      const { result } = renderHook(() =>
        useExercise({ vocabItems: mockItems })
      );

      await act(async () => {
        await result.current.submitAnswer('hello');
      });

      // DOCUMENTS BROKEN BEHAVIOR: index stays at 0 after submit
      expect(result.current.currentIndex).toBe(0);
      expect(result.current.phase).toBe('feedback');

      // Index only updates after continue
      await act(async () => {
        result.current.continueToNext();
      });

      expect(result.current.currentIndex).toBe(1);

      // Reset still works correctly
      act(() => {
        result.current.reset();
      });

      expect(result.current.currentIndex).toBe(0);
      expect(result.current.phase).toBe('prompting');
      expect(result.current.answers).toHaveLength(0);
    });

    it('startFresh() clears saved progress', () => {
      localStorage.setItem('exercise-progress-lesson-1', '{}');

      const { result } = renderHook(() =>
        useExercise({
          vocabItems: mockItems,
          lessonId: 'lesson-1',
        })
      );

      act(() => {
        result.current.startFresh();
      });

      expect(localStorage.getItem('exercise-progress-lesson-1')).toBeNull();
      expect(result.current.currentIndex).toBe(0);
    });
  });

  describe('Navigation', () => {
    it('goToItem() navigates to specific index during prompting', () => {
      const { result } = renderHook(() =>
        useExercise({ vocabItems: mockItems })
      );

      act(() => {
        result.current.goToItem(2);
      });

      expect(result.current.currentIndex).toBe(2);
      expect(result.current.currentItem).toEqual(mockItems[2]);
    });

    it('goToItem() does nothing during feedback phase', async () => {
      const { result } = renderHook(() =>
        useExercise({ vocabItems: mockItems })
      );

      await act(async () => {
        await result.current.submitAnswer('hello');
      });

      expect(result.current.phase).toBe('feedback');

      act(() => {
        result.current.goToItem(2);
      });

      expect(result.current.currentIndex).toBe(0); // Unchanged
    });
  });

  describe('Correctness Tracking', () => {
    it('tracks correct count', async () => {
      const { result } = renderHook(() =>
        useExercise({ vocabItems: mockItems })
      );

      expect(result.current.correctCount).toBe(0);

      await act(async () => {
        await result.current.submitAnswer('hello');
      });

      expect(result.current.correctCount).toBe(1);
    });
  });
});
