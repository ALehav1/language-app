import { useMemo } from 'react';
import type { AnswerResult, VocabularyItem } from '../../types';
import { generateArabicBreakdown } from '../../utils/arabicLetters';

interface ExerciseFeedbackProps {
    result: AnswerResult;
    item: VocabularyItem; // Need the item for details
    onContinue: () => void;
    isLastQuestion: boolean;
    onSave?: () => void;
    isSaved?: boolean;
}

/**
 * Displays feedback after an answer is submitted.
 * Shows detailed breakdown including:
 * - Correct/Incorrect status
 * - Spelling/Pronunciation (Transliteration)
 * - Arabic Letter Breakdown (if available)
 * - Hebrew Cognate (if available)
 */
export function ExerciseFeedback({ result, item, onContinue, isLastQuestion, onSave, isSaved = false }: ExerciseFeedbackProps) {
    const { correct, userAnswer, correctAnswer } = result;
    const isArabic = item.language === 'arabic';

    // Generate letter breakdown on-the-fly if not in database
    const letterBreakdown = useMemo(() => {
        if (item.letter_breakdown && item.letter_breakdown.length > 0) {
            return item.letter_breakdown;
        }
        if (isArabic) {
            return generateArabicBreakdown(item.word);
        }
        return [];
    }, [item.letter_breakdown, item.word, isArabic]);

    return (
        <div className="space-y-6 pb-20">
            {/* Result Header */}
            <div
                className={`
                    glass-card p-6 text-center
                    ${correct ? 'border-green-500/30' : 'border-red-500/30'}
                    border-2
                `}
            >
                <h3
                    className={`text-2xl font-bold mb-2 ${correct ? 'text-green-400' : 'text-red-400'
                        }`}
                >
                    {correct ? 'Correct!' : 'Not quite'}
                </h3>

                {!correct && (
                    <div className="space-y-1 mt-4">
                        <div className="text-white/50 text-sm">Correct answer:</div>
                        <div className="text-xl text-green-400 font-bold">{correctAnswer}</div>
                        <div className="text-white/30 text-xs mt-2">You said: <span className="text-red-400/80">{userAnswer}</span></div>
                    </div>
                )}

                {/* AI Explanation / Feedback */}
                {result.feedback && (
                    <div className="mt-4 p-3 bg-white/10 rounded-lg text-sm text-white/80">
                        {result.feedback}
                    </div>
                )}
            </div>

            {/* Detailed Breakdown Section */}
            <div className="space-y-4">
                <h4 className="text-white/70 font-semibold px-1">Word Details</h4>

                {/* 1. The Word itself with translation */}
                <div className="glass-card p-4">
                    <div className="flex items-center justify-between mb-3">
                        <span className={`text-3xl font-bold text-white ${isArabic ? 'font-arabic' : ''}`} dir={isArabic ? 'rtl' : 'ltr'}>
                            {item.word}
                        </span>
                        <span className="text-white/60 text-lg">{item.translation}</span>
                    </div>
                    {item.transliteration && (
                        <div className="flex items-center gap-2 text-white/50 text-sm">
                            <span className="text-white/30">Pronunciation:</span>
                            <span className="font-medium text-white/70">{item.transliteration}</span>
                        </div>
                    )}
                </div>

                {/* 2. Hebrew Cognate (Arabic only) */}
                {isArabic && (
                    <div className={`glass-card p-4 space-y-2 border-l-4 ${item.hebrew_cognate ? 'border-l-blue-500/50' : 'border-l-white/10'}`}>
                        <div className="flex items-center gap-2 text-blue-300 mb-1">
                            <span className="text-xs font-bold uppercase tracking-wider">Hebrew Connection</span>
                        </div>
                        {item.hebrew_cognate ? (
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="text-2xl font-hebrew text-white mb-1">{item.hebrew_cognate.root}</div>
                                    <div className="text-sm text-white/60">{item.hebrew_cognate.meaning}</div>
                                </div>
                                {item.hebrew_cognate.notes && (
                                    <div className="text-xs text-white/40 max-w-[150px] text-right italic">
                                        "{item.hebrew_cognate.notes}"
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-white/40 text-sm italic">
                                No Hebrew cognate - this word doesn't share a Semitic root with Hebrew
                            </div>
                        )}
                    </div>
                )}

                {/* 3. Arabic Letter Breakdown */}
                {isArabic && letterBreakdown.length > 0 && (
                    <div className="glass-card p-4">
                        <div className="text-teal-400/70 text-xs font-bold uppercase tracking-wider mb-3">Letter Breakdown</div>
                        <div className="space-y-3">
                            {letterBreakdown.map((l, idx) => (
                                <div key={idx} className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0 last:pb-0">
                                    <div className="flex items-center gap-4">
                                        <span className="text-2xl font-arabic text-white w-8 text-center">{l.letter}</span>
                                        <span className="text-white/80">{l.name}</span>
                                    </div>
                                    <span className="text-white/50 font-mono text-sm">/{l.sound}/</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-4">
                {/* Save button */}
                {onSave && (
                    <button
                        onClick={onSave}
                        className={`
                            touch-btn w-14 h-14 rounded-xl
                            flex items-center justify-center
                            transition-all duration-200
                            ${isSaved
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-white/10 text-white/50 hover:text-white hover:bg-white/20'
                            }
                        `}
                        aria-label={isSaved ? 'Saved' : 'Save word'}
                    >
                        <svg className="w-6 h-6" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    </button>
                )}

                {/* Continue button */}
                <button
                    onClick={onContinue}
                    className={`
                        flex-1 touch-btn py-4 text-lg font-semibold
                        rounded-xl transition-all duration-200
                        bg-white text-surface-300 hover:bg-white/90
                    `}
                >
                    {isLastQuestion ? 'See Results' : 'Continue'}
                </button>
            </div>
        </div>
    );
}
