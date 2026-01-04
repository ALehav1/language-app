import { LessonCard } from './LessonCard';
import { ActionButtons } from './ActionButtons';
import type { Lesson, CardAction } from '../types/lesson';

interface CardStackProps {
    lessons: Lesson[];
    onAction: (action: CardAction) => void;
    emptyMessage?: string;
}

const MAX_VISIBLE_CARDS = 3;

export function CardStack({ lessons, onAction, emptyMessage = "No lessons available" }: CardStackProps) {
    const visibleLessons = lessons.slice(0, MAX_VISIBLE_CARDS);
    const currentLesson = lessons[0];

    if (lessons.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-white/50">
                <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-lg">{emptyMessage}</p>
            </div>
        );
    }

    const handleButtonAction = (type: 'dismiss' | 'save' | 'later') => {
        if (currentLesson) {
            onAction({ type, lessonId: currentLesson.id, timestamp: Date.now() });
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Card Stack Area */}
            <div className="relative flex-1 min-h-[320px] pt-4">
                {visibleLessons.map((lesson, index) => (
                    <LessonCard
                        key={lesson.id}
                        lesson={lesson}
                        stackIndex={index}
                        isActive={index === 0}
                        onAction={onAction}
                    />
                ))}
            </div>

            {/* Action Buttons */}
            <ActionButtons
                onDismiss={() => handleButtonAction('dismiss')}
                onLater={() => handleButtonAction('later')}
                onSave={() => handleButtonAction('save')}
                disabled={lessons.length === 0}
            />

            {/* Progress indicator */}
            <div className="text-center text-white/40 text-sm pb-4">
                {lessons.length} lessons remaining
            </div>
        </div>
    );
}
