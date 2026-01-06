import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSavedSentences, type SavedSentence } from '../../hooks/useSavedSentences';
import { generateMemoryImage } from '../../lib/openai';

// Shared dialect preference key (same as LookupView)
const DIALECT_PREFERENCE_KEY = 'language-app-dialect-preference';

/**
 * MySentencesView - Browse and practice saved spoken Arabic sentences.
 * Shows Egyptian Arabic phrases for everyday conversation practice.
 */
export function MySentencesView() {
    const navigate = useNavigate();
    const { sentences, loading, counts, deleteSentence, updateStatus, updateMemoryAids } = useSavedSentences();
    const [selectedSentence, setSelectedSentence] = useState<SavedSentence | null>(null);
    const [filter, setFilter] = useState<'all' | 'active' | 'learned'>('all');
    
    // Memory aids state
    const [editingNote, setEditingNote] = useState(false);
    const [noteText, setNoteText] = useState('');
    const [generatingImage, setGeneratingImage] = useState(false);
    
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
                    onClick={() => navigate('/')}
                    className="touch-btn w-10 h-10 flex items-center justify-center rounded-xl bg-white/10"
                    aria-label="Back to menu"
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
                    // Show preferred dialect first
                    const primaryArabic = dialectPreference === 'egyptian'
                        ? (sentence.arabic_egyptian || sentence.arabic_text)
                        : (sentence.arabic_text || sentence.arabic_egyptian);
                    const primaryTranslit = dialectPreference === 'egyptian'
                        ? (sentence.transliteration_egyptian || sentence.transliteration)
                        : (sentence.transliteration || sentence.transliteration_egyptian);
                    
                    return (
                        <button
                            key={sentence.id}
                            onClick={() => setSelectedSentence(sentence)}
                            className="w-full text-left glass-card p-4 hover:bg-white/10 transition-colors"
                        >
                            {/* Arabic text */}
                            <div className="text-xl font-arabic text-white mb-2" dir="rtl">
                                {primaryArabic}
                            </div>
                            
                            {/* Transliteration */}
                            <div className={`text-sm mb-1 ${dialectPreference === 'egyptian' ? 'text-amber-300/70' : 'text-teal-300/70'}`}>
                                {primaryTranslit}
                            </div>
                            
                            {/* Translation */}
                            <div className="text-white/80">
                                {sentence.translation}
                            </div>
                            
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
                        </button>
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
                            {/* Primary dialect (based on preference) */}
                            {dialectPreference === 'egyptian' ? (
                                <>
                                    {/* Egyptian first */}
                                    <div className="text-center">
                                        <div className="text-xs text-amber-400/60 mb-1">🇪🇬 Egyptian (Spoken)</div>
                                        <div className="text-2xl font-arabic text-white mb-2" dir="rtl">
                                            {selectedSentence.arabic_egyptian || selectedSentence.arabic_text}
                                        </div>
                                        <div className="text-amber-300 text-lg">
                                            {selectedSentence.transliteration_egyptian || selectedSentence.transliteration}
                                        </div>
                                    </div>
                                    {/* MSA as reference */}
                                    {selectedSentence.arabic_egyptian && (
                                        <div className="glass-card p-3 text-center">
                                            <div className="text-xs text-teal-400/60 mb-1">📖 MSA (Formal)</div>
                                            <div className="text-lg font-arabic text-white/70" dir="rtl">
                                                {selectedSentence.arabic_text}
                                            </div>
                                            <div className="text-teal-300/60 text-sm">
                                                {selectedSentence.transliteration}
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <>
                                    {/* MSA first */}
                                    <div className="text-center">
                                        <div className="text-xs text-teal-400/60 mb-1">📖 MSA (Formal)</div>
                                        <div className="text-2xl font-arabic text-white mb-2" dir="rtl">
                                            {selectedSentence.arabic_text || selectedSentence.arabic_egyptian}
                                        </div>
                                        <div className="text-teal-300 text-lg">
                                            {selectedSentence.transliteration || selectedSentence.transliteration_egyptian}
                                        </div>
                                    </div>
                                    {/* Egyptian as reference */}
                                    {selectedSentence.arabic_egyptian && (
                                        <div className="glass-card p-3 text-center">
                                            <div className="text-xs text-amber-400/60 mb-1">🇪🇬 Egyptian (Spoken)</div>
                                            <div className="text-lg font-arabic text-white/70" dir="rtl">
                                                {selectedSentence.arabic_egyptian}
                                            </div>
                                            <div className="text-amber-300/60 text-sm">
                                                {selectedSentence.transliteration_egyptian}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {/* Translation */}
                            <div className="text-center">
                                <div className="text-white text-lg">
                                    {selectedSentence.translation}
                                </div>
                            </div>

                            {/* Explanation */}
                            {selectedSentence.explanation && (
                                <div className="glass-card p-3">
                                    <div className="text-xs text-white/40 mb-1">💡 Notes</div>
                                    <div className="text-white/70 text-sm">
                                        {selectedSentence.explanation}
                                    </div>
                                </div>
                            )}

                            {/* Memory Aids Section */}
                            <div className="glass-card p-3">
                                <div className="text-purple-400/70 text-xs font-bold uppercase tracking-wider mb-3">
                                    🧠 Memory Aids
                                </div>
                                
                                {/* Memory Image */}
                                <div className="mb-3">
                                    {selectedSentence.memory_image_url ? (
                                        <img 
                                            src={selectedSentence.memory_image_url} 
                                            alt="Memory aid"
                                            className="w-full h-32 object-cover rounded-lg"
                                        />
                                    ) : (
                                        <button
                                            onClick={async () => {
                                                setGeneratingImage(true);
                                                try {
                                                    const imageData = await generateMemoryImage(
                                                        selectedSentence.arabic_egyptian || selectedSentence.arabic_text,
                                                        selectedSentence.translation
                                                    );
                                                    if (imageData) {
                                                        const dataUrl = `data:image/png;base64,${imageData}`;
                                                        await updateMemoryAids(selectedSentence.id, { memory_image_url: dataUrl });
                                                        setSelectedSentence({ ...selectedSentence, memory_image_url: dataUrl });
                                                    }
                                                } catch (err) {
                                                    console.error('Failed to generate image:', err);
                                                    alert('Failed to generate image.');
                                                } finally {
                                                    setGeneratingImage(false);
                                                }
                                            }}
                                            disabled={generatingImage}
                                            className="w-full py-3 border-2 border-dashed border-white/20 rounded-lg text-white/50 hover:border-purple-500/50 hover:text-purple-300 transition-colors text-sm"
                                        >
                                            {generatingImage ? '⏳ Generating...' : '🎨 Generate Visual'}
                                        </button>
                                    )}
                                </div>

                                {/* Memory Note */}
                                {editingNote ? (
                                    <div className="space-y-2">
                                        <textarea
                                            value={noteText}
                                            onChange={(e) => setNoteText(e.target.value)}
                                            placeholder="Add a note to help remember..."
                                            className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 resize-none text-sm"
                                            rows={2}
                                            autoFocus
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                onClick={async () => {
                                                    await updateMemoryAids(selectedSentence.id, { memory_note: noteText || undefined });
                                                    setSelectedSentence({ ...selectedSentence, memory_note: noteText || undefined });
                                                    setEditingNote(false);
                                                }}
                                                className="flex-1 py-1.5 bg-purple-500/20 text-purple-300 rounded-lg text-xs"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={() => setEditingNote(false)}
                                                className="px-3 py-1.5 bg-white/10 text-white/50 rounded-lg text-xs"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => {
                                            setNoteText(selectedSentence.memory_note || '');
                                            setEditingNote(true);
                                        }}
                                        className="w-full text-left p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                                    >
                                        {selectedSentence.memory_note ? (
                                            <div className="text-white/80 text-sm">{selectedSentence.memory_note}</div>
                                        ) : (
                                            <div className="text-white/40 text-sm italic">+ Add a memory note...</div>
                                        )}
                                    </button>
                                )}
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
