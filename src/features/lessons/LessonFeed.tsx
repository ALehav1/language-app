import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CardStack } from '../../components/CardStack';
import { useCardStack } from '../../hooks/useCardStack';
import { useLessons } from '../../hooks/useLessons';
import { useVocabulary } from '../../hooks/useVocabulary';
import { LessonGenerator } from './LessonGenerator';
import type { CardAction, Language, ContentType, Lesson } from '../../types';

const CONTENT_TYPE_INFO: Record<ContentType | 'all', { label: string; icon: string }> = {
    all: { label: 'All', icon: '📚' },
    word: { label: 'Words', icon: 'Aa' },
    phrase: { label: 'Phrases', icon: '""' },
    dialog: { label: 'Dialog', icon: '💬' },
    paragraph: { label: 'Reading', icon: '📄' },
};

export function LessonFeed() {
    const navigate = useNavigate();
    const [languageFilter, setLanguageFilter] = useState<Language | 'all'>('all');
    const [contentFilter, setContentFilter] = useState<ContentType | 'all'>('all');
    const [previewLesson, setPreviewLesson] = useState<Lesson | null>(null);

    const { lessons, loading, error, refetch } = useLessons({
        language: languageFilter,
        contentType: contentFilter,
    });

    // Fetch vocabulary for preview when a lesson is selected
    const { vocabulary: previewVocab, loading: vocabLoading } = useVocabulary({
        lessonId: previewLesson?.id || '',
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
            // Find the lesson and show preview
            const lesson = lessons.find(l => l.id === action.lessonId);
            if (lesson) {
                setPreviewLesson(lesson);
            }
            return;
        }
        handleAction(action);
    };

    const startLesson = () => {
        if (previewLesson) {
            navigate(`/exercise/${previewLesson.id}`);
        }
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

            {/* Lesson Preview Modal */}
            {previewLesson && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="w-full max-w-md bg-surface-300 sm:rounded-2xl rounded-t-2xl p-6 max-h-[85vh] overflow-y-auto">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <div className="flex gap-2 mb-2">
                                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                                        previewLesson.language === 'arabic' ? 'badge-arabic' : 'badge-spanish'
                                    }`}>
                                        {previewLesson.language === 'arabic' ? 'العربية' : 'Español'}
                                    </span>
                                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-white/10 text-white/70 capitalize">
                                        {CONTENT_TYPE_INFO[previewLesson.contentType || 'word'].icon} {previewLesson.contentType || 'word'}
                                    </span>
                                </div>
                                <h2 className="text-2xl font-bold text-white">{previewLesson.title}</h2>
                            </div>
                            <button
                                onClick={() => setPreviewLesson(null)}
                                className="w-8 h-8 text-white/50 hover:text-white"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <p className="text-white/70 mb-6">{previewLesson.description}</p>

                        {/* Lesson Stats */}
                        <div className="flex gap-4 mb-6">
                            <div className="glass-card px-4 py-2 flex-1 text-center">
                                <div className="text-2xl font-bold text-white">{previewLesson.vocabCount}</div>
                                <div className="text-white/50 text-xs">
                                    {previewLesson.contentType === 'word' ? 'Words'
                                        : previewLesson.contentType === 'phrase' ? 'Phrases'
                                        : previewLesson.contentType === 'dialog' ? 'Lines'
                                        : 'Passages'}
                                </div>
                            </div>
                            <div className="glass-card px-4 py-2 flex-1 text-center">
                                <div className="text-2xl font-bold text-white">{previewLesson.estimatedMinutes}</div>
                                <div className="text-white/50 text-xs">Minutes</div>
                            </div>
                            <div className="glass-card px-4 py-2 flex-1 text-center">
                                <div className="text-lg font-bold text-white capitalize">{previewLesson.difficulty}</div>
                                <div className="text-white/50 text-xs">Level</div>
                            </div>
                        </div>

                        {/* Content Preview */}
                        <div className="mb-6">
                            <h3 className="text-white/70 font-semibold mb-3">
                                {previewLesson.contentType === 'word' ? "Words You'll Learn"
                                    : previewLesson.contentType === 'phrase' ? "Phrases You'll Practice"
                                    : previewLesson.contentType === 'dialog' ? "Dialog Preview"
                                    : "Reading Passages"}
                            </h3>
                            {vocabLoading ? (
                                <div className="text-white/50 text-center py-4">Loading words...</div>
                            ) : previewVocab.length === 0 ? (
                                <div className="text-white/50 text-center py-4">No words yet</div>
                            ) : (
                                <div className="space-y-2">
                                    {previewVocab.map((item, idx) => (
                                        <div key={item.id} className="glass-card p-3 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="text-white/30 text-sm w-5">{idx + 1}.</span>
                                                <div>
                                                    <span className="text-lg text-white">{item.word}</span>
                                                    {item.transliteration && (
                                                        <span className="text-white/40 text-sm ml-2">({item.transliteration})</span>
                                                    )}
                                                </div>
                                            </div>
                                            <span className="text-white/50 text-sm">{item.translation}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="space-y-3">
                            <button
                                onClick={startLesson}
                                disabled={previewVocab.length === 0}
                                className="w-full py-4 bg-white text-surface-300 font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Start Lesson
                            </button>
                            <button
                                onClick={() => setPreviewLesson(null)}
                                className="w-full py-3 text-white/70 font-medium hover:text-white"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* AI Lesson Generator */}
            <LessonGenerator onLessonCreated={refetch} />
        </div>
    );
}
