import type { SwipeDirection } from '../types/lesson';

interface SwipeIndicatorProps {
    direction: SwipeDirection;
    progress: number; // 0-1 range
}

const icons = {
    left: '✕',
    right: '♥',
    down: '↻',
    none: '',
};

const labels = {
    left: 'Skip',
    right: 'Save',
    down: 'Later',
    none: '',
};

const colorClasses = {
    left: 'text-dismiss border-dismiss',
    right: 'text-save border-save',
    down: 'text-later border-later',
    none: '',
};

export function SwipeIndicator({ direction, progress }: SwipeIndicatorProps) {
    if (direction === 'none' || progress < 0.1) return null;

    const opacity = Math.min(progress * 2, 1);
    const scale = 0.8 + progress * 0.4;

    return (
        <div
            className={`swipe-overlay ${direction === 'left' ? 'dismiss' : direction === 'right' ? 'save' : 'later'}`}
            style={{ opacity: progress * 0.8 }}
        >
            <div
                className={`flex flex-col items-center gap-2 ${colorClasses[direction]}`}
                style={{
                    opacity,
                    transform: `scale(${scale})`,
                    transition: 'transform 0.1s ease-out'
                }}
            >
                <span className="text-5xl">{icons[direction]}</span>
                <span className="text-lg font-semibold uppercase tracking-wider">
                    {labels[direction]}
                </span>
            </div>
        </div>
    );
}
