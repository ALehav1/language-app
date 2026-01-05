import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
    const [languageFilter, setLanguageFilter] = useState<Language | 'all'>(() => {
        const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
        return (saved as Language | 'all') || 'arabic';
    });
    const [contentFilter, setContentFilter] = useState<ContentType | 'all'>(() => {
        const saved = localStorage.getItem(CONTENT_TYPE_STORAGE_KEY);
        return (saved as ContentType | 'all') || 'all';
    });

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

    // Update card stack when lessons change
    useEffect(() => {
        if (lessons.length > 0) {
            resetWithLessons(lessons);
        }
    }, [lessons, resetWithLessons]);

    const handleCardAction = (action: CardAction) => {
        if (action.type === 'start') {
            // Go directly to the exercise
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
                    <h1 className="text-2xl font-bold text-white">Today's Lessons</h1>
                    <button
                        onClick={() => navigate('/saved')}
                        className="touch-btn w-10 h-10 bg-white/10 text-white/70 hover:text-white flex items-center justify-center"
                        aria-label="Saved words"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    </button>
                </div>

                {/* Language Filter */}
                <div className="flex gap-2 mt-4">
                    {(['all', 'arabic', 'spanish'] as const).map(lang => (
                        <button
                            key={lang}
                            onClick={() => setLanguageFilter(lang)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${languageFilter === lang
                                ? 'bg-white text-surface-300'
                                : 'bg-white/10 text-white/70 hover:bg-white/20'
                                }`}
                        >
                            {lang === 'all' ? 'All' : lang === 'arabic' ? 'العربية' : 'Español'}
                        </button>
                    ))}
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
                        emptyMessage="All caught up! Check back later for new lessons."
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
                onLessonCreated={refetch}
                defaultLanguage={languageFilter === 'all' ? 'arabic' : languageFilter}
            />
        </div>
    );
}
