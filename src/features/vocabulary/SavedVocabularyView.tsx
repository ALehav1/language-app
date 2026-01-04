import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSavedVocabulary } from '../../hooks/useSavedVocabulary';
import type { Language } from '../../types/database';

type FilterType = 'all' | Language;

export function SavedVocabularyView() {
    const navigate = useNavigate();
    const { savedItems, loading, error, removeItem } = useSavedVocabulary();
    const [filter, setFilter] = useState<FilterType>('all');

    const filteredItems = filter === 'all'
        ? savedItems
        : savedItems.filter(item => item.vocabulary_items.language === filter);

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <div className="text-white/50">Loading saved words...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col p-4">
            {/* Header */}
            <header className="flex items-center gap-4 py-4">
                <button
                    onClick={() => navigate('/')}
                    className="touch-btn w-10 h-10 bg-white/10 text-white/70 flex items-center justify-center"
                    aria-label="Back to lessons"
                >
                    <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 19l-7-7 7-7"
                        />
                    </svg>
                </button>
                <h1 className="text-xl font-bold text-white">Saved Words</h1>
            </header>

            {/* Filter tabs */}
            <div className="flex gap-2 mb-6">
                {(['all', 'arabic', 'spanish'] as FilterType[]).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`
                            px-4 py-2 rounded-full text-sm font-medium transition-all
                            ${filter === f
                                ? 'bg-white text-surface-300'
                                : 'bg-white/10 text-white/70 hover:bg-white/20'
                            }
                        `}
                    >
                        {f === 'all' ? 'All' : f === 'arabic' ? 'العربية' : 'Español'}
                    </button>
                ))}
            </div>

            {/* Error state */}
            {error && (
                <div className="glass-card p-4 text-center text-red-400 mb-4">
                    {error}
                </div>
            )}

            {/* Empty state */}
            {filteredItems.length === 0 && !loading && (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 mb-4 rounded-full bg-white/10 flex items-center justify-center">
                        <svg
                            className="w-10 h-10 text-white/30"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                            />
                        </svg>
                    </div>
                    <h2 className="text-lg font-semibold text-white mb-2">No saved words yet</h2>
                    <p className="text-white/50 max-w-xs">
                        Tap the heart icon during exercises to save words for later review.
                    </p>
                </div>
            )}

            {/* Saved items list */}
            <div className="space-y-3">
                {filteredItems.map((saved) => {
                    const item = saved.vocabulary_items;
                    const badgeClass = item.language === 'arabic' ? 'badge-arabic' : 'badge-spanish';

                    return (
                        <div key={saved.id} className="glass-card p-4">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    {/* Language badge */}
                                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${badgeClass} mb-2`}>
                                        {item.language === 'arabic' ? 'العربية' : 'Español'}
                                    </span>

                                    {/* Word */}
                                    <h3 className="text-2xl font-bold text-white mb-1">
                                        {item.word}
                                    </h3>

                                    {/* Transliteration */}
                                    {item.transliteration && (
                                        <p className="text-white/50 text-sm italic mb-2">
                                            {item.transliteration}
                                        </p>
                                    )}

                                    {/* Translation */}
                                    <p className="text-white/80">
                                        {item.translation}
                                    </p>

                                    {/* Hebrew cognate */}
                                    {item.hebrew_cognate && (
                                        <div className="mt-3 p-2 bg-white/5 rounded-lg">
                                            <p className="text-white/40 text-xs mb-1">Hebrew connection</p>
                                            <p className="text-white/70 text-sm">
                                                {item.hebrew_cognate.root} ({item.hebrew_cognate.meaning})
                                            </p>
                                            {item.hebrew_cognate.notes && (
                                                <p className="text-white/50 text-xs mt-1">
                                                    {item.hebrew_cognate.notes}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Remove button */}
                                <button
                                    onClick={() => removeItem(item.id)}
                                    className="touch-btn w-10 h-10 text-white/30 hover:text-red-400 transition-colors flex items-center justify-center"
                                    aria-label="Remove from saved"
                                >
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
