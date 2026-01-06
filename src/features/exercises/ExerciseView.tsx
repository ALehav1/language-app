import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useExercise } from '../../hooks/useExercise';
import { useVocabulary } from '../../hooks/useVocabulary';
import { useLessonProgress } from '../../hooks/useLessonProgress';
import { useSavedWords } from '../../hooks/useSavedWords';
import { ExercisePrompt } from './ExercisePrompt';
import { AnswerInput } from './AnswerInput';
import { ExerciseFeedback } from './ExerciseFeedback';

/**
 * Main exercise view container.
 * Manages the full exercise flow from prompting through completion.
 */
export function ExerciseView() {
    const { lessonId } = useParams<{ lessonId: string }>();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [showResumePrompt, setShowResumePrompt] = useState(false);
    const [showExitConfirm, setShowExitConfirm] = useState(false);

    // Check if this is a saved words practice session
    const isSavedPractice = lessonId === 'saved';
    const savedItemIds = useMemo(() => {
        if (!isSavedPractice) return undefined;
        const idsParam = searchParams.get('ids');
        return idsParam ? idsParam.split(',').filter(Boolean) : undefined;
    }, [isSavedPractice, searchParams]);

    const { vocabulary: vocabItems, loading, error } = useVocabulary({
        lessonId: isSavedPractice ? undefined : lessonId,
        itemIds: savedItemIds,
        fromSavedWords: isSavedPractice,  // Fetch from saved_words table for practice
    });
    const { saveProgress, updateVocabularyMastery } = useLessonProgress();
    const { saveWord, saveAsActive, isWordSaved } = useSavedWords();

    const {
        phase,
        currentItem,
        currentIndex,
        totalItems,
        answers,
        lastAnswer,
        correctCount,
        isValidating,
        hasSavedProgress,
        submitAnswer,
        continueToNext,
        skipQuestion,
        startFresh,
    } = useExercise({
        vocabItems,
        lessonId: isSavedPractice ? undefined : lessonId,
        onComplete: async (results) => {
            // Skip saving lesson progress for saved words practice
            if (isSavedPractice) {
                // Still update mastery levels for practiced items
                for (const result of results) {
                    await updateVocabularyMastery(result.itemId, result.correct);
                }
                return;
            }

            // Save progress to Supabase for regular lessons
            if (lessonId && vocabItems.length > 0) {
                await saveProgress({
                    lessonId,
                    language: vocabItems[0].language,
                    answers: results,
                });

                // Update mastery levels for each item AND auto-save to vocabulary
                for (const result of results) {
                    await updateVocabularyMastery(result.itemId, result.correct);
                    
                    // Auto-save Arabic words to saved_words with 'active' status
                    const item = vocabItems.find(v => v.id === result.itemId);
                    if (item && item.language === 'arabic') {
                        await saveWord(
                            {
                                word: item.word,
                                translation: item.translation,
                                pronunciation_standard: item.transliteration,
                                letter_breakdown: item.letter_breakdown || undefined,
                                hebrew_cognate: item.hebrew_cognate || undefined,
                                status: 'active',  // Auto-saved as active (practicing)
                                times_practiced: 1,
                                times_correct: result.correct ? 1 : 0,
                            },
                            {
                                content_type: item.content_type || 'word',
                                full_text: item.word,
                                full_transliteration: item.transliteration,
                                full_translation: item.translation,
                                lesson_id: lessonId,
                                vocabulary_item_id: item.id,
                            }
                        );
                    }
                }
            }
        },
    });

    // Show resume prompt if there's saved progress
    useEffect(() => {
        if (hasSavedProgress && !loading && vocabItems.length > 0) {
            setShowResumePrompt(true);
        }
    }, [hasSavedProgress, loading, vocabItems.length]);

    // Warn user before leaving during an active exercise
    const hasProgress = currentIndex > 0 && phase !== 'complete';
    useEffect(() => {
        if (!hasProgress) return;

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = '';
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasProgress]);

    // Handle back button with confirmation
    const handleBackClick = useCallback(() => {
        if (hasProgress) {
            setShowExitConfirm(true);
        } else {
            navigate(isSavedPractice ? '/saved' : '/');
        }
    }, [hasProgress, navigate, isSavedPractice]);

    const confirmExit = useCallback(() => {
        navigate(isSavedPractice ? '/saved' : '/');
    }, [navigate, isSavedPractice]);

    // Loading state with skeleton
    if (loading) {
        return (
            <div className="min-h-screen flex flex-col bg-surface-300 p-4">
                <header className="flex items-center gap-4 mb-6">
                    <div className="skeleton w-10 h-10 rounded-xl" />
                    <div className="flex-1 flex gap-1">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="skeleton h-2 flex-1 rounded-full" />
                        ))}
                    </div>
                    <div className="skeleton w-12 h-4 rounded" />
                </header>
                <div className="flex-1 flex flex-col items-center justify-center space-y-6 max-w-md mx-auto w-full">
                    <div className="skeleton w-full h-32 rounded-3xl" />
                    <div className="skeleton w-3/4 h-6 rounded-xl" />
                    <div className="skeleton w-full h-14 rounded-xl" />
                    <div className="skeleton w-full h-14 rounded-xl" />
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <div className="glass-card p-8 text-center max-w-sm">
                    <h2 className="text-xl font-bold text-red-400 mb-2">
                        Failed to load exercise
                    </h2>
                    <p className="text-white/60 mb-6">{error}</p>
                    <button
                        onClick={() => navigate('/')}
                        className="touch-btn px-6 py-3 bg-white text-surface-300 rounded-xl font-medium"
                    >
                        Back to Lessons
                    </button>
                </div>
            </div>
        );
    }

    // Handle empty lesson
    if (vocabItems.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <div className="glass-card p-8 text-center max-w-sm">
                    <h2 className="text-xl font-bold text-white mb-2">
                        Lesson not found
                    </h2>
                    <p className="text-white/60 mb-6">
                        This lesson doesn't have any vocabulary yet.
                    </p>
                    <button
                        onClick={() => navigate('/')}
                        className="touch-btn px-6 py-3 bg-white text-surface-300 rounded-xl font-medium"
                    >
                        Back to Lessons
                    </button>
                </div>
            </div>
        );
    }

    // Completion screen
    if (phase === 'complete') {
        const score = Math.round((correctCount / totalItems) * 100);

        return (
            <div className="min-h-screen flex flex-col p-4">
                {/* Header */}
                <header className="py-4">
                    <h1 className="text-xl font-bold text-white text-center">
                        {isSavedPractice ? 'Practice Complete' : 'Lesson Complete'}
                    </h1>
                </header>

                {/* Results */}
                <main className="flex-1 flex flex-col items-center justify-center">
                    <div className="glass-card p-8 text-center max-w-sm w-full">
                        {/* Score circle */}
                        <div
                            className={`
                                w-32 h-32 mx-auto mb-6 rounded-full
                                flex items-center justify-center
                                ${score >= 80 ? 'bg-green-500/20' : score >= 50 ? 'bg-amber-500/20' : 'bg-red-500/20'}
                            `}
                        >
                            <span
                                className={`text-4xl font-bold ${score >= 80
                                    ? 'text-green-400'
                                    : score >= 50
                                        ? 'text-amber-400'
                                        : 'text-red-400'
                                    }`}
                            >
                                {score}%
                            </span>
                        </div>

                        {/* Stats */}
                        <p className="text-white/60 mb-6">
                            You got{' '}
                            <span className="text-white font-semibold">
                                {correctCount}
                            </span>{' '}
                            out of{' '}
                            <span className="text-white font-semibold">
                                {totalItems}
                            </span>{' '}
                            correct
                        </p>

                        {/* Message */}
                        <p className="text-lg text-white mb-8">
                            {score >= 80
                                ? 'Excellent work!'
                                : score >= 50
                                    ? 'Good effort! Keep practicing.'
                                    : 'Keep going, you\'ll get it!'}
                        </p>

                        {/* Done button */}
                        <button
                            onClick={() => navigate(isSavedPractice ? '/saved' : '/')}
                            className="w-full touch-btn py-4 btn-primary rounded-xl font-semibold text-lg"
                        >
                            Done
                        </button>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-surface-300 relative">
            {/* Header with Back button */}
            <header className="flex items-center gap-4 p-4 shrink-0 z-10 bg-surface-300/80 backdrop-blur-sm sticky top-0">
                <button
                    onClick={handleBackClick}
                    className="touch-btn w-10 h-10 bg-white/10 text-white/70 flex items-center justify-center rounded-xl"
                    aria-label="Back to lessons"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                {/* Segmented Progress Bar */}
                <div className="flex-1 flex items-center gap-1">
                    {vocabItems.map((item, idx) => {
                        const answered = answers.find(a => a.itemId === item.id);
                        const isCurrent = idx === currentIndex;

                        let bgColor = 'bg-white/20'; // Future
                        let glowClass = '';
                        if (answered?.correct) {
                            bgColor = 'bg-green-500';
                            glowClass = 'glow-success';
                        } else if (answered && !answered.correct) {
                            bgColor = 'bg-red-500';
                            glowClass = 'glow-error';
                        } else if (isCurrent) {
                            bgColor = 'bg-white';
                        }

                        return (
                            <div
                                key={item.id}
                                className={`
                                    h-2 flex-1 rounded-full transition-all duration-300
                                    ${bgColor} ${glowClass}
                                    ${isCurrent ? 'ring-2 ring-white/50 ring-offset-1 ring-offset-surface-300' : ''}
                                `}
                                title={`${idx + 1}. ${item.word}`}
                            />
                        );
                    })}
                </div>

                {/* Question counter */}
                <div className="text-white/50 text-sm font-medium min-w-[3rem] text-right">
                    {currentIndex + 1}/{totalItems}
                </div>
            </header>


            {/* Exit Confirmation Modal */}
            {showExitConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
                    <div className="w-full max-w-sm bg-surface-300 rounded-2xl p-6 mx-4 space-y-4">
                        <h3 className="text-xl font-bold text-white">Leave Exercise?</h3>
                        <p className="text-white/70">
                            Your progress is saved. You can resume this lesson later.
                        </p>
                        <div className="text-white/50 text-sm">
                            Progress: {currentIndex} of {totalItems} words completed
                        </div>

                        <div className="space-y-3 pt-2">
                            <button
                                onClick={() => setShowExitConfirm(false)}
                                className="w-full py-4 btn-primary font-bold rounded-xl"
                            >
                                Continue Learning
                            </button>
                            <button
                                onClick={confirmExit}
                                className="w-full py-3 text-white/70 font-medium hover:text-white"
                            >
                                Leave & Save Progress
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Resume Prompt */}
            {showResumePrompt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md">
                    <div className="w-full max-w-sm bg-surface-300 rounded-2xl p-6 mx-4 space-y-4">
                        <h3 className="text-xl font-bold text-white">Resume Lesson?</h3>
                        <p className="text-white/70">
                            You have progress saved from before. Would you like to continue where you left off?
                        </p>
                        <div className="text-white/50 text-sm">
                            Progress: {currentIndex} of {totalItems} words completed
                        </div>

                        <div className="space-y-3 pt-2">
                            <button
                                onClick={() => setShowResumePrompt(false)}
                                className="w-full py-4 bg-white text-surface-300 font-bold rounded-xl"
                            >
                                Resume
                            </button>
                            <button
                                onClick={() => {
                                    startFresh();
                                    setShowResumePrompt(false);
                                }}
                                className="w-full py-3 text-white/70 font-medium hover:text-white"
                            >
                                Start Over
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main content - Scrollable */}
            <main className="flex-1 overflow-y-auto px-4 pb-24">
                <div className="max-w-6xl mx-auto pt-4">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Left sidebar - Word list (desktop only) */}
                        <aside className="hidden lg:block lg:col-span-3">
                            <div className="glass-card p-4 sticky top-4">
                                <h3 className="text-white/70 font-semibold mb-3 text-sm">Lesson Progress</h3>
                                <div className="space-y-1.5 max-h-[60vh] overflow-y-auto">
                                    {vocabItems.map((item, idx) => {
                                        const answered = answers.find(a => a.itemId === item.id);
                                        const isCurrent = idx === currentIndex;
                                        return (
                                            <div
                                                key={item.id}
                                                className={`
                                                    px-3 py-2 rounded-lg flex items-center justify-between text-sm
                                                    ${isCurrent ? 'bg-white/20 border border-white/30' : 'bg-white/5'}
                                                `}
                                            >
                                                <span className={`truncate ${isCurrent ? 'text-white font-medium' : 'text-white/60'}`}>
                                                    {item.word}
                                                </span>
                                                <span className="ml-2 shrink-0">
                                                    {answered ? (
                                                        answered.correct ? (
                                                            <span className="text-green-400 text-xs">✓</span>
                                                        ) : (
                                                            <span className="text-red-400 text-xs">✗</span>
                                                        )
                                                    ) : isCurrent ? (
                                                        <span className="w-2 h-2 bg-white rounded-full"></span>
                                                    ) : null}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </aside>

                        {/* Main exercise area */}
                        <div className="lg:col-span-6 space-y-6">
                            {/* Prompt (always visible) */}
                            {currentItem && (
                                <ExercisePrompt
                                    item={currentItem}
                                    questionNumber={currentIndex + 1}
                                    totalQuestions={totalItems}
                                />
                            )}

                            {/* Input or Feedback */}
                            {phase === 'prompting' && (
                                <div className="space-y-3 pb-8">
                                    <AnswerInput
                                        onSubmit={submitAnswer}
                                        disabled={false}
                                        isLoading={isValidating}
                                        requireTransliteration={
                                            currentItem?.language === 'arabic' &&
                                            !!currentItem?.transliteration
                                        }
                                    />
                                    <button
                                        onClick={skipQuestion}
                                        disabled={isValidating}
                                        className="w-full py-3 text-white/50 hover:text-white/70 transition-colors text-sm"
                                    >
                                        Skip this word
                                    </button>
                                </div>
                            )}

                            {phase === 'feedback' && lastAnswer && currentItem && (
                                <ExerciseFeedback
                                    result={lastAnswer}
                                    item={currentItem}
                                    onContinue={continueToNext}
                                    isLastQuestion={currentIndex === totalItems - 1}
                                    onSave={() => saveAsActive(
                                        {
                                            word: currentItem.word,
                                            translation: currentItem.translation,
                                            pronunciation_standard: currentItem.transliteration,
                                            letter_breakdown: currentItem.letter_breakdown || undefined,
                                            hebrew_cognate: currentItem.hebrew_cognate || undefined,
                                        },
                                        {
                                            content_type: currentItem.content_type || 'word',
                                            full_text: currentItem.word,
                                            full_transliteration: currentItem.transliteration,
                                            full_translation: currentItem.translation,
                                            lesson_id: lessonId,
                                            vocabulary_item_id: currentItem.id,
                                        }
                                    )}
                                    isSaved={isWordSaved(currentItem.word)}
                                />
                            )}
                        </div>

                        {/* Right sidebar - Stats & hints (desktop only) */}
                        <aside className="hidden lg:block lg:col-span-3">
                            <div className="glass-card p-4 sticky top-4 space-y-4">
                                <div>
                                    <h3 className="text-white/70 font-semibold mb-2 text-sm">Session Stats</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-white/5 rounded-lg p-3 text-center">
                                            <div className="text-2xl font-bold text-green-400">{correctCount}</div>
                                            <div className="text-white/50 text-xs">Correct</div>
                                        </div>
                                        <div className="bg-white/5 rounded-lg p-3 text-center">
                                            <div className="text-2xl font-bold text-red-400">{answers.length - correctCount}</div>
                                            <div className="text-white/50 text-xs">Incorrect</div>
                                        </div>
                                    </div>
                                </div>

                                {currentItem && (
                                    <div>
                                        <h3 className="text-white/70 font-semibold mb-2 text-sm">Current Word</h3>
                                        <div className="bg-white/5 rounded-lg p-3 space-y-2">
                                            {/* Show the actual Arabic word, not just transliteration */}
                                            <div>
                                                <div className="text-white/40 text-xs">Word</div>
                                                <div className={`text-white text-lg font-semibold ${currentItem.language === 'arabic' ? 'font-arabic' : ''}`} dir={currentItem.language === 'arabic' ? 'rtl' : 'ltr'}>
                                                    {currentItem.word}
                                                </div>
                                            </div>
                                            {currentItem.transliteration && (
                                                <div>
                                                    <div className="text-white/40 text-xs">Pronunciation</div>
                                                    <div className="text-white/60 text-sm">{currentItem.transliteration}</div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="pt-2 border-t border-white/10">
                                    <button
                                        onClick={() => navigate('/saved')}
                                        className="w-full py-2 text-white/50 hover:text-white/70 text-sm flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                        </svg>
                                        Saved Words
                                    </button>
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
            </main>
        </div>
    );
}
