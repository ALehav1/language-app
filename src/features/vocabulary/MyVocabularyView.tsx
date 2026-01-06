import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSavedWords } from '../../hooks/useSavedWords';
import { LookupModal } from './LookupModal';
import { WordDetailCard } from '../../components/WordDetailCard';
import type { SavedWordWithContexts, WordStatus } from '../../types';

type SortOption = 'recent' | 'alphabetical' | 'alphabetical-en';

/**
 * My Vocabulary - Arabic word collection with search, filters, and organization.
 * Phase 12C: Central hub for saved Arabic vocabulary.
 */
export function MyVocabularyView() {
    const navigate = useNavigate();
    
    // State for filters and search
    const [statusFilter, setStatusFilter] = useState<WordStatus | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<SortOption>('recent');
    const [selectedWord, setSelectedWord] = useState<SavedWordWithContexts | null>(null);
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [showLookup, setShowLookup] = useState(false);

    // Fetch words with filters
    const { 
        words, 
        loading, 
        error, 
        updateStatus, 
        deleteWord,
        counts,
        refetch 
    } = useSavedWords({
        status: statusFilter,
        searchQuery: searchQuery.trim() || undefined,
    });

    // Sort words
    const sortedWords = useMemo(() => {
        const sorted = [...words];
        switch (sortBy) {
            case 'alphabetical':
                return sorted.sort((a, b) => a.word.localeCompare(b.word, 'ar'));
            case 'alphabetical-en':
                return sorted.sort((a, b) => a.translation.localeCompare(b.translation, 'en'));
            case 'recent':
            default:
                return sorted; // Already sorted by created_at DESC from hook
        }
    }, [words, sortBy]);


    // Selection handlers
    const toggleSelection = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const selectAll = () => {
        setSelectedIds(new Set(sortedWords.map(w => w.id)));
    };

    const clearSelection = () => {
        setSelectedIds(new Set());
    };

    const startPractice = () => {
        if (selectedIds.size === 0) return;
        const ids = Array.from(selectedIds).join(',');
        navigate(`/exercise/saved?ids=${ids}`);
    };

    // Status badge component
    const StatusBadge = ({ status }: { status: WordStatus }) => {
        const styles: Record<WordStatus, string> = {
            active: 'bg-amber-500/20 text-amber-400',
            learned: 'bg-green-500/20 text-green-400',
        };
        const labels: Record<WordStatus, string> = {
            active: 'Active',
            learned: 'Learned',
        };
        return (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
                {labels[status]}
            </span>
        );
    };

    if (loading && words.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                {/* Skeleton loading */}
                <div className="w-full max-w-md space-y-4">
                    <div className="h-12 bg-white/10 rounded-xl skeleton-shimmer" />
                    <div className="h-10 bg-white/10 rounded-full skeleton-shimmer" />
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-24 bg-white/10 rounded-xl skeleton-shimmer" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-surface-300/95 backdrop-blur-sm border-b border-white/10">
                <div className="flex items-center gap-4 p-4">
                    <button
                        onClick={() => selectionMode ? setSelectionMode(false) : navigate('/')}
                        className="touch-btn w-10 h-10 bg-white/10 text-white/70 flex items-center justify-center rounded-xl"
                        aria-label={selectionMode ? 'Exit selection' : 'Back to menu'}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-white">
                            {selectionMode ? `${selectedIds.size} selected` : 'My Vocabulary'}
                        </h1>
                        {!selectionMode && (
                            <p className="text-white/50 text-sm">
                                {counts.total} words • {counts.active} active
                            </p>
                        )}
                    </div>
                    {!selectionMode && sortedWords.length > 0 && (
                        <button
                            onClick={() => { setSelectionMode(true); clearSelection(); }}
                            className="touch-btn px-4 py-2 bg-white/10 text-white/70 rounded-xl text-sm font-medium hover:bg-white/20"
                        >
                            Practice
                        </button>
                    )}
                </div>

                {/* Search bar */}
                {!selectionMode && (
                    <div className="px-4 pb-3">
                        <div className="relative">
                            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search words..."
                                className="w-full pl-10 pr-4 py-3 bg-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/50"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Filter chips */}
                {selectionMode ? (
                    <div className="flex gap-2 px-4 pb-3">
                        <button
                            onClick={selectAll}
                            className="px-4 py-2 rounded-full text-sm font-medium bg-white/10 text-white/70 hover:bg-white/20"
                        >
                            Select All
                        </button>
                        <button
                            onClick={clearSelection}
                            className="px-4 py-2 rounded-full text-sm font-medium bg-white/10 text-white/70 hover:bg-white/20"
                        >
                            Clear
                        </button>
                    </div>
                ) : (
                    <div className="flex gap-2 px-4 pb-3 overflow-x-auto">
                        {/* Status filters */}
                        <button
                            onClick={() => setStatusFilter('all')}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                                statusFilter === 'all'
                                    ? 'bg-white text-surface-300'
                                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                            }`}
                        >
                            All ({counts.total})
                        </button>
                        <button
                            onClick={() => setStatusFilter('active')}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                                statusFilter === 'active'
                                    ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                            }`}
                        >
                            Active ({counts.active})
                        </button>
                        <button
                            onClick={() => setStatusFilter('learned')}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                                statusFilter === 'learned'
                                    ? 'bg-green-500/30 text-green-300 border border-green-500/50'
                                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                            }`}
                        >
                            Learned ({counts.learned})
                        </button>

                        {/* Sort dropdown */}
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortOption)}
                            className="px-3 py-2 rounded-full text-sm font-medium bg-white/10 text-white/70 border-none focus:outline-none focus:ring-2 focus:ring-white/20 cursor-pointer"
                        >
                            <option value="recent">Recent</option>
                            <option value="alphabetical">A-Z (Arabic)</option>
                            <option value="alphabetical-en">A-Z (English)</option>
                        </select>
                    </div>
                )}
            </header>

            {/* Error state */}
            {error && (
                <div className="mx-4 mt-4 glass-card p-4 text-center text-red-400">
                    {error}
                    <button onClick={refetch} className="ml-2 underline">Retry</button>
                </div>
            )}

            {/* Empty state */}
            {sortedWords.length === 0 && !loading && (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                    <div className="w-20 h-20 mb-4 rounded-full bg-white/10 flex items-center justify-center">
                        <svg className="w-10 h-10 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    </div>
                    <h2 className="text-lg font-semibold text-white mb-2">
                        {searchQuery ? 'No words found' : 'No saved words yet'}
                    </h2>
                    <p className="text-white/50 max-w-xs">
                        {searchQuery 
                            ? `No words match "${searchQuery}"`
                            : 'Tap the heart icon during exercises to save words for later review.'
                        }
                    </p>
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="mt-4 px-4 py-2 bg-white/10 text-white/70 rounded-xl hover:bg-white/20"
                        >
                            Clear search
                        </button>
                    )}
                </div>
            )}

            {/* Word list */}
            <main className="flex-1 overflow-y-auto px-4 pb-24">
                <div className="space-y-3 py-4">
                    {sortedWords.map((word) => {
                        const isSelected = selectedIds.has(word.id);

                        return (
                            <div
                                key={word.id}
                                className={`glass-card p-4 cursor-pointer transition-all ${isSelected ? 'ring-2 ring-white/50' : ''}`}
                                onClick={() => selectionMode ? toggleSelection(word.id) : setSelectedWord(word)}
                            >
                                <div className="flex items-start gap-3">
                                    {/* Selection checkbox */}
                                    {selectionMode && (
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 ${isSelected ? 'bg-white border-white' : 'border-white/30'}`}>
                                            {isSelected && (
                                                <svg className="w-4 h-4 text-surface-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex-1 min-w-0">
                                        {/* Status badge */}
                                        <div className="flex items-center gap-2 mb-2">
                                            <StatusBadge status={word.status} />
                                            {word.topic && (
                                                <span className="px-2 py-0.5 rounded-full text-xs bg-white/10 text-white/50">
                                                    {word.topic}
                                                </span>
                                            )}
                                        </div>

                                        {/* Word */}
                                        <h3 className="text-2xl font-bold text-white font-arabic mb-1" dir="rtl">
                                            {word.word}
                                        </h3>

                                        {/* Pronunciations */}
                                        {(word.pronunciation_standard || word.pronunciation_egyptian) && (
                                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm mb-2">
                                                {word.pronunciation_standard && (
                                                    <span className="text-white/50">
                                                        <span className="text-white/30">MSA:</span> {word.pronunciation_standard}
                                                    </span>
                                                )}
                                                {word.pronunciation_egyptian && (
                                                    <span className="text-white/50">
                                                        <span className="text-white/30">Egyptian:</span> {word.pronunciation_egyptian}
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {/* Translation */}
                                        <p className="text-white/80">{word.translation}</p>

                                        {/* Context preview */}
                                        {word.contexts && word.contexts.length > 0 && (
                                            <p className="text-white/40 text-sm mt-2 truncate">
                                                "{word.contexts[0].full_translation}"
                                            </p>
                                        )}
                                    </div>

                                    {/* Actions (not in selection mode) */}
                                    {!selectionMode && (
                                        <div className="flex flex-col gap-1">
                                            <button
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    updateStatus(word.id, word.status === 'learned' ? 'active' : 'learned');
                                                }}
                                                className={`touch-btn w-10 h-10 flex items-center justify-center rounded-lg transition-colors ${
                                                    word.status === 'learned' 
                                                        ? 'bg-green-500/20 text-green-400' 
                                                        : 'bg-white/5 text-white/30 hover:text-green-400'
                                                }`}
                                                aria-label={word.status === 'learned' ? 'Mark as active' : 'Mark as learned'}
                                            >
                                                <svg className="w-5 h-5" fill={word.status === 'learned' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </main>

            {/* Selection Mode Action Bar */}
            {selectionMode && (
                <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-surface-300 via-surface-300 to-transparent pt-12">
                    <button
                        onClick={startPractice}
                        disabled={selectedIds.size === 0}
                        className="w-full py-4 btn-primary font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Practice {selectedIds.size > 0 ? `${selectedIds.size} words` : 'selected words'}
                    </button>
                </div>
            )}

            {/* Word Detail Modal - Uses shared WordDetailCard for consistent display */}
            {selectedWord && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
                    onClick={() => setSelectedWord(null)}
                >
                    <div
                        className="w-full max-w-md bg-surface-300 rounded-2xl p-6 max-h-[85vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header with status badge and close button */}
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <StatusBadge status={selectedWord.status} />
                                {selectedWord.topic && (
                                    <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-white/10 text-white/50">
                                        {selectedWord.topic}
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={() => setSelectedWord(null)}
                                className="text-white/50 hover:text-white"
                                aria-label="Close"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Unified WordDetailCard - same as exercise feedback */}
                        <WordDetailCard
                            word={selectedWord.word}
                            translation={selectedWord.translation}
                            language="arabic"
                            pronunciationStandard={selectedWord.pronunciation_standard || undefined}
                            pronunciationEgyptian={selectedWord.pronunciation_egyptian || undefined}
                            hebrewCognate={selectedWord.hebrew_cognate}
                            exampleSentences={selectedWord.example_sentences || undefined}
                        />

                        {/* Source Contexts - unique to vocabulary view */}
                        {selectedWord.contexts && selectedWord.contexts.length > 0 && (
                            <div className="glass-card p-4 mt-4">
                                <div className="text-purple-400/70 text-xs font-bold uppercase tracking-wider mb-3">
                                    Found In
                                </div>
                                <div className="space-y-3">
                                    {selectedWord.contexts.map((ctx, idx) => (
                                        <div key={idx} className="bg-white/5 rounded-lg p-3">
                                            <div className="text-white font-arabic text-lg mb-1" dir="rtl">
                                                {ctx.full_text}
                                            </div>
                                            {ctx.full_transliteration && (
                                                <div className="text-white/50 text-sm italic mb-1">
                                                    {ctx.full_transliteration}
                                                </div>
                                            )}
                                            <div className="text-white/70 text-sm">
                                                {ctx.full_translation}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => {
                                    const newStatus = selectedWord.status === 'learned' ? 'active' : 'learned';
                                    updateStatus(selectedWord.id, newStatus);
                                    setSelectedWord({ ...selectedWord, status: newStatus });
                                }}
                                className={`flex-1 py-3 rounded-xl font-medium transition-colors ${
                                    selectedWord.status === 'learned'
                                        ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                                        : 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                                }`}
                            >
                                {selectedWord.status === 'learned' ? 'Mark as Active' : 'Mark as Learned'}
                            </button>
                            <button
                                onClick={() => {
                                    deleteWord(selectedWord.id);
                                    setSelectedWord(null);
                                }}
                                className="px-4 py-3 bg-red-500/20 text-red-300 rounded-xl font-medium hover:bg-red-500/30"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Add Button */}
            {!selectionMode && (
                <button
                    onClick={() => setShowLookup(true)}
                    className="fixed bottom-24 right-4 w-14 h-14 btn-primary rounded-full shadow-lg flex items-center justify-center z-40"
                    aria-label="Look up word"
                >
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                </button>
            )}

            {/* Lookup Modal */}
            <LookupModal 
                isOpen={showLookup} 
                onClose={() => {
                    setShowLookup(false);
                    refetch();  // Refresh list after adding words
                }} 
            />
        </div>
    );
}
