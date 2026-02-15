import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCardStack } from './useCardStack';
import type { Lesson } from '../types/lesson';

describe('useCardStack - Baseline Tests (PR 1)', () => {
  const mockLessons: Lesson[] = [
    {
      id: 'lesson-1',
      title: 'Basic Greetings',
      description: 'Learn common greetings',
      language: 'arabic',
      difficulty: 'new',
      contentType: 'word',
      estimatedMinutes: 5,
      vocabCount: 10,
      createdAt: '2026-01-01T00:00:00Z',
    },
    {
      id: 'lesson-2',
      title: 'Numbers',
      description: 'Count in Arabic',
      language: 'arabic',
      difficulty: 'new',
      contentType: 'word',
      estimatedMinutes: 10,
      vocabCount: 15,
      createdAt: '2026-01-02T00:00:00Z',
    },
    {
      id: 'lesson-3',
      title: 'Food',
      description: 'Food vocabulary',
      language: 'arabic',
      difficulty: 'learning',
      contentType: 'word',
      estimatedMinutes: 8,
      vocabCount: 12,
      createdAt: '2026-01-03T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Initialization', () => {
    it('initializes with all lessons as active', () => {
      const { result } = renderHook(() =>
        useCardStack({ initialLessons: mockLessons })
      );

      expect(result.current.activeLessons).toHaveLength(3);
      expect(result.current.savedLessons).toHaveLength(0);
      expect(result.current.totalCards).toBe(3);
      expect(result.current.remainingCards).toBe(3);
    });

    it('restores from localStorage if persistKey provided', () => {
      const savedState = [
        { lesson: mockLessons[0], status: 'active' },
        { lesson: mockLessons[1], status: 'saved' },
        { lesson: mockLessons[2], status: 'dismissed' },
      ];

      localStorage.setItem('test-key', JSON.stringify(savedState));

      const { result } = renderHook(() =>
        useCardStack({
          initialLessons: mockLessons,
          persistKey: 'test-key',
        })
      );

      expect(result.current.activeLessons).toHaveLength(1);
      expect(result.current.savedLessons).toHaveLength(1);
    });
  });

  describe('Card Actions', () => {
    it('dismiss action marks card as dismissed', () => {
      const { result } = renderHook(() =>
        useCardStack({ initialLessons: mockLessons })
      );

      act(() => {
        result.current.handleAction({
          type: 'dismiss',
          lessonId: 'lesson-1',
          timestamp: Date.now(),
        });
      });

      expect(result.current.activeLessons).toHaveLength(2);
      expect(result.current.remainingCards).toBe(2);
    });

    it('save action marks card as saved', () => {
      const { result } = renderHook(() =>
        useCardStack({ initialLessons: mockLessons })
      );

      act(() => {
        result.current.handleAction({
          type: 'save',
          lessonId: 'lesson-1',
          timestamp: Date.now(),
        });
      });

      expect(result.current.savedLessons).toHaveLength(1);
      expect(result.current.activeLessons).toHaveLength(2);
    });

    it('later action moves card to end', () => {
      const { result } = renderHook(() =>
        useCardStack({ initialLessons: mockLessons })
      );

      const firstLesson = result.current.activeLessons[0];

      act(() => {
        result.current.handleAction({
          type: 'later',
          lessonId: firstLesson.id,
          timestamp: Date.now(),
        });
      });

      // Card should still be active
      expect(result.current.activeLessons).toHaveLength(3);
      // But it should be at the end now
      const lessons = result.current.activeLessons;
      expect(lessons[lessons.length - 1].id).toBe(firstLesson.id);
    });

    it('start action does not change state', () => {
      const { result } = renderHook(() =>
        useCardStack({ initialLessons: mockLessons })
      );

      act(() => {
        result.current.handleAction({
          type: 'start',
          lessonId: 'lesson-1',
          timestamp: Date.now(),
        });
      });

      // State unchanged
      expect(result.current.activeLessons).toHaveLength(3);
    });
  });

  describe('Undo Window (5 seconds)', () => {
    it('allows undo immediately after action', () => {
      const { result } = renderHook(() =>
        useCardStack({ initialLessons: mockLessons })
      );

      act(() => {
        result.current.handleAction({
          type: 'dismiss',
          lessonId: 'lesson-1',
          timestamp: Date.now(),
        });
      });

      expect(result.current.canUndo).toBe(true);
      expect(result.current.lastActionType).toBe('dismiss');
      expect(result.current.activeLessons).toHaveLength(2);

      act(() => {
        result.current.undoLastAction();
      });

      expect(result.current.canUndo).toBe(false);
      expect(result.current.activeLessons).toHaveLength(3);
    });

    it('undo expires after 5 seconds', () => {
      const { result } = renderHook(() =>
        useCardStack({ initialLessons: mockLessons })
      );

      act(() => {
        result.current.handleAction({
          type: 'dismiss',
          lessonId: 'lesson-1',
          timestamp: Date.now(),
        });
      });

      expect(result.current.canUndo).toBe(true);

      // Fast-forward 5 seconds
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(result.current.canUndo).toBe(false);
    });

    it('undo does not expire before 5 seconds', () => {
      const { result } = renderHook(() =>
        useCardStack({ initialLessons: mockLessons })
      );

      act(() => {
        result.current.handleAction({
          type: 'dismiss',
          lessonId: 'lesson-1',
          timestamp: Date.now(),
        });
      });

      // Fast-forward 4 seconds
      act(() => {
        vi.advanceTimersByTime(4000);
      });

      expect(result.current.canUndo).toBe(true);

      // Undo still works
      act(() => {
        result.current.undoLastAction();
      });

      expect(result.current.activeLessons).toHaveLength(3);
    });

    it('start action does not create undo state', () => {
      const { result } = renderHook(() =>
        useCardStack({ initialLessons: mockLessons })
      );

      act(() => {
        result.current.handleAction({
          type: 'start',
          lessonId: 'lesson-1',
          timestamp: Date.now(),
        });
      });

      expect(result.current.canUndo).toBe(false);
    });

    it('new action replaces previous undo state', () => {
      const { result } = renderHook(() =>
        useCardStack({ initialLessons: mockLessons })
      );

      act(() => {
        result.current.handleAction({
          type: 'dismiss',
          lessonId: 'lesson-1',
          timestamp: Date.now(),
        });
      });

      expect(result.current.lastActionType).toBe('dismiss');

      act(() => {
        result.current.handleAction({
          type: 'save',
          lessonId: 'lesson-2',
          timestamp: Date.now(),
        });
      });

      expect(result.current.lastActionType).toBe('save');

      // Undo restores to state before 'save', not 'dismiss'
      act(() => {
        result.current.undoLastAction();
      });

      expect(result.current.activeLessons).toHaveLength(2); // lesson-1 still dismissed
      expect(result.current.savedLessons).toHaveLength(0); // lesson-2 save undone
    });
  });

  describe('LocalStorage Persistence', () => {
    it('persists state to localStorage when persistKey provided', () => {
      const { result } = renderHook(() =>
        useCardStack({
          initialLessons: mockLessons,
          persistKey: 'test-persist',
        })
      );

      act(() => {
        result.current.handleAction({
          type: 'dismiss',
          lessonId: 'lesson-1',
          timestamp: Date.now(),
        });
      });

      const saved = localStorage.getItem('test-persist');
      expect(saved).toBeTruthy();
      const parsed = JSON.parse(saved!);
      expect(parsed).toHaveLength(3);
    });

    it('does not persist when no persistKey', () => {
      const { result } = renderHook(() =>
        useCardStack({ initialLessons: mockLessons })
      );

      act(() => {
        result.current.handleAction({
          type: 'dismiss',
          lessonId: 'lesson-1',
          timestamp: Date.now(),
        });
      });

      expect(localStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('Reset Operations', () => {
    it('resetCards restores all to active', () => {
      const { result } = renderHook(() =>
        useCardStack({ initialLessons: mockLessons })
      );

      act(() => {
        result.current.handleAction({ type: 'dismiss', lessonId: 'lesson-1', timestamp: Date.now() });
        result.current.handleAction({ type: 'save', lessonId: 'lesson-2', timestamp: Date.now() });
      });

      expect(result.current.activeLessons).toHaveLength(1);

      act(() => {
        result.current.resetCards();
      });

      expect(result.current.activeLessons).toHaveLength(3);
      expect(result.current.savedLessons).toHaveLength(0);
    });

    it('resetWithLessons preserves existing statuses', () => {
      const { result } = renderHook(() =>
        useCardStack({ initialLessons: mockLessons })
      );

      act(() => {
        result.current.handleAction({ type: 'save', lessonId: 'lesson-1', timestamp: Date.now() });
      });

      const newLessons = [
        mockLessons[0], // Was saved
        mockLessons[2], // Was active
        {
          ...mockLessons[1],
          id: 'lesson-4', // New lesson
          title: 'New Lesson',
        },
      ];

      act(() => {
        result.current.resetWithLessons(newLessons);
      });

      expect(result.current.savedLessons).toHaveLength(1); // lesson-1 still saved
      expect(result.current.activeLessons).toHaveLength(2); // lesson-3 and lesson-4
    });
  });

  describe('Action Callback', () => {
    it('calls onActionComplete callback', () => {
      const onComplete = vi.fn();
      const { result } = renderHook(() =>
        useCardStack({
          initialLessons: mockLessons,
          onActionComplete: onComplete,
        })
      );

      act(() => {
        result.current.handleAction({
          type: 'dismiss',
          lessonId: 'lesson-1',
          timestamp: Date.now(),
        });
      });

      expect(onComplete).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'dismiss',
          lessonId: 'lesson-1',
        })
      );
    });
  });
});
