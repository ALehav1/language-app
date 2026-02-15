import { useEffect, useRef } from 'react';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'default';
    onConfirm: () => void;
    onCancel: () => void;
}

/**
 * ConfirmDialog — styled replacement for native confirm().
 * Centered modal with backdrop, Escape to close, focus trap.
 */
export function ConfirmDialog({
    isOpen,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'default',
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    const dialogRef = useRef<HTMLDivElement>(null);
    const confirmBtnRef = useRef<HTMLButtonElement>(null);

    // Focus the confirm button when dialog opens
    useEffect(() => {
        if (isOpen) {
            confirmBtnRef.current?.focus();
        }
    }, [isOpen]);

    // Close on Escape key
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onCancel();
            }
            // Focus trap: Tab cycles within dialog
            if (e.key === 'Tab' && dialogRef.current) {
                const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
                    'button:not([disabled])'
                );
                const first = focusable[0];
                const last = focusable[focusable.length - 1];

                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault();
                    last?.focus();
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault();
                    first?.focus();
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onCancel]);

    if (!isOpen) return null;

    const isDanger = variant === 'danger';

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-[fadeIn_150ms_ease-out]"
            onClick={onCancel}
            role="presentation"
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

            {/* Dialog */}
            <div
                ref={dialogRef}
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="confirm-dialog-title"
                aria-describedby="confirm-dialog-message"
                className="relative w-full max-w-sm glass-card p-6 space-y-4 animate-[slideUp_150ms_ease-out]"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 id="confirm-dialog-title" className="text-xl font-bold text-white">
                    {title}
                </h3>
                <p id="confirm-dialog-message" className="text-white/70 text-sm">
                    {message}
                </p>

                <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                        ref={confirmBtnRef}
                        onClick={onConfirm}
                        className={`py-3 px-4 font-bold rounded-xl transition-colors text-sm ${
                            isDanger
                                ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300'
                                : 'bg-white text-surface-300 hover:bg-white/90'
                        } sm:order-2`}
                    >
                        {confirmLabel}
                    </button>
                    <button
                        onClick={onCancel}
                        className="py-3 px-4 text-white/70 font-medium hover:text-white transition-colors rounded-xl text-sm sm:order-1"
                    >
                        {cancelLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
