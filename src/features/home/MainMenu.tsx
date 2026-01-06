import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

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
    const [wordCount, setWordCount] = useState(0);
    const [sentenceCount, setSentenceCount] = useState(0);
    const [lessonCount, setLessonCount] = useState(0);

    // Fetch counts for badges
    useEffect(() => {
        async function fetchCounts() {
            // Get word count
            const { count: words } = await supabase
                .from('saved_words')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'active');
            setWordCount(words || 0);

            // Get sentence count (will be 0 until table exists)
            try {
                const { count: sentences } = await supabase
                    .from('saved_sentences')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'active');
                setSentenceCount(sentences || 0);
            } catch {
                // Table doesn't exist yet
                setSentenceCount(0);
            }

            // Get lesson count
            const { count: lessons } = await supabase
                .from('lessons')
                .select('*', { count: 'exact', head: true });
            setLessonCount(lessons || 0);
        }
        fetchCounts();
    }, []);

    const menuItems = [
        {
            id: 'lessons',
            path: '/lessons',
            label: 'Lessons',
            description: 'Browse & create lessons',
            count: lessonCount,
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
            ),
            color: 'from-teal-500/20 to-teal-600/10 border-teal-500/30',
            iconColor: 'text-teal-400',
        },
        {
            id: 'words',
            path: '/words',
            label: 'My Words',
            description: 'Saved vocabulary',
            count: wordCount,
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
            ),
            color: 'from-amber-500/20 to-amber-600/10 border-amber-500/30',
            iconColor: 'text-amber-400',
        },
        {
            id: 'sentences',
            path: '/sentences',
            label: 'My Sentences',
            description: 'Spoken Arabic phrases',
            count: sentenceCount,
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
            ),
            color: 'from-purple-500/20 to-purple-600/10 border-purple-500/30',
            iconColor: 'text-purple-400',
        },
        {
            id: 'lookup',
            path: '/lookup',
            label: 'Lookup',
            description: 'Translate anything',
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            ),
            color: 'from-blue-500/20 to-blue-600/10 border-blue-500/30',
            iconColor: 'text-blue-400',
            highlight: true, // Make this one stand out
        },
    ];

    return (
        <div className="min-h-screen bg-surface-300 p-4 pt-8">
            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">
                    🇪🇬 Arabic Learning
                </h1>
                <p className="text-white/50 text-sm">
                    Learn how Egyptians actually speak
                </p>
            </div>

            {/* Menu Grid */}
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                {menuItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => navigate(item.path)}
                        className={`
                            relative p-5 rounded-2xl border
                            bg-gradient-to-br ${item.color}
                            hover:scale-[1.02] active:scale-[0.98]
                            transition-all duration-200
                            ${item.highlight ? 'col-span-2' : ''}
                        `}
                    >
                        {/* Count badge */}
                        {item.count !== undefined && item.count > 0 && (
                            <span className="absolute top-3 right-3 min-w-[24px] h-6 flex items-center justify-center px-2 text-xs font-bold bg-white/20 text-white rounded-full">
                                {item.count > 99 ? '99+' : item.count}
                            </span>
                        )}

                        <div className={`${item.iconColor} mb-3`}>
                            {item.icon}
                        </div>
                        <h2 className="text-lg font-bold text-white text-left">
                            {item.label}
                        </h2>
                        <p className="text-sm text-white/50 text-left">
                            {item.description}
                        </p>
                    </button>
                ))}
            </div>

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
