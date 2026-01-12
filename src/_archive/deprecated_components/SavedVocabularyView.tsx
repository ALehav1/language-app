import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSavedVocabulary } from '../../hooks/useSavedVocabulary';
import { generateArabicBreakdown } from '../../utils/arabicLetters';
import type { Language, VocabularyItem } from '../../types/database';

type FilterType = 'all' | Language;

export function SavedVocabularyView() {
    const navigate = useNavigate();
    const { savedItems, loading, error, removeItem } = useSavedVocabulary();
    const [filter, setFilter] = useState<FilterType>('all');
    const [selectedItem, setSelectedItem] = useState<VocabularyItem | null>(null);
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const filteredItems = filter === 'all'
        ? savedItems
        : savedItems.filter(item => item.vocabulary_items.language === filter);

    // Letter breakdown for detail modal
    const letterBreakdown = useMemo(() => {
        if (!selectedItem) return [];
        if (selectedItem.letter_breakdown && selectedItem.letter_breakdown.length > 0) {
            return selectedItem.letter_breakdown;
        }
        if (selectedItem.language === 'arabic') {
            return generateArabicBreakdown(selectedItem.word);
        }
        return [];
    }, [selectedItem]);

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
        setSelectedIds(new Set(filteredItems.map(s => s.vocabulary_item_id)));
    };

    const clearSelection = () => {
        setSelectedIds(new Set());
    };

    const startPractice = () => {
        if (selectedIds.size === 0) return;
        const ids = Array.from(selectedIds).join(',');
        navigate(`/exercise/saved?ids=${ids}`);
    };

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
                    onClick={() => selectionMode ? setSelectionMode(false) : navigate(-1)}
                    className="touch-btn w-10 h-10 bg-white/10 text-white/70 flex items-center justify-center rounded-xl"
                    aria-label={selectionMode ? 'Exit selection' : 'Go back'}
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
                <h1 className="text-xl font-bold text-white flex-1">
                    {selectionMode ? `${selectedIds.size} selected` : 'Saved Words'}
                </h1>
                {!selectionMode && filteredItems.length > 0 && (
                    <button
                        onClick={() => { setSelectionMode(true); clearSelection(); }}
                        className="touch-btn px-4 py-2 bg-white/10 text-white/70 rounded-xl text-sm font-medium hover:bg-white/20"
                    >
                        Practice
                    </button>
                )}
            </header>

            {/* Filter tabs or Selection controls */}
            {selectionMode ? (
                <div className="flex gap-2 mb-6">
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
            )}

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
            <div className="space-y-3 pb-24">
                {filteredItems.map((saved) => {
                    const item = saved.vocabulary_items;
                    const badgeClass = item.language === 'arabic' ? 'badge-arabic' : 'badge-spanish';
                    const isSelected = selectedIds.has(saved.vocabulary_item_id);

                    return (
                        <div
                            key={saved.id}
                            className={`glass-card p-4 cursor-pointer transition-all ${isSelected ? 'ring-2 ring-white/50' : ''}`}
                            onClick={() => selectionMode ? toggleSelection(saved.vocabulary_item_id) : setSelectedItem(item)}
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
                                </div>

                                {/* Remove button (only when not in selection mode) */}
                                {!selectionMode && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
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
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

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

            {/* Word Detail Modal */}
            {selectedItem && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
                    onClick={() => setSelectedItem(null)}
                >
                    <div
                        className="w-full max-w-md bg-surface-300 rounded-2xl p-6 max-h-[80vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <button
                            onClick={() => setSelectedItem(null)}
                            className="absolute top-4 right-4 text-white/50 hover:text-white"
                            aria-label="Close"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <div className="space-y-4">
                            {/* Word + Translation */}
                            <div className="glass-card p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <span className={`text-3xl font-bold text-white ${selectedItem.language === 'arabic' ? 'font-arabic' : ''}`} dir={selectedItem.language === 'arabic' ? 'rtl' : 'ltr'}>
                                        {selectedItem.word}
                                    </span>
                                    <span className="text-white/60 text-lg">{selectedItem.translation}</span>
                                </div>
                                {selectedItem.transliteration && (
                                    <div className="flex items-center gap-2 text-white/50 text-sm">
                                        <span className="text-white/30">Pronunciation:</span>
                                        <span className="font-medium text-white/70">{selectedItem.transliteration}</span>
                                    </div>
                                )}
                            </div>

                            {/* Hebrew Cognate (Arabic only) */}
                            {selectedItem.language === 'arabic' && (
                                <div className={`glass-card p-4 space-y-2 border-l-4 ${selectedItem.hebrew_cognate ? 'border-l-blue-500/50' : 'border-l-white/10'}`}>
                                    <div className="flex items-center gap-2 text-blue-300 mb-1">
                                        <span className="text-xs font-bold uppercase tracking-wider">Hebrew Connection</span>
                                    </div>
                                    {selectedItem.hebrew_cognate ? (
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="text-2xl font-hebrew text-white mb-1">{selectedItem.hebrew_cognate.root}</div>
                                                <div className="text-sm text-white/60">{selectedItem.hebrew_cognate.meaning}</div>
                                            </div>
                                            {selectedItem.hebrew_cognate.notes && (
                                                <div className="text-xs text-white/40 max-w-[150px] text-right italic">
                                                    "{selectedItem.hebrew_cognate.notes}"
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-white/40 text-sm italic">
                                            No Hebrew cognate - this word doesn't share a Semitic root with Hebrew
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Arabic Letter Breakdown */}
                            {selectedItem.language === 'arabic' && letterBreakdown.length > 0 && (
                                <div className="glass-card p-4">
                                    <div className="text-teal-400/70 text-xs font-bold uppercase tracking-wider mb-3">Letter Breakdown</div>
                                    <div className="flex flex-row-reverse justify-center gap-2 flex-wrap-reverse">
                                        {letterBreakdown.map((l, idx) => (
                                            <div key={idx} className="flex flex-col items-center gap-1 p-3 bg-white/5 rounded-xl min-w-[70px]">
                                                <span className="text-3xl font-arabic text-white">{l.letter}</span>
                                                <span className="text-[10px] text-white/50 text-center leading-tight">{l.name}</span>
                                                <span className="text-xs text-teal-400/80 font-mono">/{l.sound}/</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Close button */}
                        <button
                            onClick={() => setSelectedItem(null)}
                            className="w-full mt-6 py-3 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
