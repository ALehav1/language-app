import { useState, useCallback, useMemo, useEffect } from 'react';
import type { VocabularyItem, ExercisePhase, AnswerResult } from '../types';
import { evaluateAnswer } from '../lib/openai';

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
    /** Submit an answer for the current item */
    submitAnswer: (userAnswer: string) => Promise<void>;
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

    const [phase, setPhase] = useState<ExercisePhase>(() =>
        savedProgress ? 'prompting' : 'prompting'
    );
    const [currentIndex, setCurrentIndex] = useState(() =>
        savedProgress?.currentIndex ?? 0
    );
    const [answers, setAnswers] = useState<AnswerResult[]>(() =>
        savedProgress?.answers ?? []
    );
    const [isValidating, setIsValidating] = useState(false);
    const [hasSavedProgress] = useState(() => savedProgress !== null && savedProgress.currentIndex > 0);

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
        async (userAnswer: string) => {
            if (!currentItem || phase !== 'prompting') return;

            // 1. Optimistic exact match (local check)
            const normalizedUser = userAnswer.trim().toLowerCase();
            const normalizedCorrect = currentItem.translation.trim().toLowerCase();

            if (normalizedUser === normalizedCorrect) {
                const result: AnswerResult = {
                    itemId: currentItem.id,
                    correct: true,
                    userAnswer: userAnswer.trim(),
                    correctAnswer: currentItem.translation,
                };
                setAnswers((prev) => [...prev, result]);
                setPhase('feedback');
                return;
            }

            // 2. Semantic Check (OpenAI)
            setIsValidating(true);
            try {
                const { correct, feedback } = await evaluateAnswer(
                    userAnswer,
                    currentItem.translation,
                    currentItem.language
                );

                const result: AnswerResult = {
                    itemId: currentItem.id,
                    correct,
                    userAnswer: userAnswer.trim(),
                    correctAnswer: currentItem.translation,
                    feedback
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
                    feedback: 'Unable to verify answer.'
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
            onComplete?.(answers);
        } else {
            setCurrentIndex(nextIndex);
        }
    }, [phase, currentItem, currentIndex, totalItems, answers, onComplete]);

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
