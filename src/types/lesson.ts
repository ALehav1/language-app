import type { Language, MasteryLevel, ContentType } from './database';

/** Individual lesson card display data */
export interface Lesson {
    id: string;
    title: string;
    description: string;
    language: Language;
    difficulty: MasteryLevel;
    contentType: ContentType;
    estimatedMinutes: number;
    vocabCount: number;
    /** AI-generated lesson content ID (links to lesson_progress) */
    contentId?: string;
    createdAt: string;
}

/** Card status in the deck */
export type CardStatus = 'active' | 'dismissed' | 'saved' | 'later';

/** Card with its current UI state */
export interface LessonCard {
    lesson: Lesson;
    status: CardStatus;
    /** Position in the visible stack (0 = front) */
    stackIndex: number;
}

/** Swipe direction for gestures */
export type SwipeDirection = 'left' | 'right' | 'down' | 'none';

/** Card action triggered by user */
export interface CardAction {
    type: 'dismiss' | 'save' | 'later' | 'start';
    lessonId: string;
    timestamp: number;
}

/** Exercise session phase */
export type ExercisePhase = 'prompting' | 'feedback' | 'complete';

/** Result of a single answer attempt */
export interface AnswerResult {
    itemId: string;
    correct: boolean;
    userAnswer: string;
    correctAnswer: string;
    feedback?: string;
}

/** Exercise session state */
export interface ExerciseState {
    phase: ExercisePhase;
    currentIndex: number;
    answers: AnswerResult[];
}
