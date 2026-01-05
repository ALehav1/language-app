import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
    const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
    const [generatorOpen, setGeneratorOpen] = useState(false);

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
            // Show preview modal - try activeLessons first, then raw lessons as fallback
            const lesson = activeLessons.find(l => l.id === action.lessonId)
                || lessons.find(l => l.id === action.lessonId);
            if (lesson) {
                setSelectedLesson(lesson);
            } else {
                // Fallback: navigate directly if lesson not found
                navigate(`/exercise/${action.lessonId}`);
            }
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

            {/* Lesson Preview Modal */}
            {selectedLesson && (
                <LessonPreviewModal
                    lesson={selectedLesson}
                    onClose={() => setSelectedLesson(null)}
                    onStart={() => {
                        navigate(`/exercise/${selectedLesson.id}`);
                        setSelectedLesson(null);
                    }}
                />
            )}
        </div>
    );
}

/** Preview modal that shows lesson info and vocabulary WITHOUT translations */
function LessonPreviewModal({
    lesson,
    onClose,
    onStart
}: {
    lesson: Lesson;
    onClose: () => void;
    onStart: () => void;
}) {
    const { vocabulary, loading } = useVocabulary({ lessonId: lesson.id });
    const isArabic = lesson.language === 'arabic';
    const contentType = lesson.contentType || 'word';

    const contentTypeLabel = contentType === 'word' ? 'Words'
        : contentType === 'phrase' ? 'Phrases'
        : contentType === 'dialog' ? 'Dialog Lines'
        : 'Passages';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="glass-card w-full max-w-md max-h-[85vh] overflow-hidden flex flex-col animate-card-enter">
                {/* Header */}
                <div className="p-6 pb-4">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/50 hover:text-white"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    {/* Badges */}
                    <div className="flex gap-2 mb-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            isArabic ? 'bg-teal-500/20 text-teal-400' : 'bg-amber-500/20 text-amber-400'
                        }`}>
                            {isArabic ? 'العربية' : 'Español'}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white/70">
                            {CONTENT_TYPE_INFO[contentType]?.icon} {CONTENT_TYPE_INFO[contentType]?.label}
                        </span>
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-2">{lesson.title}</h2>
                    <p className="text-white/60 text-sm">{lesson.description}</p>

                    {/* Stats */}
                    <div className="flex gap-4 mt-4">
                        <div className="flex-1 bg-white/5 rounded-xl p-3 text-center">
                            <div className="text-xl font-bold text-white">{lesson.vocabCount}</div>
                            <div className="text-white/50 text-xs">{contentTypeLabel}</div>
                        </div>
                        <div className="flex-1 bg-white/5 rounded-xl p-3 text-center">
                            <div className="text-xl font-bold text-white">{lesson.estimatedMinutes}</div>
                            <div className="text-white/50 text-xs">Minutes</div>
                        </div>
                        <div className="flex-1 bg-white/5 rounded-xl p-3 text-center">
                            <div className="text-xl font-bold text-white capitalize">{lesson.difficulty}</div>
                            <div className="text-white/50 text-xs">Level</div>
                        </div>
                    </div>
                </div>

                {/* Vocabulary Preview - NO TRANSLATIONS */}
                <div className="flex-1 overflow-y-auto px-6 pb-4">
                    <h3 className="text-white/70 font-semibold mb-3 text-sm">
                        {contentTypeLabel} to Practice
                    </h3>
                    {loading ? (
                        <div className="text-white/50 text-center py-4">Loading...</div>
                    ) : (
                        <div className="space-y-2">
                            {vocabulary.map((item, idx) => (
                                <div
                                    key={item.id}
                                    className="bg-white/5 rounded-xl p-3 flex items-center gap-3"
                                >
                                    <span className="text-white/30 text-sm w-6">{idx + 1}.</span>
                                    <div className="flex-1">
                                        <span
                                            className={`text-lg text-white ${isArabic ? 'font-arabic' : ''}`}
                                            dir={isArabic ? 'rtl' : 'ltr'}
                                        >
                                            {item.word}
                                        </span>
                                        {item.transliteration && (
                                            <span className="text-white/40 text-sm ml-2">
                                                ({item.transliteration})
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Start Button */}
                <div className="p-6 pt-4 border-t border-white/10">
                    <button
                        onClick={onStart}
                        className="w-full py-4 bg-white text-surface-300 font-bold rounded-xl text-lg hover:bg-white/90 transition-all"
                    >
                        Start Lesson
                    </button>
                </div>
            </div>
        </div>
    );
}
