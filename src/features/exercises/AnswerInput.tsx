import { useState, useCallback, useRef, useEffect } from 'react';

interface AnswerInputProps {
    onSubmit: (answer: string, transliteration?: string) => void;
    disabled?: boolean;
    isLoading?: boolean;
    requireTransliteration?: boolean;
}

/**
 * Text input for submitting translation answers.
 * Supports dual-input mode for Arabic (transliteration + translation).
 */
export function AnswerInput({
    onSubmit,
    disabled = false,
    isLoading = false,
    requireTransliteration = false
}: AnswerInputProps) {
    const [transliteration, setTransliteration] = useState('');
    const [translation, setTranslation] = useState('');
    const translitInputRef = useRef<HTMLInputElement>(null);
    const translationInputRef = useRef<HTMLInputElement>(null);

    // Focus first input on mount
    useEffect(() => {
        if (!disabled && !isLoading) {
            if (requireTransliteration) {
                translitInputRef.current?.focus();
            } else {
                translationInputRef.current?.focus();
            }
        }
    }, [disabled, isLoading, requireTransliteration]);

    // Clear inputs when re-enabled (new question)
    useEffect(() => {
        if (!disabled && !isLoading) {
            setTransliteration('');
            setTranslation('');
        }
    }, [disabled, isLoading]);

    const canSubmit = requireTransliteration
        ? transliteration.trim() && translation.trim()
        : translation.trim();

    const handleSubmit = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            if (canSubmit && !disabled && !isLoading) {
                if (requireTransliteration) {
                    onSubmit(translation, transliteration);
                } else {
                    onSubmit(translation);
                }
            }
        },
        [canSubmit, disabled, isLoading, onSubmit, requireTransliteration, translation, transliteration]
    );

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Enter' && canSubmit && !disabled && !isLoading) {
                e.preventDefault();
                if (requireTransliteration) {
                    onSubmit(translation, transliteration);
                } else {
                    onSubmit(translation);
                }
            }
        },
        [canSubmit, disabled, isLoading, onSubmit, requireTransliteration, translation, transliteration]
    );

    const inputClassName = `
        w-full px-4 py-4 text-lg
        bg-white text-surface-300
        rounded-xl border-2 border-transparent
        focus:border-white/30 focus:outline-none
        placeholder:text-surface-300/50
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-200
    `;

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            {requireTransliteration && (
                <div>
                    <label className="block text-white/50 text-sm mb-1 px-1">
                        Pronunciation (how it sounds)
                    </label>
                    <input
                        ref={translitInputRef}
                        type="text"
                        value={transliteration}
                        onChange={(e) => setTransliteration(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={disabled || isLoading}
                        placeholder="e.g., marhaba"
                        autoComplete="off"
                        autoCapitalize="off"
                        autoCorrect="off"
                        spellCheck={false}
                        className={inputClassName}
                    />
                </div>
            )}

            <div>
                {requireTransliteration && (
                    <label className="block text-white/50 text-sm mb-1 px-1">
                        English meaning
                    </label>
                )}
                <input
                    ref={translationInputRef}
                    type="text"
                    value={translation}
                    onChange={(e) => setTranslation(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={disabled || isLoading}
                    placeholder={requireTransliteration ? "e.g., hello" : "Type your answer..."}
                    autoComplete="off"
                    autoCapitalize="off"
                    autoCorrect="off"
                    spellCheck={false}
                    className={inputClassName}
                />
            </div>

            <button
                type="submit"
                disabled={disabled || isLoading || !canSubmit}
                className={`
                    w-full touch-btn py-4 text-lg font-semibold
                    rounded-xl flex items-center justify-center gap-2
                    transition-all duration-200
                    ${canSubmit && !disabled && !isLoading
                        ? 'btn-primary'
                        : 'bg-white/20 text-white/40 cursor-not-allowed'
                    }
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
