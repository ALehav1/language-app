import { useState, useCallback, useMemo, useEffect } from 'react';
import type { VocabularyItem, ExercisePhase, AnswerResult } from '../types';
import { evaluateAnswer } from '../lib/openai';
import { validateTransliteration } from '../utils/transliteration';

interface SavedProgress {
    currentIndex: number;
    answers: AnswerResult[];
    savedAt: number;
}

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
}

const PROGRESS_KEY_PREFIX = 'exercise-progress-';

function getProgressKey(lessonId: string): string {
    return `${PROGRESS_KEY_PREFIX}${lessonId}`;
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

function saveProgress(lessonId: string | undefined, currentIndex: number, answers: AnswerResult[]): void {
    if (!lessonId) return;
    const progress: SavedProgress = {
        currentIndex,
        answers,
        savedAt: Date.now(),
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
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<AnswerResult[]>([]);
    const [isValidating, setIsValidating] = useState(false);
    const [hasInitialized, setHasInitialized] = useState(false);

    // Derived state for whether we have saved progress to resume
    const hasSavedProgress = savedProgress !== null && savedProgress.currentIndex > 0;

    // Initialize from saved progress once vocabItems are loaded
    useEffect(() => {
        if (hasInitialized) return;
        if (vocabItems.length === 0) return; // Wait for items to load
        
        if (savedProgress && savedProgress.currentIndex > 0) {
            console.log('[useExercise] Restoring progress:', savedProgress.currentIndex, 'of', vocabItems.length);
            setCurrentIndex(savedProgress.currentIndex);
            setAnswers(savedProgress.answers);
        }
        setHasInitialized(true);
    }, [vocabItems.length, savedProgress, hasInitialized]);

    const currentItem = vocabItems[currentIndex] || null;
    const totalItems = vocabItems.length;

    const lastAnswer = answers.length > 0 ? answers[answers.length - 1] : null;

    const correctCount = useMemo(
        () => answers.filter((a) => a.correct).length,
        [answers]
    );

    // Save progress whenever answers or currentIndex changes
    useEffect(() => {
        if (lessonId && currentIndex > 0 && phase !== 'complete') {
            saveProgress(lessonId, currentIndex, answers);
        }
    }, [lessonId, currentIndex, answers, phase]);

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

        const nextIndex = currentIndex + 1;
        if (nextIndex >= totalItems) {
            setPhase('complete');
            clearSavedProgress(lessonId); // Clear saved progress on completion
            onComplete?.(answers);
        } else {
            setCurrentIndex(nextIndex);
            setPhase('prompting');
        }
    }, [phase, currentIndex, totalItems, answers, onComplete, lessonId]);

    const reset = useCallback(() => {
        setPhase('prompting');
        setCurrentIndex(0);
        setAnswers([]);
    }, []);

    const startFresh = useCallback(() => {
        clearSavedProgress(lessonId);
        setPhase('prompting');
        setCurrentIndex(0);
        setAnswers([]);
    }, [lessonId]);

    const skipQuestion = useCallback(() => {
        if (phase !== 'prompting' || !currentItem) return;

        // Move to next question (skip doesn't record an answer)
        const nextIndex = currentIndex + 1;
        if (nextIndex >= totalItems) {
            // If this was the last question, complete the exercise
            setPhase('complete');
            clearSavedProgress(lessonId);
            onComplete?.(answers);
        } else {
            setCurrentIndex(nextIndex);
            // Save progress after skipping so user can resume
            saveProgress(lessonId, nextIndex, answers);
        }
    }, [phase, currentItem, currentIndex, totalItems, answers, onComplete, lessonId]);

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
        submitAnswer,
        continueToNext,
        reset,
        skipQuestion,
        startFresh,
    };
}
