import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CardStack } from '../../components/CardStack';
import { useCardStack } from '../../hooks/useCardStack';
import { useLessons } from '../../hooks/useLessons';
import { LessonGenerator } from './LessonGenerator';
import type { CardAction, Language, ContentType } from '../../types';

const CONTENT_TYPE_INFO: Record<ContentType | 'all', { label: string; icon: string }> = {
    all: { label: 'All', icon: '📚' },
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
    const [searchParams, setSearchParams] = useSearchParams();

    // Read initial content type from URL param if present
    const urlContentType = searchParams.get('type') as ContentType | null;

    const [languageFilter, setLanguageFilter] = useState<Language>(() => {
        const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
        // Only accept valid languages, default to arabic
        if (saved === 'arabic' || saved === 'spanish') return saved;
        return 'arabic';
    });
    const [contentFilter, setContentFilter] = useState<ContentType | 'all'>(() => {
        // URL param takes priority, then localStorage, then default to 'word'
        if (urlContentType && ['word', 'phrase', 'dialog', 'paragraph'].includes(urlContentType)) {
            return urlContentType;
        }
        const saved = localStorage.getItem(CONTENT_TYPE_STORAGE_KEY);
        if (saved && ['word', 'phrase', 'dialog', 'paragraph', 'all'].includes(saved)) {
            return saved as ContentType | 'all';
        }
        return 'word'; // Default to words, not 'all'
    });

    // Sync URL param changes to state
    useEffect(() => {
        if (urlContentType && ['word', 'phrase', 'dialog', 'paragraph'].includes(urlContentType)) {
            setContentFilter(urlContentType);
            // Clear the URL param after reading
            setSearchParams({}, { replace: true });
        }
    }, [urlContentType, setSearchParams]);
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

    const { activeLessons, savedLessons, handleAction, resetWithLessons } = useCardStack({
        initialLessons: lessons,
        persistKey: `lesson-cards-${languageFilter}-${contentFilter}`,
        onActionComplete: (action) => {
            console.log('Action completed:', action);
        },
    });

    // Update card stack when lessons change (including when filtered to empty)
    useEffect(() => {
        resetWithLessons(lessons);
    }, [lessons, resetWithLessons]);

    const handleCardAction = (action: CardAction) => {
        if (action.type === 'start') {
            // Go directly to exercise - no preview modal
            navigate(`/exercise/${action.lessonId}`);
            return;
        }
        handleAction(action);
    };

    return (
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <header className="px-4 pt-4 pb-4">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => setMenuOpen(true)}
                        className="touch-btn w-10 h-10 bg-white/10 text-white/70 hover:text-white flex items-center justify-center rounded-xl"
                        aria-label="Open menu"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                    <h1 className="text-xl font-bold text-white">Lessons</h1>
                    <button
                        onClick={() => navigate('/saved')}
                        className="touch-btn w-10 h-10 bg-white/10 text-white/70 hover:text-white flex items-center justify-center rounded-xl"
                        aria-label="Saved words"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    </button>
                </div>

                {/* Language Selector - Prominent toggle between Arabic and Spanish */}
                <div className="flex items-center gap-3 mt-4">
                    <span className="text-white/50 text-sm">Learning:</span>
                    <div className="flex bg-white/10 rounded-full p-1">
                        {(['arabic', 'spanish'] as const).map(lang => (
                            <button
                                key={lang}
                                onClick={() => setLanguageFilter(lang)}
                                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                                    languageFilter === lang
                                        ? 'bg-white text-surface-300 shadow-md'
                                        : 'text-white/70 hover:text-white'
                                }`}
                            >
                                {lang === 'arabic' ? 'العربية Arabic' : 'Español Spanish'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Type Filter */}
                <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                    {(Object.keys(CONTENT_TYPE_INFO) as (ContentType | 'all')[]).map(type => (
                        <button
                            key={type}
                            onClick={() => setContentFilter(type)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${contentFilter === type
                                ? 'bg-white/20 text-white border border-white/30'
                                : 'bg-white/5 text-white/50 hover:bg-white/10 border border-transparent'
                                }`}
                        >
                            <span>{CONTENT_TYPE_INFO[type].icon}</span>
                            <span>{CONTENT_TYPE_INFO[type].label}</span>
                        </button>
                    ))}
                </div>
            </header>

            {/* Card Stack */}
            <main className="flex-1 px-0">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-white/50">Loading lessons...</div>
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
                        emptyMessage={
                            contentFilter !== 'all'
                                ? `No ${CONTENT_TYPE_INFO[contentFilter].label.toLowerCase()} lessons yet.`
                                : "All caught up! Check back later for new lessons."
                        }
                        onCreateLesson={contentFilter !== 'all' ? () => setGeneratorOpen(true) : undefined}
                    />
                )}
            </main>

            {/* Saved indicator */}
            {savedLessons.length > 0 && (
                <div className="fixed bottom-20 left-4 right-4">
                    <button className="w-full glass-card px-4 py-3 flex items-center justify-between">
                        <span className="text-white/70">Saved lessons</span>
                        <span className="bg-save/20 text-save px-3 py-1 rounded-full text-sm font-medium">
                            {savedLessons.length}
                        </span>
                    </button>
                </div>
            )}

            {/* AI Lesson Generator */}
            <LessonGenerator
                onLessonCreated={() => {
                    refetch();
                    setGeneratorOpen(false);
                }}
                defaultLanguage={languageFilter}
                defaultContentType={contentFilter !== 'all' ? contentFilter : undefined}
                externalOpen={generatorOpen}
                onOpenChange={setGeneratorOpen}
            />

            {/* Menu Overlay */}
            {menuOpen && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="w-full max-w-sm bg-surface-300 sm:rounded-2xl rounded-t-2xl p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xl font-bold text-white">Menu</h3>
                            <button
                                onClick={() => setMenuOpen(false)}
                                className="w-8 h-8 text-white/50 hover:text-white"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Lesson Types */}
                        <div className="text-white/50 text-sm px-1">Lesson Types</div>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => { setContentFilter('word'); setMenuOpen(false); }}
                                className={`py-3 rounded-xl text-sm font-medium ${contentFilter === 'word' ? 'bg-white text-surface-300' : 'bg-white/10 text-white hover:bg-white/20'}`}
                            >
                                Aa Words
                            </button>
                            <button
                                onClick={() => { setContentFilter('phrase'); setMenuOpen(false); }}
                                className={`py-3 rounded-xl text-sm font-medium ${contentFilter === 'phrase' ? 'bg-white text-surface-300' : 'bg-white/10 text-white hover:bg-white/20'}`}
                            >
                                "" Phrases
                            </button>
                            <button
                                onClick={() => { setContentFilter('dialog'); setMenuOpen(false); }}
                                className={`py-3 rounded-xl text-sm font-medium ${contentFilter === 'dialog' ? 'bg-white text-surface-300' : 'bg-white/10 text-white hover:bg-white/20'}`}
                            >
                                Dialog
                            </button>
                            <button
                                onClick={() => { setContentFilter('paragraph'); setMenuOpen(false); }}
                                className={`py-3 rounded-xl text-sm font-medium ${contentFilter === 'paragraph' ? 'bg-white text-surface-300' : 'bg-white/10 text-white hover:bg-white/20'}`}
                            >
                                Reading
                            </button>
                        </div>

                        <div className="h-px bg-white/10 my-2" />

                        {/* Navigation */}
                        <button
                            onClick={() => { navigate('/saved'); setMenuOpen(false); }}
                            className="w-full py-4 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            Saved Words
                        </button>

                        <button
                            onClick={() => { setGeneratorOpen(true); setMenuOpen(false); }}
                            className="w-full py-4 bg-white text-surface-300 font-bold rounded-xl"
                        >
                            + Create New Lesson
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
