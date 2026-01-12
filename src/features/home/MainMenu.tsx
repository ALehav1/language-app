import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../contexts/LanguageContext';

/**
 * MainMenu - The home screen with clear navigation options.
 * Replaces the clunky resume flow with a clean menu.
 * 
 * Options:
 * - Lessons: Browse and create lessons
 * - My Words: Saved vocabulary
 * - My Sentences: Saved spoken phrases (Egyptian Arabic)
 * - Lookup: Translate anything (passages, words)
 */
export function MainMenu() {
    const navigate = useNavigate();
    const { language, setLanguage } = useLanguage();
    
    // Phase A: language picker, Phase B: actions
    // Check if user has explicitly selected a language
    // NOTE: This is UI phase detection only - language VALUE comes from useLanguage() hook
    const [hasSelectedLanguage, setHasSelectedLanguage] = useState(() => {
        return localStorage.getItem('language-app-selected-language') !== null;
    });
    const showActions = hasSelectedLanguage;
    const [wordCount, setWordCount] = useState(0);
    const [sentenceCount, setSentenceCount] = useState(0);
    const [passageCount, setPassageCount] = useState(0);
    const [lessonCount, setLessonCount] = useState(0);

    // Fetch counts for badges (language-scoped)
    useEffect(() => {
        async function fetchCounts() {
            // Get total saved vocabulary count (words + sentences + passages) filtered by language
            const { count: words } = await supabase
                .from('saved_words')
                .select('*', { count: 'exact', head: true })
                .eq('language', language)
                .neq('status', 'retired');
            setWordCount(words || 0);

            // Get sentence count (language-scoped)
            try {
                const { count: sentences } = await supabase
                    .from('saved_sentences')
                    .select('*', { count: 'exact', head: true })
                    .eq('language', language)
                    .neq('status', 'retired');
                setSentenceCount(sentences || 0);
            } catch {
                setSentenceCount(0);
            }

            // Get passage count (language-scoped)
            try {
                const { count: passages } = await supabase
                    .from('saved_passages')
                    .select('*', { count: 'exact', head: true })
                    .eq('source_language', language)
                    .neq('status', 'retired');
                setPassageCount(passages || 0);
            } catch {
                setPassageCount(0);
            }

            // Get lesson count filtered by language
            const { count: lessons } = await supabase
                .from('lessons')
                .select('*', { count: 'exact', head: true })
                .eq('language', language);
            setLessonCount(lessons || 0);
        }
        fetchCounts();
    }, [language]);

    const totalVocabCount = wordCount + sentenceCount + passageCount;

    const menuItems = [
        {
            id: 'lessons',
            path: '/lessons',
            label: 'Lessons',
            description: 'Browse & create lessons',
            count: lessonCount,
            icon: (
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
            ),
            color: 'from-teal-500/20 to-teal-600/10 border-teal-500/30',
            iconColor: 'text-teal-400',
        },
        {
            id: 'lookup',
            path: '/lookup',
            label: 'Lookup',
            description: 'Translate anything',
            icon: (
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            ),
            color: 'from-blue-500/20 to-blue-600/10 border-blue-500/30',
            iconColor: 'text-blue-400',
        },
        {
            id: 'vocabulary',
            path: '/vocabulary',
            label: 'My Vocabulary',
            description: 'Review saved learning material',
            count: totalVocabCount,
            icon: (
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
            ),
            color: 'from-amber-500/20 to-amber-600/10 border-amber-500/30',
            iconColor: 'text-amber-400',
        },
    ];

    return (
        <div className="min-h-screen bg-surface-300 p-6 pb-24">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Language Learning</h1>
                <p className="text-white/60">{showActions ? `Learning ${language === 'arabic' ? 'Arabic' : 'Spanish'}` : 'Choose your language'}</p>
            </header>

            {!showActions && (
                <>
                    {/* Phase A: Language Selection */}
                    <section className="mb-8">
                        <h2 className="text-lg font-semibold text-white mb-4">Select Language</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => { setLanguage('arabic'); setHasSelectedLanguage(true); }}
                                className={`
                                    p-6 rounded-2xl border transition-all duration-200
                                    ${
                                        language === 'arabic'
                                            ? 'bg-gradient-to-br from-teal-500/30 to-teal-600/20 border-teal-400/50 scale-[1.02]'
                                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                                    }
                                `}
                            >
                                <div className="text-4xl mb-2">🇪🇬</div>
                                <h2 className="text-xl font-bold text-white mb-1">Arabic</h2>
                                <p className="text-sm text-white/60">Egyptian / MSA</p>
                            </button>
                            <button
                                onClick={() => { setLanguage('spanish'); setHasSelectedLanguage(true); }}
                                className={`
                                    p-6 rounded-2xl border transition-all duration-200
                                    ${
                                        language === 'spanish'
                                            ? 'bg-gradient-to-br from-amber-500/30 to-amber-600/20 border-amber-400/50 scale-[1.02]'
                                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                                    }
                                `}
                            >
                                <div className="text-4xl mb-2">🇲🇽</div>
                                <h2 className="text-xl font-bold text-white mb-1">Spanish</h2>
                                <p className="text-sm text-white/60">LatAm / Spain</p>
                            </button>
                        </div>
                    </section>
                </>
            )}

            {showActions && (
                <>
                    {/* Phase B: Main Actions */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-white">Learning Tools</h2>
                            <button
                                onClick={() => { setHasSelectedLanguage(false); localStorage.removeItem('language-app-selected-language'); }}
                                className="text-sm text-teal-400 hover:text-teal-300 transition-colors"
                            >
                                ← Change Language
                            </button>
                        </div>
                        {/* Top Row - Lessons and Lookup */}
                        <div className="grid grid-cols-2 gap-4">
                            {menuItems.slice(0, 2).map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => navigate(item.path)}
                                    className={`
                                        relative p-6 rounded-2xl border
                                        bg-gradient-to-br ${item.color}
                                        hover:scale-[1.02] active:scale-[0.98]
                                        transition-all duration-200
                                        flex flex-col items-center gap-3 text-center
                                    `}
                                >
                                    {/* Count badge */}
                                    {item.count !== undefined && item.count > 0 && (
                                        <span className="absolute top-3 right-3 min-w-[28px] h-7 flex items-center justify-center px-2 text-xs font-bold bg-white/20 text-white rounded-full">
                                            {item.count > 99 ? '99+' : item.count}
                                        </span>
                                    )}

                                    {/* Icon */}
                                    <div className={`${item.iconColor}`}>
                                        {item.icon}
                                    </div>

                                    {/* Content */}
                                    <div>
                                        <h2 className="text-xl font-bold text-white mb-1">
                                            {item.label}
                                        </h2>
                                        <p className="text-sm text-white/60">
                                            {item.description}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Bottom Row - My Saved Vocabulary (full width) */}
                        {menuItems.slice(2).map((item) => (
                            <button
                                key={item.id}
                                onClick={() => navigate(item.path)}
                                className={`
                                    relative p-6 rounded-2xl border w-full
                                    bg-gradient-to-br ${item.color}
                                    hover:scale-[1.01] active:scale-[0.99]
                                    transition-all duration-200
                                    flex items-center justify-center gap-5
                                `}
                            >
                                {/* Count badge */}
                                {item.count !== undefined && item.count > 0 && (
                                    <span className="absolute top-4 right-4 min-w-[32px] h-8 flex items-center justify-center px-3 text-sm font-bold bg-white/20 text-white rounded-full">
                                        {item.count > 99 ? '99+' : item.count}
                                    </span>
                                )}

                                {/* Icon */}
                                <div className={`${item.iconColor} flex-shrink-0`}>
                                    {item.icon}
                                </div>

                                {/* Content */}
                                <div className="text-center">
                                    <h2 className="text-xl font-bold text-white mb-1">
                                        {item.label}
                                    </h2>
                                    <p className="text-sm text-white/60">
                                        {item.description}
                                    </p>
                                </div>
                            </button>
                        ))}
                    </section>
                </>
            )}
            {/* Quick tip */}
            <div className="mt-8 max-w-md mx-auto">
                <div className="glass-card p-4 text-center">
                    <p className="text-white/40 text-sm">
                        💡 <strong className="text-white/60">Tip:</strong> Use Lookup to paste any Arabic text and get instant translation + pronunciation
                    </p>
                </div>
            </div>
        </div>
    );
}
