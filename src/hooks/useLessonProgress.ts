import { useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Language, MasteryLevel } from '../types';
import type { AnswerResult } from '../types/lesson';

interface SaveProgressOptions {
    lessonId: string;
    language: Language;
    answers: AnswerResult[];
}

interface UseLessonProgressReturn {
    saveProgress: (options: SaveProgressOptions) => Promise<void>;
    updateVocabularyMastery: (itemId: string, correct: boolean) => Promise<void>;
}

interface VocabMasteryRow {
    mastery_level: MasteryLevel;
    times_practiced: number;
}

/**
 * Hook for saving lesson progress and updating vocabulary mastery levels.
 */
export function useLessonProgress(): UseLessonProgressReturn {
    const saveProgress = useCallback(async ({ lessonId, language, answers }: SaveProgressOptions) => {
        const correctCount = answers.filter(a => a.correct).length;
        const score = Math.round((correctCount / answers.length) * 100);

        try {
            const { error } = await supabase
                .from('lesson_progress')
                .insert({
                    lesson_id: lessonId,
                    language,
                    score,
                    items_practiced: answers.length,
                });

            if (error) {
                console.error('Error saving progress:', error);
            }
        } catch (err) {
            console.error('Error saving progress:', err);
        }
    }, []);

    const updateVocabularyMastery = useCallback(async (itemId: string, correct: boolean) => {
        try {
            // First get current state
            const { data: current, error: fetchError } = await supabase
                .from('vocabulary_items')
                .select('mastery_level, times_practiced')
                .eq('id', itemId)
                .single<VocabMasteryRow>();

            if (fetchError || !current) {
                console.error('Error fetching vocabulary item:', fetchError);
                return;
            }

            // Calculate new mastery level
            const newTimesPracticed = current.times_practiced + 1;
            let newMasteryLevel: MasteryLevel = current.mastery_level;

            if (correct) {
                // Progress mastery on correct answers
                if (current.mastery_level === 'new' && newTimesPracticed >= 2) {
                    newMasteryLevel = 'learning';
                } else if (current.mastery_level === 'learning' && newTimesPracticed >= 5) {
                    newMasteryLevel = 'practiced';
                } else if (current.mastery_level === 'practiced' && newTimesPracticed >= 10) {
                    newMasteryLevel = 'mastered';
                }
            }

            // Calculate next review time (simple spaced repetition)
            const now = new Date();
            let nextReviewHours = 1; // Default: 1 hour

            switch (newMasteryLevel) {
                case 'new':
                    nextReviewHours = 1;
                    break;
                case 'learning':
                    nextReviewHours = 24;
                    break;
                case 'practiced':
                    nextReviewHours = 72;
                    break;
                case 'mastered':
                    nextReviewHours = 168; // 1 week
                    break;
            }

            const nextReview = new Date(now.getTime() + nextReviewHours * 60 * 60 * 1000);

            // Update the item
            const { error: updateError } = await supabase
                .from('vocabulary_items')
                .update({
                    mastery_level: newMasteryLevel,
                    times_practiced: newTimesPracticed,
                    last_reviewed: now.toISOString(),
                    next_review: nextReview.toISOString(),
                })
                .eq('id', itemId);

            if (updateError) {
                console.error('Error updating vocabulary mastery:', updateError);
            }
        } catch (err) {
            console.error('Error updating vocabulary mastery:', err);
        }
    }, []);

    return { saveProgress, updateVocabularyMastery };
}
