import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSavedPassages, type SavedPassage } from '../../hooks/useSavedPassages';
import { useLanguage } from '../../contexts/LanguageContext';
import { MemoryAidEditor } from '../../components/MemoryAidEditor';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { SentenceDetailModal } from '../../components/modals/SentenceDetailModal';
import type { SentenceSelectionContext } from '../../types/selection';
import { makeSentenceSelection } from '../../types/selection-helpers';
import { splitSentences } from '../../utils/text/splitSentences';

/**
 * MyPassagesView - Browse and review saved full passages.
 * Shows both Arabic and English passages with full breakdowns.
 */
export function MyPassagesView() {
    const navigate = useNavigate();
    const { language, dialectPreferences, setArabicDialect } = useLanguage();
    const [searchParams] = useSearchParams();
    const mode = searchParams.get('mode') || 'practice';
    const { passages, loading, counts, deletePassage, updateStatus, updateMemoryAids } = useSavedPassages(language);
    const [selectedPassage, setSelectedPassage] = useState<SavedPassage | null>(null);
    const defaultFilter: 'all' | 'active' | 'learned' = mode === 'archive' ? 'learned' : 'active';
    const [filter, setFilter] = useState<'all' | 'active' | 'learned'>(defaultFilter);
    
    // Dialect preference from global context
    const dialectPreference = dialectPreferences.arabic;

    // Delete confirmation state
    const [passageToDelete, setPassageToDelete] = useState<string | null>(null);

    // Sentence modal state
    const [sentenceModalOpen, setSentenceModalOpen] = useState(false);
    const [sentenceSelection, setSentenceSelection] = useState<SentenceSelectionContext | null>(null);

    // Filter passages
    const filteredPassages = passages.filter(p => {
        if (filter === 'all') return true;
        return p.status === filter;
    });

    // Handle delete with confirmation
    const handleDelete = (id: string) => {
        setPassageToDelete(id);
    };

    const confirmDelete = async () => {
        if (passageToDelete) {
            await deletePassage(passageToDelete);
            setSelectedPassage(null);
            setPassageToDelete(null);
        }
    };

    // Handle marking as learned
    const handleToggleStatus = async (passage: SavedPassage) => {
        const newStatus = passage.status === 'active' ? 'learned' : 'active';
        await updateStatus(passage.id, newStatus);
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-surface-300 p-4">
                <header className="flex items-center gap-4 mb-6">
                    <div className="w-10 h-10 bg-white/10 rounded-xl skeleton-shimmer" />
                    <div className="h-6 w-32 bg-white/10 rounded skeleton-shimmer" />
                </header>
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-32 bg-white/10 rounded-xl skeleton-shimmer" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface-300 p-4 pb-24">
            {/* Header */}
            <header className="flex items-center justify-between mb-4">
                <button
                    onClick={() => navigate('/vocabulary')}
                    className="touch-btn w-10 h-10 flex items-center justify-center rounded-xl bg-white/10"
                    aria-label="Back to menu"
                >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <div className="text-center flex-1">
                    <h1 className="text-xl font-bold text-white">My Passages</h1>
                    <p className="text-white/50 text-sm">{counts.total} passages • {counts.active} active</p>
                </div>
                <button
                    onClick={() => navigate('/lookup')}
                    className="touch-btn w-10 h-10 flex items-center justify-center rounded-xl bg-white/10"
                    aria-label="Add passage"
                >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                </button>
            </header>

            {/* Filter tabs */}
            {passages.length > 0 && (
                <div className="flex gap-2 mb-4">
                    {(['all', 'active', 'learned'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                filter === f
                                    ? 'bg-rose-500/30 text-rose-300'
                                    : 'bg-white/10 text-white/50 hover:bg-white/20'
                            }`}
                        >
                            {f === 'all' ? 'All' : f === 'active' ? 'Active' : 'Learned'}
                            {f === 'all' && ` (${counts.total})`}
                            {f === 'active' && ` (${counts.active})`}
                            {f === 'learned' && ` (${counts.learned})`}
                        </button>
                    ))}
                </div>
            )}

            {/* Dialect toggle - Arabic only */}
            {passages.length > 0 && language === 'arabic' && (
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs text-white/40">Show:</span>
                    <button
                        onClick={() => setArabicDialect('egyptian')}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                            dialectPreference === 'egyptian'
                                ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                                : 'bg-white/5 text-white/50 hover:bg-white/10'
                        }`}
                    >
                        🇪🇬 Egyptian
                    </button>
                    <button
                        onClick={() => setArabicDialect('standard')}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                            dialectPreference === 'standard'
                                ? 'bg-teal-500/30 text-teal-300 border border-teal-500/50'
                                : 'bg-white/5 text-white/50 hover:bg-white/10'
                        }`}
                    >
                        📖 MSA
                    </button>
                </div>
            )}

            {/* Empty state */}
            {passages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="text-6xl mb-4">📄</div>
                    <h2 className="text-xl font-bold text-white mb-2">No passages yet</h2>
                    <p className="text-white/50 text-center mb-6 max-w-xs">
                        Save full Arabic or English passages from Lookup to review them here
                    </p>
                    <button
                        onClick={() => navigate('/lookup')}
                        className="btn-primary px-6 py-3 rounded-xl font-semibold"
                    >
                        Go to Lookup
                    </button>
                </div>
            )}

            {/* Passage list */}
            <div className="space-y-3">
                {filteredPassages.map(passage => (
                    <button
                        key={passage.id}
                        onClick={() => setSelectedPassage(passage)}
                        className="w-full text-left glass-card p-4 hover:bg-white/10 transition-colors"
                    >
                        {/* Language badge */}
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                                passage.source_language === 'english'
                                    ? 'bg-blue-500/20 text-blue-300'
                                    : 'bg-teal-500/20 text-teal-300'
                            }`}>
                                {passage.source_language === 'english' ? '🇺🇸 EN → AR' : '🇪🇬 AR → EN'}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                                passage.status === 'active'
                                    ? 'bg-rose-500/20 text-rose-300'
                                    : 'bg-green-500/20 text-green-300'
                            }`}>
                                {passage.status === 'active' ? 'Active' : 'Learned'}
                            </span>
                            {passage.memory_image_url && (
                                <span className="text-xs" title="Has memory visual">🖼️</span>
                            )}
                            {passage.memory_note && (
                                <span className="text-xs" title="Has memory note">📝</span>
                            )}
                        </div>

                        {/* Original text (truncated) */}
                        <div className={`text-lg text-white mb-2 line-clamp-2 ${
                            passage.source_language === 'arabic' ? 'font-arabic' : ''
                        }`} dir={passage.source_language === 'arabic' ? 'rtl' : 'ltr'}>
                            {passage.original_text}
                        </div>
                        
                        {/* Translation (truncated) */}
                        <div className="text-white/60 text-sm line-clamp-1">
                            {passage.full_translation}
                        </div>
                    </button>
                ))}
            </div>

            {/* Passage detail modal */}
            {selectedPassage && (
                <div 
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    onClick={() => setSelectedPassage(null)}
                >
                    <div 
                        className="w-full max-w-lg bg-surface-200 rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="sticky top-0 bg-surface-200 p-4 border-b border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                    selectedPassage.source_language === 'english'
                                        ? 'bg-blue-500/20 text-blue-300'
                                        : 'bg-teal-500/20 text-teal-300'
                                }`}>
                                    {selectedPassage.source_language === 'english' ? '🇺🇸 EN → AR' : '🇪🇬 AR → EN'}
                                </span>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                    selectedPassage.status === 'active'
                                        ? 'bg-rose-500/20 text-rose-300'
                                        : 'bg-green-500/20 text-green-300'
                                }`}>
                                    {selectedPassage.status === 'active' ? 'Active' : 'Learned'}
                                </span>
                            </div>
                            <button
                                onClick={() => setSelectedPassage(null)}
                                className="min-w-[48px] min-h-[48px] flex items-center justify-center rounded-full bg-white/10 text-white/70"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-4 space-y-4">
                            {/* Original text - with sentence-level clicking for multi-sentence passages */}
                            <div>
                                <div className="text-xs text-white/40 mb-2">
                                    {selectedPassage.source_language === 'english' ? '🇺🇸 Original (English)' : '🇪🇬 Original (Arabic)'}
                                </div>
                                {(() => {
                                    const language = selectedPassage.source_language === 'arabic' ? 'arabic' : 'spanish';
                                    const sentences = splitSentences(selectedPassage.original_text, language);
                                    
                                    // If single sentence, render as non-clickable text
                                    if (sentences.length === 1) {
                                        return (
                                            <div className={`text-lg text-white ${
                                                selectedPassage.source_language === 'arabic' ? 'font-arabic' : ''
                                            }`} dir={selectedPassage.source_language === 'arabic' ? 'rtl' : 'ltr'}>
                                                {selectedPassage.original_text}
                                            </div>
                                        );
                                    }
                                    
                                    // Multi-sentence: make each sentence clickable
                                    return (
                                        <div className="space-y-2">
                                            {sentences.map((sentence, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => {
                                                        setSentenceSelection(makeSentenceSelection(language, {
                                                            selectedSentence: sentence.text,
                                                            parentPassage: selectedPassage.original_text,
                                                            sourceView: 'vocab',
                                                            dialect: selectedPassage.source_language === 'arabic' ? dialectPreference : undefined,
                                                            contentType: 'passage',
                                                        }));
                                                        setSentenceModalOpen(true);
                                                    }}
                                                    className={`w-full text-left p-3 rounded-xl bg-white/5 hover:bg-amber-500/20 transition-colors text-lg text-white ${
                                                        selectedPassage.source_language === 'arabic' ? 'font-arabic' : ''
                                                    }`}
                                                    dir={selectedPassage.source_language === 'arabic' ? 'rtl' : 'ltr'}
                                                >
                                                    {sentence.text}
                                                </button>
                                            ))}
                                        </div>
                                    );
                                })()}
                            </div>

                            {/* Translation */}
                            <div className="glass-card p-3">
                                <div className="text-xs text-white/40 mb-2">
                                    {selectedPassage.source_language === 'english' ? '🇪🇬 Arabic Translation' : '🇺🇸 English Translation'}
                                </div>
                                <div className={`text-white ${
                                    selectedPassage.source_language === 'english' ? 'font-arabic text-xl' : ''
                                }`} dir={selectedPassage.source_language === 'english' ? 'rtl' : 'ltr'}>
                                    {selectedPassage.full_translation}
                                </div>
                            </div>

                            {/* Transliteration */}
                            {selectedPassage.full_transliteration && (
                                <div>
                                    <div className="text-xs text-white/40 mb-1">📝 Transliteration</div>
                                    <div className="text-amber-300">
                                        {selectedPassage.full_transliteration}
                                    </div>
                                </div>
                            )}

                            {/* Memory Aids Section */}
                            <div className="glass-card p-3">
                                <MemoryAidEditor
                                    primaryText={selectedPassage.original_text.slice(0, 100)}
                                    translation={selectedPassage.full_translation.slice(0, 100)}
                                    currentImageUrl={selectedPassage.memory_image_url}
                                    currentNote={selectedPassage.memory_note}
                                    onImageGenerated={async (imageUrl) => {
                                        await updateMemoryAids(selectedPassage.id, { memory_image_url: imageUrl });
                                        setSelectedPassage({ ...selectedPassage, memory_image_url: imageUrl });
                                    }}
                                    onNoteChanged={async (note) => {
                                        await updateMemoryAids(selectedPassage.id, { memory_note: note || undefined });
                                        setSelectedPassage({ ...selectedPassage, memory_note: note });
                                    }}
                                    compact
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="p-4 border-t border-white/10 flex gap-3">
                            <button
                                onClick={() => handleToggleStatus(selectedPassage)}
                                className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${
                                    selectedPassage.status === 'active'
                                        ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                                        : 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30'
                                }`}
                            >
                                {selectedPassage.status === 'active' ? '✓ Mark Learned' : '↺ Mark Active'}
                            </button>
                            <button
                                onClick={() => handleDelete(selectedPassage.id)}
                                className="px-4 py-3 rounded-xl bg-red-500/20 text-red-300 hover:bg-red-500/30"
                            >
                                🗑
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Sentence Detail Modal */}
            {sentenceSelection && (
                <SentenceDetailModal
                    isOpen={sentenceModalOpen}
                    onClose={() => {
                        setSentenceModalOpen(false);
                        setSentenceSelection(null);
                    }}
                    selection={sentenceSelection}
                />
            )}

            {/* Delete confirmation dialog */}
            <ConfirmDialog
                isOpen={passageToDelete !== null}
                title="Delete Passage"
                message="Are you sure you want to delete this passage? This action cannot be undone."
                confirmLabel="Delete"
                variant="danger"
                onConfirm={confirmDelete}
                onCancel={() => setPassageToDelete(null)}
            />
        </div>
    );
}
