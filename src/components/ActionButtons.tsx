interface ActionButtonsProps {
    onDismiss: () => void;
    onLater: () => void;
    onSave: () => void;
    disabled?: boolean;
}

export function ActionButtons({ onDismiss, onLater, onSave, disabled }: ActionButtonsProps) {
    return (
        <div className="flex items-center justify-center gap-4 py-4">
            {/* Skip - removes lesson from feed */}
            <button
                onClick={onDismiss}
                disabled={disabled}
                className="flex flex-col items-center gap-1 touch-btn px-4 py-2 bg-dismiss/10 text-dismiss/80 hover:bg-dismiss/20 rounded-xl disabled:opacity-50"
                aria-label="Skip this lesson"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="text-xs font-medium">Skip</span>
            </button>

            {/* Later - moves to end of queue */}
            <button
                onClick={onLater}
                disabled={disabled}
                className="flex flex-col items-center gap-1 touch-btn px-4 py-2 bg-later/10 text-later/80 hover:bg-later/20 rounded-xl disabled:opacity-50"
                aria-label="Review later"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="text-xs font-medium">Later</span>
            </button>

            {/* Save - bookmarks lesson for later */}
            <button
                onClick={onSave}
                disabled={disabled}
                className="flex flex-col items-center gap-1 touch-btn px-4 py-2 bg-save/10 text-save/80 hover:bg-save/20 rounded-xl disabled:opacity-50"
                aria-label="Save this lesson"
            >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
                <span className="text-xs font-medium">Save</span>
            </button>
        </div>
    );
}
