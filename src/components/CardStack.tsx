import { LessonCard } from './LessonCard';
import { ActionButtons } from './ActionButtons';
import type { Lesson, CardAction } from '../types/lesson';

interface CardStackProps {
    lessons: Lesson[];
    onAction: (action: CardAction) => void;
    emptyMessage?: string;
    onCreateLesson?: () => void;
}

const MAX_VISIBLE_CARDS = 3;

export function CardStack({ lessons, onAction, emptyMessage = "No lessons available", onCreateLesson }: CardStackProps) {
    const visibleLessons = lessons.slice(0, MAX_VISIBLE_CARDS);
    const currentLesson = lessons[0];

    if (lessons.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-white/50 px-8">
                <p className="text-lg text-center mb-6">{emptyMessage}</p>
                {onCreateLesson && (
                    <button
                        onClick={onCreateLesson}
                        className="px-6 py-3 bg-white text-surface-300 font-semibold rounded-xl hover:bg-white/90 transition-all flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create Lesson
                    </button>
                )}
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

        </div>
    );
}
