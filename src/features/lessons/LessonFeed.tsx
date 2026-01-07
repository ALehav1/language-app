import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CardStack } from '../../components/CardStack';
import { useCardStack } from '../../hooks/useCardStack';
import { useLessons } from '../../hooks/useLessons';
import { LessonGenerator } from './LessonGenerator';
import type { CardAction, Language, ContentType } from '../../types';

const CONTENT_TYPE_INFO: Record<ContentType, { label: string; icon: string }> = {
    word: { label: 'Words', icon: 'Aa' },
    phrase: { label: 'Phrases', icon: '""' },
    dialog: { label: 'Dialog', icon: '💬' },
    paragraph: { label: 'Reading', icon: '📄' },
};

// localStorage keys for persisting user preferences
const LANGUAGE_STORAGE_KEY = 'language-app-language';
const CONTENT_TYPE_STORAGE_KEY = 'language-app-content-type';

export function LessonFeed() {
    const navigate = useNavigate();

    const [languageFilter, setLanguageFilter] = useState<Language>(() => {
        const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
        if (saved === 'arabic' || saved === 'spanish') return saved;
        return 'arabic';
    });

    const [contentFilter, setContentFilter] = useState<ContentType>(() => {
        const saved = localStorage.getItem(CONTENT_TYPE_STORAGE_KEY);
        if (saved && ['word', 'phrase', 'dialog', 'paragraph'].includes(saved)) {
            return saved as ContentType;
        }
        return 'word';
    });

    const [generatorOpen, setGeneratorOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    // Persist filter changes to localStorage
    useEffect(() => {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, languageFilter);
    }, [languageFilter]);

    useEffect(() => {
        localStorage.setItem(CONTENT_TYPE_STORAGE_KEY, contentFilter);
    }, [contentFilter]);

    const { lessons, loading, error, refetch } = useLessons({
        language: languageFilter,
        contentType: contentFilter,
    });

    const { activeLessons, handleAction, resetWithLessons, canUndo, undoLastAction, lastActionType } = useCardStack({
        initialLessons: lessons,
        persistKey: `lesson-cards-${languageFilter}-${contentFilter}`,
    });

    // Update card stack when lessons change
    useEffect(() => {
        resetWithLessons(lessons);
    }, [lessons, resetWithLessons]);

    const handleCardAction = (action: CardAction) => {
        if (action.type === 'start') {
            navigate(`/exercise/${action.lessonId}`);
            return;
        }
        handleAction(action);
    };

    const currentTypeLabel = CONTENT_TYPE_INFO[contentFilter].label;

    return (
        <div className="min-h-screen flex flex-col">
            {/* Header with back button, title, and filter */}
            <header className="px-4 pt-4 pb-2">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => navigate('/')}
                        className="touch-btn w-10 h-10 bg-white/10 text-white hover:bg-white/20 flex items-center justify-center rounded-xl"
                        aria-label="Back to menu"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div className="text-center flex-1">
                        <h1 className="text-lg font-bold text-white">{currentTypeLabel}</h1>
                        <span className="text-white/50 text-xs">
                            {languageFilter === 'arabic' ? 'العربية' : 'Español'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Create Lesson button - prominent */}
                        <button
                            onClick={() => setGeneratorOpen(true)}
                            className="touch-btn px-3 h-10 bg-violet-500 text-white hover:bg-violet-600 flex items-center justify-center gap-1.5 rounded-xl font-medium text-sm"
                            aria-label="Create new lesson"
                        >
                            <span className="text-lg">+</span>
                            <span>Create</span>
                        </button>
                        {/* Filter button */}
                        <button
                            onClick={() => setMenuOpen(true)}
                            className="touch-btn w-10 h-10 bg-white/10 text-white hover:bg-white/20 flex items-center justify-center rounded-xl"
                            aria-label="Filter settings"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                            </svg>
                        </button>
                    </div>
                </div>
            </header>

            {/* Card Stack */}
            <main className="flex-1 px-0">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64 px-4 space-y-4">
                        {/* Skeleton loading cards */}
                        <div className="w-full max-w-sm space-y-3">
                            <div className="skeleton h-48 rounded-3xl" />
                            <div className="skeleton h-4 w-3/4 mx-auto" />
                            <div className="skeleton h-4 w-1/2 mx-auto" />
                        </div>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center h-64 px-4">
                        <div className="text-red-400 mb-2">Failed to load lessons</div>
                        <div className="text-white/50 text-sm text-center">{error}</div>
                    </div>
                ) : (
                    <CardStack
                        lessons={activeLessons}
                        onAction={handleCardAction}
                        onCreateLesson={() => setGeneratorOpen(true)}
                    />
                )}
            </main>

            {/* AI Lesson Generator */}
            <LessonGenerator
                onLessonCreated={(lessonId) => {
                    setGeneratorOpen(false);
                    // Navigate directly to exercise if lessonId provided
                    if (lessonId) {
                        navigate(`/exercise/${lessonId}`);
                    } else {
                        refetch();
                    }
                }}
                defaultLanguage={languageFilter}
                defaultContentType={contentFilter}
                externalOpen={generatorOpen}
                onOpenChange={setGeneratorOpen}
            />

            {/* Menu Overlay */}
            {menuOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-end justify-center"
                    onClick={() => setMenuOpen(false)}
                >
                    <div
                        className="w-full max-w-md bg-gradient-to-b from-surface-200 to-surface-300 rounded-t-3xl p-5 pb-8 space-y-5"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Drag handle */}
                        <div className="flex justify-center">
                            <div className="w-10 h-1 bg-white/20 rounded-full" />
                        </div>

                        {/* Language Selection */}
                        <div className="space-y-2">
                            <div className="text-white/40 text-xs font-medium uppercase tracking-wider">Language</div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setLanguageFilter('arabic')}
                                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                                        languageFilter === 'arabic'
                                            ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/25'
                                            : 'bg-white/5 text-white/60 hover:bg-white/10'
                                    }`}
                                >
                                    العربية
                                </button>
                                <button
                                    onClick={() => setLanguageFilter('spanish')}
                                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                                        languageFilter === 'spanish'
                                            ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/25'
                                            : 'bg-white/5 text-white/60 hover:bg-white/10'
                                    }`}
                                >
                                    Español
                                </button>
                            </div>
                        </div>

                        {/* Lesson Types - View & Create */}
                        <div className="space-y-2">
                            <div className="text-white/40 text-xs font-medium uppercase tracking-wider">Lessons</div>
                            <div className="space-y-1.5">
                                {(Object.keys(CONTENT_TYPE_INFO) as ContentType[]).map(type => (
                                    <div key={type} className="flex gap-1.5">
                                        <button
                                            onClick={() => { setContentFilter(type); setMenuOpen(false); }}
                                            className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                                                contentFilter === type
                                                    ? 'bg-white/20 text-white'
                                                    : 'bg-white/5 text-white/50 hover:bg-white/10'
                                            }`}
                                        >
                                            <span>{CONTENT_TYPE_INFO[type].icon}</span>
                                            <span>{CONTENT_TYPE_INFO[type].label}</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                setContentFilter(type);
                                                setGeneratorOpen(true);
                                                setMenuOpen(false);
                                            }}
                                            className="w-11 py-2.5 rounded-lg bg-violet-500/20 text-violet-300 hover:bg-violet-500/40 transition-all text-sm font-bold"
                                            title={`Create ${CONTENT_TYPE_INFO[type].label} Lesson`}
                                        >
                                            +
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Saved Words */}
                        <div className="pt-2">
                            <button
                                onClick={() => { navigate('/saved'); setMenuOpen(false); }}
                                className="w-full py-3 bg-white/5 text-white/70 font-medium rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                                </svg>
                                Saved Words
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Undo Toast */}
            {canUndo && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-card-enter">
                    <button
                        onClick={undoLastAction}
                        className="flex items-center gap-3 px-5 py-3 bg-surface-100 rounded-full shadow-lg border border-white/10"
                    >
                        <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                        <span className="text-white font-medium">
                            Undo {lastActionType === 'dismiss' ? 'skip' : lastActionType}
                        </span>
                    </button>
                </div>
            )}
        </div>
    );
}
