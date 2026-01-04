import { useState, useCallback, useRef, useEffect } from 'react';

interface AnswerInputProps {
    onSubmit: (answer: string) => void;
    disabled?: boolean;
    isLoading?: boolean;
}

/**
 * Text input for submitting translation answers.
 * Handles keyboard submission and provides touch-friendly sizing.
 */
export function AnswerInput({ onSubmit, disabled = false, isLoading = false }: AnswerInputProps) {
    const [value, setValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    // Focus input on mount
    useEffect(() => {
        if (!disabled && !isLoading) {
            inputRef.current?.focus();
        }
    }, [disabled, isLoading]);

    // Clear input when re-enabled (new question)
    useEffect(() => {
        if (!disabled && !isLoading) {
            setValue('');
        }
    }, [disabled, isLoading]);

    const handleSubmit = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            if (value.trim() && !disabled && !isLoading) {
                onSubmit(value);
            }
        },
        [value, disabled, isLoading, onSubmit]
    );

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Enter' && value.trim() && !disabled && !isLoading) {
                onSubmit(value);
            }
        },
        [value, disabled, isLoading, onSubmit]
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={disabled || isLoading}
                placeholder="Type your answer..."
                autoComplete="off"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
                className={`
                    w-full px-4 py-4 text-lg
                    bg-white text-surface-300
                    rounded-xl border-2 border-transparent
                    focus:border-white/30 focus:outline-none
                    placeholder:text-surface-300/50
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-all duration-200
                `}
            />
            <button
                type="submit"
                disabled={disabled || isLoading || !value.trim()}
                className={`
                    w-full touch-btn py-4 text-lg font-semibold
                    bg-white text-surface-300
                    disabled:opacity-50 disabled:cursor-not-allowed
                    rounded-xl flex items-center justify-center gap-2
                `}
            >
                {isLoading ? (
                    <>
                        <svg className="animate-spin h-5 w-5 text-surface-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                        <span>Checking...</span>
                    </>
                ) : (
                    'Check Answer'
                )}
            </button>
        </form>
    );
}
