import { LessonCard } from './LessonCard';
import { ActionButtons } from './ActionButtons';
import type { Lesson, CardAction } from '../types/lesson';

interface CardStackProps {
    lessons: Lesson[];
    onAction: (action: CardAction) => void;
    onCreateLesson?: () => void;
}

const MAX_VISIBLE_CARDS = 3;

export function CardStack({ lessons, onAction, onCreateLesson }: CardStackProps) {
    const visibleLessons = lessons.slice(0, MAX_VISIBLE_CARDS);
    const currentLesson = lessons[0];

    if (lessons.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] px-8">
                {/* Empty state - prompt to create */}
                <div className="w-24 h-24 mb-6 rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
                    <svg className="w-12 h-12 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Ready to learn?</h3>
                <p className="text-center text-white/50 mb-8 max-w-xs">
                    Create a lesson on any topic you want to practice.
                </p>
                {onCreateLesson && (
                    <button
                        onClick={onCreateLesson}
                        className="px-8 py-4 btn-primary font-bold rounded-2xl flex items-center gap-3 text-lg"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
