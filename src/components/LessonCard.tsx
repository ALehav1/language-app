import { useRef, useState, type TouchEvent, type MouseEvent } from 'react';
import { Card } from './Card';
import { SwipeIndicator } from './SwipeIndicator';
import type { Lesson, SwipeDirection, CardAction } from '../types/lesson';
import type { ContentType } from '../types';

const CONTENT_TYPE_LABELS: Record<ContentType, { label: string; icon: string }> = {
    word: { label: 'Words', icon: 'Aa' },
    phrase: { label: 'Phrases', icon: '""' },
    dialog: { label: 'Dialog', icon: '' },
    paragraph: { label: 'Reading', icon: '' },
};

interface LessonCardProps {
    lesson: Lesson;
    stackIndex: number;
    onAction: (action: CardAction) => void;
    isActive: boolean;
}

const SWIPE_THRESHOLD = 100;
const SWIPE_VELOCITY_THRESHOLD = 0.5;

export function LessonCard({ lesson, stackIndex, onAction, isActive }: LessonCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [dragState, setDragState] = useState({
        isDragging: false,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0,
        startTime: 0,
    });

    const deltaX = dragState.currentX - dragState.startX;
    const deltaY = dragState.currentY - dragState.startY;

    // Determine swipe direction based on drag
    const getSwipeDirection = (): SwipeDirection => {
        if (!dragState.isDragging) return 'none';
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            return deltaX < -30 ? 'left' : deltaX > 30 ? 'right' : 'none';
        }
        return deltaY > 30 ? 'down' : 'none';
    };

    const direction = getSwipeDirection();
    const progress = Math.min(Math.abs(deltaX) / SWIPE_THRESHOLD, 1);

    const handleDragStart = (clientX: number, clientY: number) => {
        if (!isActive) return;
        setDragState({
            isDragging: true,
            startX: clientX,
            startY: clientY,
            currentX: clientX,
            currentY: clientY,
            startTime: Date.now(),
        });
    };

    const handleDragMove = (clientX: number, clientY: number) => {
        if (!dragState.isDragging) return;
        setDragState(prev => ({ ...prev, currentX: clientX, currentY: clientY }));
    };

    const handleDragEnd = () => {
        if (!dragState.isDragging) return;

        const velocity = Math.abs(deltaX) / (Date.now() - dragState.startTime);
        const shouldComplete = Math.abs(deltaX) > SWIPE_THRESHOLD || velocity > SWIPE_VELOCITY_THRESHOLD;

        if (shouldComplete && direction !== 'none') {
            const actionType = direction === 'left' ? 'dismiss' : direction === 'right' ? 'save' : 'later';
            onAction({ type: actionType, lessonId: lesson.id, timestamp: Date.now() });
        }

        setDragState({
            isDragging: false,
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0,
            startTime: 0,
        });
    };

    // Touch handlers
    const onTouchStart = (e: TouchEvent) => handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
    const onTouchMove = (e: TouchEvent) => handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
    const onTouchEnd = () => handleDragEnd();

    // Mouse handlers (for desktop)
    const onMouseDown = (e: MouseEvent) => handleDragStart(e.clientX, e.clientY);
    const onMouseMove = (e: MouseEvent) => handleDragMove(e.clientX, e.clientY);
    const onMouseUp = () => handleDragEnd();
    const onMouseLeave = () => dragState.isDragging && handleDragEnd();

    const handleTap = () => {
        if (!dragState.isDragging && Math.abs(deltaX) < 5) {
            onAction({ type: 'start', lessonId: lesson.id, timestamp: Date.now() });
        }
    };

    // Card stacking visual styles
    const stackOffset = stackIndex * 8;
    const stackScale = 1 - stackIndex * 0.05;
    const stackOpacity = 1 - stackIndex * 0.15;

    const transform = dragState.isDragging
        ? `translateX(${deltaX}px) translateY(${Math.max(0, deltaY * 0.3)}px) rotate(${deltaX * 0.05}deg)`
        : `translateY(${stackOffset}px) scale(${stackScale})`;

    const badgeClass = lesson.language === 'arabic' ? 'badge-arabic' : 'badge-spanish';

    return (
        <div
            ref={cardRef}
            className={`absolute inset-x-4 ${isActive ? 'cursor-grab active:cursor-grabbing' : ''}`}
            style={{
                transform,
                opacity: stackOpacity,
                zIndex: 10 - stackIndex,
                transition: dragState.isDragging ? 'none' : 'transform 0.3s var(--transition-smooth)',
            }}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseLeave}
            onClick={handleTap}
        >
            <Card className="min-h-[280px] select-none">
                <SwipeIndicator direction={direction} progress={progress} />

                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${badgeClass}`}>
                            {lesson.language === 'arabic' ? 'العربية' : 'Español'}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white/60">
                            {CONTENT_TYPE_LABELS[lesson.contentType || 'word'].icon} {CONTENT_TYPE_LABELS[lesson.contentType || 'word'].label}
                        </span>
                    </div>
                    <span className="text-white/50 text-sm">
                        {lesson.estimatedMinutes} min
                    </span>
                </div>

                {/* Content */}
                <h2 className="text-2xl font-bold mb-2 text-white">
                    {lesson.title}
                </h2>
                <p className="text-white/70 mb-6 line-clamp-3">
                    {lesson.description}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/10">
                    <div className="flex items-center gap-2">
                        <span className="text-white/50 text-sm">
                            {lesson.vocabCount} {CONTENT_TYPE_LABELS[lesson.contentType || 'word'].label.toLowerCase()}
                        </span>
                        <div className={`px-3 py-1 rounded-full text-xs ${lesson.difficulty === 'new' ? 'bg-emerald-500/20 text-emerald-400' :
                                lesson.difficulty === 'learning' ? 'bg-amber-500/20 text-amber-400' :
                                    lesson.difficulty === 'practiced' ? 'bg-blue-500/20 text-blue-400' :
                                        'bg-purple-500/20 text-purple-400'
                            }`}>
                            {lesson.difficulty}
                        </div>
                    </div>
                    <button
                        className="px-5 py-2 bg-white text-surface-300 rounded-full font-semibold text-sm hover:bg-white/90 transition-all"
                        onClick={(e) => {
                            e.stopPropagation();
                            onAction({ type: 'start', lessonId: lesson.id, timestamp: Date.now() });
                        }}
                    >
                        Start Lesson
                    </button>
                </div>
            </Card>
        </div>
    );
}
