import { useState, useCallback, useMemo, useEffect } from 'react';
import type { VocabularyItem, ExercisePhase, AnswerResult } from '../types';
import { evaluateAnswer } from '../lib/openai';
import { validateTransliteration } from '../utils/transliteration';

// V1 persistence format (legacy - index-based)
interface SavedProgressV1 {
    currentIndex: number;
    answers: AnswerResult[];
    savedAt: number;
}

/**
 * V2 persistence format (queue-based) - CANONICAL
 * 
 * This is the stable schema used by PR-3+.
 * All new saves write V2. V1 saves are migrated on load.
 * 
 * Migration contract:
 * - On load: if V2 exists → use directly
 * - On load: if V1 exists → migrate to V2 via hydrateProgress()
 * - On save: always write V2 (after hydration complete)
 */
interface SavedProgressV2 {
    version: 2;
    queue: string[];           // item IDs in current queue order
    currentPos: number;        // cursor into queue (0-based)
    answers: AnswerResult[];   // completed answers
    savedAt: number;           // timestamp (ms since epoch)
    phase?: ExercisePhase;     // current phase (optional for backward compat with pre-PR#36 saves)
}

type SavedProgress = SavedProgressV1 | SavedProgressV2;

interface UseExerciseOptions {
    vocabItems: VocabularyItem[];
    lessonId?: string;
    onComplete?: (results: AnswerResult[]) => void;
}

interface UseExerciseReturn {
    /** Current phase of the exercise */
    phase: ExercisePhase;
    /** Current vocabulary item being tested */
    currentItem: VocabularyItem | null;
    /** Current question index (0-based) */
    currentIndex: number;
    /** Total number of items */
    totalItems: number;
    /** All answer results so far */
    answers: AnswerResult[];
    /** Last answer result (for feedback display) */
    lastAnswer: AnswerResult | null;
    /** Number of correct answers */
    correctCount: number;
    /** Is validation in progress? */
    isValidating: boolean;
    /** Has saved progress that can be resumed */
    hasSavedProgress: boolean;
    /** Has hydration completed? (internal state ready) */
    isHydrated: boolean;
    /** Submit an answer for the current item (with optional transliteration for Arabic) */
    submitAnswer: (userAnswer: string, userTransliteration?: string) => Promise<void>;
    /** Move to the next item after viewing feedback */
    continueToNext: () => void;
    /** Reset the exercise (start fresh) */
    reset: () => void;
    /** Skip current question (move to end of queue) */
    skipQuestion: () => void;
    /** Clear saved progress and start fresh */
    startFresh: () => void;
    /** Navigate to a specific item by index */
    goToItem: (index: number) => void;
}

const PROGRESS_KEY_PREFIX = 'exercise-progress-';

function getProgressKey(lessonId: string): string {
    return `${PROGRESS_KEY_PREFIX}${lessonId}`;
}

function isV2Progress(progress: SavedProgress): progress is SavedProgressV2 {
    return 'version' in progress && progress.version === 2;
}

function loadSavedProgress(lessonId?: string): SavedProgress | null {
    if (!lessonId) return null;
    try {
        const saved = localStorage.getItem(getProgressKey(lessonId));
        if (saved) {
            const progress = JSON.parse(saved) as SavedProgress;
            // Only restore if saved within last 24 hours
            if (Date.now() - progress.savedAt < 24 * 60 * 60 * 1000) {
                return progress;
            }
        }
    } catch {
        // Ignore parse errors
    }
    return null;
}

/**
 * Migrate V1 progress to V2 queue-based format.
 * Reconstructs queue from vocabItems, excluding answered items.
 */
function hydrateProgress(
    saved: SavedProgress | null,
    vocabItems: VocabularyItem[]
): SavedProgressV2 | null {
    if (!saved) return null;

    // Already V2 - return as-is
    if (isV2Progress(saved)) {
        return saved;
    }

    // Migrate V1 → V2
    // V1 stored absolute index into original vocabItems array
    // V2 uses queue (unanswered items only) + position into queue
    
    // Build queue: items from currentIndex forward, excluding answered
    const answeredIds = new Set(saved.answers.map(a => a.itemId));
    const queue = vocabItems
        .slice(saved.currentIndex)  // Start from where V1 left off
        .filter(item => !answeredIds.has(item.id))
        .map(item => item.id);

    // After migration, always start at position 0 of reconstructed queue
    return {
        version: 2,
        queue,
        currentPos: 0,
        answers: saved.answers,
        savedAt: saved.savedAt,
    };
}

function saveProgress(
    lessonId: string | undefined,
    queue: string[],
    currentPos: number,
    answers: AnswerResult[],
    phase: ExercisePhase
): void {
    if (!lessonId) return;
    const progress: SavedProgressV2 = {
        version: 2,
        queue,
        currentPos,
        answers,
        savedAt: Date.now(),
        phase,
    };
    localStorage.setItem(getProgressKey(lessonId), JSON.stringify(progress));
}

function clearSavedProgress(lessonId?: string): void {
    if (!lessonId) return;
    localStorage.removeItem(getProgressKey(lessonId));
}

/**
 * Hook for managing exercise session state.
 * Handles answer submission, validation (semantic), and progress tracking.
 * Automatically saves progress to localStorage for resume capability.
 */
export function useExercise({ vocabItems, lessonId, onComplete }: UseExerciseOptions): UseExerciseReturn {
    // Check for saved progress on mount
    const savedProgress = useMemo(() => loadSavedProgress(lessonId), [lessonId]);

    const [phase, setPhase] = useState<ExercisePhase>('prompting');
    const [queue, setQueue] = useState<string[]>([]);  // Item IDs in queue order
    const [currentPos, setCurrentPos] = useState(0);   // Cursor into queue
    const [answers, setAnswers] = useState<AnswerResult[]>([]);
    const [isValidating, setIsValidating] = useState(false);
    const [isHydrated, setIsHydrated] = useState(false);

    // Derived state for whether we have saved progress to resume
    const hasSavedProgress = savedProgress !== null && (
        isV2Progress(savedProgress) ? savedProgress.currentPos > 0 : savedProgress.currentIndex > 0
    );

    // Initialize from saved progress once vocabItems are loaded (idempotent)
    useEffect(() => {
        if (isHydrated) return; // Already hydrated - do not reinitialize
        if (vocabItems.length === 0) return; // Wait for items to load
        
        const hydratedProgress = hydrateProgress(savedProgress, vocabItems);
        
        if (hydratedProgress) {
            setQueue(hydratedProgress.queue);
            setCurrentPos(hydratedProgress.currentPos);
            setAnswers(hydratedProgress.answers);
            setPhase(hydratedProgress.phase || 'prompting');
        } else {
            // Fresh start - initialize queue with all item IDs
            setQueue(vocabItems.map(item => item.id));
            setCurrentPos(0);
        }
        
        // Signal hydration complete
        setIsHydrated(true);
    }, [vocabItems.length, savedProgress, isHydrated]);

    // Current item from queue
    const currentItemId = queue[currentPos];
    const currentItem = currentItemId
        ? vocabItems.find(item => item.id === currentItemId) || null
        : null;
    
    // Current index for backward compatibility (derived from queue position)
    const currentIndex = currentItem
        ? vocabItems.findIndex(item => item.id === currentItem.id)
        : 0;
    
    const totalItems = vocabItems.length;

    const lastAnswer = answers.length > 0 ? answers[answers.length - 1] : null;

    const correctCount = useMemo(
        () => answers.filter((a) => a.correct).length,
        [answers]
    );

    // Save progress whenever queue/answers change (A3: only after hydration)
    useEffect(() => {
        if (!isHydrated) return; // Don't persist until hydration complete
        if (!lessonId) return;
        if (phase === 'complete') return;
        if (queue.length === 0) return;
        
        // Only persist if we have meaningful progress
        if (currentPos > 0 || answers.length > 0) {
            saveProgress(lessonId, queue, currentPos, answers, phase);
        }
    }, [lessonId, queue, currentPos, answers, phase, isHydrated]);

    const submitAnswer = useCallback(
        async (userAnswer: string, userTransliteration?: string) => {
            if (!currentItem || phase !== 'prompting') return;

            // Check if this is Arabic dual-input mode
            const isDualInput = userTransliteration && currentItem.transliteration;

            // 1. Validate transliteration (if provided)
            let transliterationCorrect: boolean | undefined;
            if (isDualInput) {
                transliterationCorrect = validateTransliteration(
                    userTransliteration,
                    currentItem.transliteration!
                );
            }

            // 2. Check translation - optimistic exact match first
            const normalizedUser = userAnswer.trim().toLowerCase();
            const normalizedCorrect = currentItem.translation.trim().toLowerCase();

            if (normalizedUser === normalizedCorrect) {
                // Both must be correct for overall correct (if dual input)
                const overallCorrect = isDualInput ? transliterationCorrect === true : true;

                const result: AnswerResult = {
                    itemId: currentItem.id,
                    correct: overallCorrect,
                    userAnswer: userAnswer.trim(),
                    correctAnswer: currentItem.translation,
                    // Include transliteration fields if dual input
                    ...(isDualInput && {
                        userTransliteration: userTransliteration.trim(),
                        correctTransliteration: currentItem.transliteration,
                        transliterationCorrect,
                    }),
                };
                setAnswers((prev) => [...prev, result]);
                setPhase('feedback');
                return;
            }

            // 3. Semantic Check (OpenAI) for translation
            setIsValidating(true);
            try {
                const { correct: translationCorrect, feedback } = await evaluateAnswer(
                    userAnswer,
                    currentItem.translation,
                    currentItem.language
                );

                // Both must be correct for overall correct (if dual input)
                const overallCorrect = isDualInput
                    ? translationCorrect && transliterationCorrect === true
                    : translationCorrect;

                const result: AnswerResult = {
                    itemId: currentItem.id,
                    correct: overallCorrect,
                    userAnswer: userAnswer.trim(),
                    correctAnswer: currentItem.translation,
                    feedback,
                    // Include transliteration fields if dual input
                    ...(isDualInput && {
                        userTransliteration: userTransliteration.trim(),
                        correctTransliteration: currentItem.transliteration,
                        transliterationCorrect,
                    }),
                };

                setAnswers((prev) => [...prev, result]);
                setPhase('feedback');
            } catch (error) {
                console.error('Validation error:', error);
                // Fallback to incorrect if API fails
                const result: AnswerResult = {
                    itemId: currentItem.id,
                    correct: false,
                    userAnswer: userAnswer.trim(),
                    correctAnswer: currentItem.translation,
                    feedback: 'Unable to verify answer.',
                    // Include transliteration fields if dual input
                    ...(isDualInput && {
                        userTransliteration: userTransliteration.trim(),
                        correctTransliteration: currentItem.transliteration,
                        transliterationCorrect,
                    }),
                };
                setAnswers((prev) => [...prev, result]);
                setPhase('feedback');
            } finally {
                setIsValidating(false);
            }
        },
        [currentItem, phase]
    );

    const continueToNext = useCallback(() => {
        if (phase !== 'feedback') return;

        // Remove answered item from queue (it's been answered, no longer in rotation)
        const newQueue = queue.filter((_, idx) => idx !== currentPos);
        
        if (newQueue.length === 0) {
            // All items answered - complete
            setPhase('complete');
            clearSavedProgress(lessonId);
            onComplete?.(answers);
        } else {
            // Stay at same position (next item shifts into current position)
            setQueue(newQueue);
            // If we were at the end, wrap to start
            const nextPos = currentPos >= newQueue.length ? 0 : currentPos;
            setCurrentPos(nextPos);
            setPhase('prompting');
        }
    }, [phase, queue, currentPos, answers, onComplete, lessonId]);

    const reset = useCallback(() => {
        setPhase('prompting');
        setQueue(vocabItems.map(item => item.id));
        setCurrentPos(0);
        setAnswers([]);
    }, [vocabItems]);

    const startFresh = useCallback(() => {
        clearSavedProgress(lessonId);
        setPhase('prompting');
        setQueue(vocabItems.map(item => item.id));
        setCurrentPos(0);
        setAnswers([]);
    }, [lessonId, vocabItems]);

    const skipQuestion = useCallback(() => {
        if (phase !== 'prompting' || !currentItem || queue.length === 0) return;

        // Rotate current item to end of queue
        const currentItemId = queue[currentPos];
        const newQueue = [
            ...queue.slice(0, currentPos),
            ...queue.slice(currentPos + 1),
            currentItemId,  // Move to end
        ];
        
        setQueue(newQueue);
        // Cursor stays at same position (next item shifts into place)
        // If we were at the end, cursor now points to the item we just moved
        const nextPos = currentPos >= newQueue.length - 1 ? 0 : currentPos;
        setCurrentPos(nextPos);
        
        // Save progress after skipping
        saveProgress(lessonId, newQueue, nextPos, answers, 'prompting');
    }, [phase, currentItem, queue, currentPos, answers, lessonId]);

    // Navigate to a specific item (only allowed during prompting phase)
    // Maps vocabItems index to queue position
    const goToItem = useCallback((index: number) => {
        if (phase !== 'prompting') return;
        if (index < 0 || index >= vocabItems.length) return;
        
        const itemId = vocabItems[index].id;
        const queuePos = queue.findIndex(id => id === itemId);
        
        if (queuePos !== -1) {
            setCurrentPos(queuePos);
        }
    }, [phase, vocabItems, queue]);

    return {
        phase,
        currentItem,
        currentIndex,
        totalItems,
        answers,
        lastAnswer,
        correctCount,
        isValidating,
        hasSavedProgress,
        isHydrated,
        submitAnswer,
        continueToNext,
        reset,
        skipQuestion,
        startFresh,
        goToItem,
    };
}
