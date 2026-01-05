import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useExercise } from '../../hooks/useExercise';
import { useVocabulary } from '../../hooks/useVocabulary';
import { useLessonProgress } from '../../hooks/useLessonProgress';
import { useSavedVocabulary } from '../../hooks/useSavedVocabulary';
import { ExercisePrompt } from './ExercisePrompt';
import { AnswerInput } from './AnswerInput';
import { ExerciseFeedback } from './ExerciseFeedback';

/**
 * Main exercise view container.
 * Manages the full exercise flow from prompting through completion.
 */
export function ExerciseView() {
    const { lessonId } = useParams<{ lessonId: string }>();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showResumePrompt, setShowResumePrompt] = useState(false);

    const { vocabulary: vocabItems, loading, error } = useVocabulary({ lessonId: lessonId || '' });
    const { saveProgress, updateVocabularyMastery } = useLessonProgress();
    const { saveItem, isItemSaved } = useSavedVocabulary();

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
        lessonId,
        onComplete: async (results) => {
            // Save progress to Supabase
            if (lessonId && vocabItems.length > 0) {
                await saveProgress({
                    lessonId,
                    language: vocabItems[0].language,
                    answers: results,
                });

                // Update mastery levels for each item
                for (const result of results) {
                    await updateVocabularyMastery(result.itemId, result.correct);
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

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <div className="text-white/50">Loading exercise...</div>
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
                        Lesson Complete
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
                            onClick={() => navigate('/')}
                            className="w-full touch-btn py-4 bg-white text-surface-300 rounded-xl font-semibold text-lg"
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
            {/* Header with Menu button */}
            <header className="flex items-center gap-4 p-4 shrink-0 z-10 bg-surface-300/80 backdrop-blur-sm sticky top-0">
                <button
                    onClick={() => setIsMenuOpen(true)}
                    className="touch-btn w-10 h-10 bg-white/10 text-white/70 flex items-center justify-center rounded-xl"
                    aria-label="Open menu"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>

                {/* Segmented Progress Bar */}
                <div className="flex-1 flex items-center gap-1">
                    {vocabItems.map((item, idx) => {
                        const answered = answers.find(a => a.itemId === item.id);
                        const isCurrent = idx === currentIndex;

                        let bgColor = 'bg-white/20'; // Future
                        if (answered?.correct) bgColor = 'bg-green-500';
                        else if (answered && !answered.correct) bgColor = 'bg-red-500';
                        else if (isCurrent) bgColor = 'bg-white';

                        return (
                            <div
                                key={item.id}
                                className={`
                                    h-2 flex-1 rounded-full transition-all duration-300
                                    ${bgColor}
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

            {/* Menu Overlay */}
            {isMenuOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="w-full max-w-sm bg-surface-300 sm:rounded-2xl rounded-t-2xl p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                        {/* Close button */}
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xl font-bold text-white">Lesson Progress</h3>
                            <button
                                onClick={() => setIsMenuOpen(false)}
                                className="w-8 h-8 text-white/50 hover:text-white"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Progress summary */}
                        <div className="glass-card p-4">
                            <div className="text-white/50 text-sm mb-2">Progress</div>
                            <div className="text-2xl font-bold text-white">
                                {currentIndex + 1} of {totalItems}
                            </div>
                            <div className="h-2 bg-white/10 rounded-full mt-2 overflow-hidden">
                                <div
                                    className="h-full bg-green-500 transition-all"
                                    style={{ width: `${((currentIndex + 1) / totalItems) * 100}%` }}
                                />
                            </div>
                        </div>

                        {/* Word list */}
                        <div className="space-y-2">
                            <div className="text-white/50 text-sm px-1">Words in this lesson</div>
                            {vocabItems.map((item, idx) => {
                                const answered = answers.find(a => a.itemId === item.id);
                                const isCurrent = idx === currentIndex;
                                return (
                                    <div
                                        key={item.id}
                                        className={`
                                            p-3 rounded-xl flex items-center justify-between
                                            ${isCurrent ? 'bg-white/20 border border-white/30' : 'bg-white/5'}
                                        `}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg">{item.word}</span>
                                            {item.transliteration && (
                                                <span className="text-white/40 text-sm">{item.transliteration}</span>
                                            )}
                                        </div>
                                        <div>
                                            {answered ? (
                                                answered.correct ? (
                                                    <span className="text-green-400">✓</span>
                                                ) : (
                                                    <span className="text-red-400">✗</span>
                                                )
                                            ) : isCurrent ? (
                                                <span className="text-white/50 text-xs">Current</span>
                                            ) : (
                                                <span className="text-white/30">—</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="h-px bg-white/10 my-2" />

                        {/* Saved Words Link */}
                        <button
                            onClick={() => navigate('/saved')}
                            className="w-full py-4 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            Saved Words
                        </button>

                        {/* Resume */}
                        <button
                            onClick={() => setIsMenuOpen(false)}
                            className="w-full py-4 bg-white text-surface-300 font-bold rounded-xl"
                        >
                            Resume Lesson
                        </button>

                        {/* Quit */}
                        <button
                            onClick={() => navigate('/')}
                            className="w-full py-3 text-red-400 font-medium hover:text-red-300"
                        >
                            Quit Lesson
                        </button>
                    </div>
                </div>
            )}

            {/* Resume Prompt */}
            {showResumePrompt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
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
                                    onSave={() => saveItem(currentItem.id)}
                                    isSaved={isItemSaved(currentItem.id)}
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
                                            {currentItem.transliteration && (
                                                <div>
                                                    <div className="text-white/40 text-xs">Pronunciation</div>
                                                    <div className="text-white/80 text-sm">{currentItem.transliteration}</div>
                                                </div>
                                            )}
                                            <div>
                                                <div className="text-white/40 text-xs">Language</div>
                                                <div className="text-white/80 text-sm capitalize">{currentItem.language}</div>
                                            </div>
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
