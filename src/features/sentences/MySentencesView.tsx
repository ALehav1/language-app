import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSavedSentences, type SavedSentence } from '../../hooks/useSavedSentences';
import { useLanguage } from '../../contexts/LanguageContext';
import { MemoryAidEditor } from '../../components/MemoryAidEditor';
import { SentenceDisplay, type ArabicSentenceData } from '../../components/SentenceDisplay';

// Shared dialect preference key (same as LookupView)
const DIALECT_PREFERENCE_KEY = 'language-app-dialect-preference';

/**
 * MySentencesView - Browse and practice saved spoken Arabic sentences.
 * Shows Egyptian Arabic phrases for everyday conversation practice.
 */
export function MySentencesView() {
    const navigate = useNavigate();
    const { language } = useLanguage();
    const [searchParams] = useSearchParams();
    const mode = searchParams.get('mode') || 'practice';
    const { sentences, loading, counts, deleteSentence, updateStatus, updateMemoryAids } = useSavedSentences(language);
    const [selectedSentence, setSelectedSentence] = useState<SavedSentence | null>(null);
    const defaultFilter: 'all' | 'active' | 'learned' = mode === 'archive' ? 'learned' : 'active';
    const [filter, setFilter] = useState<'all' | 'active' | 'learned'>(defaultFilter);
    
    // Dialect preference (shared with Lookup)
    const [dialectPreference, setDialectPreference] = useState<'egyptian' | 'standard'>(() => {
        const saved = localStorage.getItem(DIALECT_PREFERENCE_KEY);
        return (saved === 'standard') ? 'standard' : 'egyptian';
    });
    
    useEffect(() => {
        localStorage.setItem(DIALECT_PREFERENCE_KEY, dialectPreference);
    }, [dialectPreference]);

    // Filter sentences
    const filteredSentences = sentences.filter(s => {
        if (filter === 'all') return true;
        return s.status === filter;
    });

    // Handle delete with confirmation
    const handleDelete = async (id: string) => {
        if (confirm('Delete this sentence?')) {
            await deleteSentence(id);
            setSelectedSentence(null);
        }
    };

    // Handle marking as learned
    const handleToggleStatus = async (sentence: SavedSentence) => {
        const newStatus = sentence.status === 'active' ? 'learned' : 'active';
        await updateStatus(sentence.id, newStatus);
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
                        <div key={i} className="h-24 bg-white/10 rounded-xl skeleton-shimmer" />
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
                    aria-label="Back to vocabulary"
                >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <div className="text-center flex-1">
                    <h1 className="text-xl font-bold text-white">My Sentences</h1>
                    <p className="text-white/50 text-sm">{counts.total} phrases • {counts.active} active</p>
                </div>
                <button
                    onClick={() => navigate('/lookup')}
                    className="touch-btn w-10 h-10 flex items-center justify-center rounded-xl bg-white/10"
                    aria-label="Add sentence"
                >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                </button>
            </header>

            {/* Filter tabs */}
            {sentences.length > 0 && (
                <div className="flex gap-2 mb-4">
                    {(['all', 'active', 'learned'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                filter === f
                                    ? 'bg-purple-500/30 text-purple-300'
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

            {/* Empty state */}
            {sentences.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="text-6xl mb-4">💬</div>
                    <h2 className="text-xl font-bold text-white mb-2">No sentences yet</h2>
                    <p className="text-white/50 text-center mb-6 max-w-xs">
                        Save spoken Arabic phrases from Lookup to practice them here
                    </p>
                    <button
                        onClick={() => navigate('/lookup')}
                        className="btn-primary px-6 py-3 rounded-xl font-semibold"
                    >
                        Go to Lookup
                    </button>
                </div>
            )}

            {/* Dialect toggle */}
            <div className="flex items-center gap-2 mb-4">
                <span className="text-xs text-white/40">Show:</span>
                <button
                    onClick={() => setDialectPreference('egyptian')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                        dialectPreference === 'egyptian'
                            ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                            : 'bg-white/5 text-white/50 hover:bg-white/10'
                    }`}
                >
                    🇪🇬 Egyptian
                </button>
                <button
                    onClick={() => setDialectPreference('standard')}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                        dialectPreference === 'standard'
                            ? 'bg-teal-500/30 text-teal-300 border border-teal-500/50'
                            : 'bg-white/5 text-white/50 hover:bg-white/10'
                    }`}
                >
                    📖 MSA
                </button>
            </div>

            {/* Sentence list */}
            <div className="space-y-3">
                {filteredSentences.map(sentence => {
                    // Map to SentenceDisplay format
                    const sentenceData: ArabicSentenceData = {
                        arabicMsa: sentence.arabic_text,
                        arabicEgyptian: sentence.arabic_egyptian || sentence.arabic_text,
                        transliterationMsa: sentence.transliteration,
                        transliterationEgyptian: sentence.transliteration_egyptian || sentence.transliteration,
                        english: sentence.translation,
                    };
                    
                    return (
                        <div
                            key={sentence.id}
                            className="glass-card p-4 hover:bg-white/10 transition-colors cursor-pointer"
                            onClick={() => setSelectedSentence(sentence)}
                        >
                            <SentenceDisplay
                                sentence={sentenceData}
                                size="compact"
                                dialectPreference={dialectPreference}
                                showWordBreakdown={false}
                                showSaveOption={false}
                                showExplanation={false}
                            />
                            
                            {/* Status badge + memory indicators */}
                            <div className="flex items-center gap-2 mt-2">
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                    sentence.status === 'active'
                                        ? 'bg-purple-500/20 text-purple-300'
                                        : 'bg-green-500/20 text-green-300'
                                }`}>
                                    {sentence.status === 'active' ? 'Active' : 'Learned'}
                                </span>
                                {sentence.memory_image_url && (
                                    <span className="text-xs" title="Has memory visual">🖼️</span>
                                )}
                                {sentence.memory_note && (
                                    <span className="text-xs" title="Has memory note">📝</span>
                                )}
                                {sentence.topic && (
                                    <span className="text-xs px-2 py-1 rounded-full bg-white/10 text-white/50">
                                        {sentence.topic}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Sentence detail modal */}
            {selectedSentence && (
                <div 
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    onClick={() => setSelectedSentence(null)}
                >
                    <div 
                        className="w-full max-w-md bg-surface-200 rounded-2xl overflow-hidden max-h-[85vh] overflow-y-auto"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="sticky top-0 bg-surface-200 p-4 border-b border-white/10 flex items-center justify-between">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                                selectedSentence.status === 'active'
                                    ? 'bg-purple-500/20 text-purple-300'
                                    : 'bg-green-500/20 text-green-300'
                            }`}>
                                {selectedSentence.status === 'active' ? 'Active' : 'Learned'}
                            </span>
                            <button
                                onClick={() => setSelectedSentence(null)}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-white/70"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-4 space-y-4">
                            {/* Use SentenceDisplay for consistent rendering */}
                            <SentenceDisplay
                                sentence={{
                                    arabicMsa: selectedSentence.arabic_text,
                                    arabicEgyptian: selectedSentence.arabic_egyptian || selectedSentence.arabic_text,
                                    transliterationMsa: selectedSentence.transliteration,
                                    transliterationEgyptian: selectedSentence.transliteration_egyptian || selectedSentence.transliteration,
                                    english: selectedSentence.translation,
                                }}
                                size="large"
                                dialectPreference={dialectPreference}
                                showWordBreakdown={false}
                                showSaveOption={false}
                                showExplanation={false}
                            />

                            {/* Explanation */}
                            {selectedSentence.explanation && (
                                <div className="glass-card p-3">
                                    <div className="text-xs text-white/50 mb-1">Grammar Note</div>
                                    <div className="text-white/80">
                                        {selectedSentence.explanation}
                                    </div>
                                </div>
                            )}

                            {/* Memory Aids Section */}
                            <div className="glass-card p-3">
                                <MemoryAidEditor
                                    primaryText={selectedSentence.arabic_egyptian || selectedSentence.arabic_text}
                                    translation={selectedSentence.translation}
                                    currentImageUrl={selectedSentence.memory_image_url}
                                    currentNote={selectedSentence.memory_note}
                                    onImageGenerated={async (imageUrl) => {
                                        await updateMemoryAids(selectedSentence.id, { memory_image_url: imageUrl });
                                        setSelectedSentence({ ...selectedSentence, memory_image_url: imageUrl });
                                    }}
                                    onNoteChanged={async (note) => {
                                        await updateMemoryAids(selectedSentence.id, { memory_note: note || undefined });
                                        setSelectedSentence({ ...selectedSentence, memory_note: note });
                                    }}
                                    compact
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="p-4 border-t border-white/10 flex gap-3">
                            <button
                                onClick={() => handleToggleStatus(selectedSentence)}
                                className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${
                                    selectedSentence.status === 'active'
                                        ? 'bg-green-500/20 text-green-300 hover:bg-green-500/30'
                                        : 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30'
                                }`}
                            >
                                {selectedSentence.status === 'active' ? '✓ Mark Learned' : '↺ Mark Active'}
                            </button>
                            <button
                                onClick={() => handleDelete(selectedSentence.id)}
                                className="px-4 py-3 rounded-xl bg-red-500/20 text-red-300 hover:bg-red-500/30"
                            >
                                🗑
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
