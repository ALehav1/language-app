import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useSavedWords } from '../../hooks/useSavedWords';
import { LookupModal } from './LookupModal';
import { WordSurface } from '../../components/surfaces/WordSurface';
import { type ArabicWordData } from '../../components/WordDisplay';
import { MemoryAidEditor } from '../../components/MemoryAidEditor';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { findHebrewCognate } from '../../utils/hebrewCognates';
import { useLanguage } from '../../contexts/LanguageContext';
import { lookupWord, type LookupResult } from '../../lib/openai';
import type { SavedWordWithContexts, WordStatus } from '../../types';
import type { SpanishWordData } from '../../types/word';

type SortOption = 'recent' | 'alphabetical' | 'alphabetical-en';

/**
 * My Saved Words - Single-word vocabulary only (not sentences/passages).
 * Filtered by selected language from global context.
 */
/**
 * Location state for transient word data from lookup flow
 */
interface TransientWordState {
    wordData?: any;  // Word data from lookup chip click
    language?: 'arabic' | 'spanish';
    parentSentence?: string;
    source?: 'lookup';
}

export function MyVocabularyView() {
    const navigate = useNavigate();
    const location = useLocation();
    const { language } = useLanguage();
    const [searchParams] = useSearchParams();
    const mode = searchParams.get('mode') || 'practice';
    const fromLookup = searchParams.get('from') === 'lookup';
    
    // Check for transient word data from lookup flow
    const transientState = location.state as TransientWordState | null;
    
    // State for filters and search - default based on mode
    const defaultStatus: WordStatus = mode === 'archive' ? 'learned' : 'active';
    const [statusFilter, setStatusFilter] = useState<WordStatus | 'all'>(defaultStatus);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<SortOption>('recent');
    const [selectedWord, setSelectedWord] = useState<SavedWordWithContexts | null>(null);
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [showLookup, setShowLookup] = useState(false);
    const [wordToDelete, setWordToDelete] = useState<{ id: string; word: string } | null>(null);

    // Fetch words with filters - now filtered by language
    const { 
        words, 
        loading, 
        error, 
        updateStatus, 
        deleteWord,
        updateMemoryAids,
        counts,
        refetch,
        saveWord,
    } = useSavedWords({
        status: statusFilter,
        searchQuery: searchQuery.trim() || undefined,
        language, // Filter by selected language
    });

    // Filter and sort words
    const filteredWords = useMemo(() => {
        if (!words) return [];
        
        // First: only single-word entries (not phrases/sentences)
        let filtered = words.filter(word => {
            // Filter by content type if available, or by word count
            const isSingleWord = word.word && word.word.trim().split(/\s+/).length === 1;
            return isSingleWord;
        });
        
        // Then: apply status filter
        filtered = filtered.filter(word => {
            if (statusFilter === 'all') return true;
            return word.status === statusFilter;
        });
        
        // Then sort
        const sorted = [...filtered];
        switch (sortBy) {
            case 'alphabetical':
                return sorted.sort((a, b) => a.word.localeCompare(b.word, language === 'arabic' ? 'ar' : 'es'));
            case 'alphabetical-en':
                return sorted.sort((a, b) => a.translation.localeCompare(b.translation, 'en'));
            case 'recent':
            default:
                return sorted; // Already sorted by created_at DESC from hook
        }
    }, [words, sortBy, statusFilter]);

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
        setSelectedIds(new Set(filteredWords.map(w => w.id)));
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
            active: 'bg-teal-500/20 text-teal-300',
            learned: 'bg-amber-500/20 text-amber-300',
        };
        
        return (
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${styles[status]}`}>
                {status === 'active' ? ' Practice' : ' Archive'}
            </span>
        );
    };

    // State for enhanced Spanish word data (fetched on demand)
    const [enhancedSpanishData, setEnhancedSpanishData] = useState<LookupResult | null>(null);
    const [isLoadingEnhanced, setIsLoadingEnhanced] = useState(false);

    // TRANSIENT WORD VIEW: When navigating from lookup chip click
    // Show word detail page instead of vocabulary list
    const wordData = fromLookup && transientState?.wordData ? transientState.wordData : null;
    const wordLanguage = transientState?.language || language;
    const isSpanish = wordLanguage === 'spanish';
    
    // P3-B: Fetch enhanced Spanish data for context/memory/examples
    useEffect(() => {
        if (!wordData || !isSpanish) return;
        const spanishWord = wordData.arabic || wordData.spanish_latam || '';
        if (!spanishWord) return;
        
        setIsLoadingEnhanced(true);
        lookupWord(spanishWord, { language: 'spanish' })
            .then(data => {
                console.log('[MyVocabularyView] Enhanced Spanish data:', data);
                setEnhancedSpanishData(data);
            })
            .catch(err => {
                console.error('[MyVocabularyView] Failed to fetch enhanced Spanish data:', err);
            })
            .finally(() => setIsLoadingEnhanced(false));
    }, [wordData, isSpanish]);
    
    if (fromLookup && wordData) {
        // Convert breakdown word data to display format
        // A4: Use SpanishLookupResult fields directly (NO Arabic field overloading)
        const spanishData = enhancedSpanishData as any; // SpanishLookupResult
        const displayWord: SpanishWordData | ArabicWordData = isSpanish ? {
            language: 'spanish' as const,
            spanish_latam: spanishData?.spanish_latam || wordData.arabic || wordData.spanish_latam || '',
            spanish_spain: spanishData?.spanish_spain || wordData.spanish_spain,
            translation: spanishData?.translation_en || wordData.translation || '',
            partOfSpeech: spanishData?.part_of_speech || wordData.part_of_speech,
            pronunciation: spanishData?.pronunciation,
            // A4: Spanish parity fields from SpanishLookupResult (proper Spanish fields)
            wordContext: spanishData?.word_context ? {
                usage_notes: spanishData.word_context.usage_notes,
                register: spanishData.word_context.register,
                latam_notes: spanishData.word_context.latam_notes,
                spain_notes: spanishData.word_context.spain_notes,
                etymology: spanishData.word_context.etymology,
            } : undefined,
            memoryAid: spanishData?.memory_aid ? {
                mnemonic: spanishData.memory_aid.mnemonic,
                visual_cue: spanishData.memory_aid.visual_cue,
            } : undefined,
            exampleSentences: spanishData?.example_sentences?.map((s: any) => ({
                spanish_latam: s.spanish_latam,
                spanish_spain: s.spanish_spain,
                english: s.english,
                explanation: s.explanation,
            })),
        } satisfies SpanishWordData : {
            arabic: wordData.arabic || '',
            translation: wordData.translation || '',
            arabicEgyptian: wordData.arabic_egyptian,
            transliteration: wordData.transliteration,
            transliterationEgyptian: wordData.transliteration_egyptian,
            partOfSpeech: wordData.part_of_speech,
        } as ArabicWordData;
        
        return (
            <div className="min-h-screen flex flex-col">
                {/* Header with back button */}
                <header className="sticky top-0 z-40 bg-surface-300/95 backdrop-blur-sm border-b border-white/10">
                    <div className="flex items-center gap-4 p-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="touch-btn w-10 h-10 bg-white/10 text-white/70 flex items-center justify-center rounded-xl"
                            aria-label="Back to lookup"
                            type="button"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div className="flex-1">
                            <h1 className="text-xl font-bold text-white">Word Details</h1>
                            <p className="text-white/50 text-sm">
                                From lookup • {isSpanish ? 'Spanish' : 'Arabic'}
                            </p>
                        </div>
                    </div>
                </header>
                
                {/* Word display using WordSurface (canonical renderer) */}
                <main className="flex-1 p-4">
                    {/* Loading indicator for enhanced Spanish data */}
                    {isSpanish && isLoadingEnhanced && (
                        <div className="text-center text-white/50 text-sm mb-4">
                            Loading word details...
                        </div>
                    )}
                    <div className="glass-card p-6">
                        <WordSurface
                            word={displayWord}
                            language={wordLanguage}
                            size="large"
                            showHebrewCognate={!isSpanish}
                            showLetterBreakdown={!isSpanish}
                            showExampleSentences={true}
                            showSaveOption={true}
                            dialectPreference={isSpanish ? 'latam' : 'egyptian'}
                            onSave={async (decision: any, memoryAid: any) => {
                                if (decision === 'discard') return;
                                try {
                                    await saveWord({
                                        word: isSpanish ? (displayWord as SpanishWordData).spanish_latam : (displayWord as ArabicWordData).arabic,
                                        translation: displayWord.translation,
                                        status: decision === 'practice' ? 'active' : 'learned',
                                        memory_note: memoryAid?.note,
                                        memory_image_url: memoryAid?.imageUrl,
                                    });
                                    // Navigate back after save
                                    navigate(-1);
                                } catch (err) {
                                    console.error('[MyVocabularyView] Failed to save word:', err);
                                }
                            }}
                        />
                    </div>
                    
                    {/* Parent sentence context */}
                    {transientState?.parentSentence && (
                        <div className="glass-card p-4 mt-4">
                            <div className="text-purple-400/70 text-xs font-bold uppercase tracking-wider mb-2">
                                Found In
                            </div>
                            <div className={`text-white ${isSpanish ? '' : 'font-arabic text-right'}`} dir={isSpanish ? 'ltr' : 'rtl'}>
                                {transientState?.parentSentence}
                            </div>
                        </div>
                    )}
                </main>
            </div>
        );
    }

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
                        onClick={() => selectionMode ? setSelectionMode(false) : navigate('/vocabulary')}
                        className="touch-btn w-10 h-10 bg-white/10 text-white/70 flex items-center justify-center rounded-xl"
                        aria-label={selectionMode ? 'Exit selection' : 'Back to vocabulary'}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-white">Words</h1>
                        {!selectionMode && (
                            <p className="text-white/50 text-sm">
                                {counts.total} words • {counts.active} active
                            </p>
                        )}
                    </div>
                    {!selectionMode && filteredWords.length > 0 && (
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
                    <>
                        {/* Status filters - Practice and Archive only */}
                        <div className="flex gap-2 px-4 pb-3 overflow-x-auto">
                            <button
                                onClick={() => setStatusFilter('active')}
                                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                                    statusFilter === 'active'
                                        ? 'bg-teal-500/30 text-teal-300 border border-teal-500/50'
                                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                                }`}
                            >
                                Practice ({counts.active})
                            </button>
                            <button
                                onClick={() => setStatusFilter('learned')}
                                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                                    statusFilter === 'learned'
                                        ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                                }`}
                            >
                                Archive ({counts.learned})
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
                    </>
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
            {filteredWords.length === 0 && !loading && (
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
                    {filteredWords.map((word) => {
                        const isSelected = selectedIds.has(word.id);

                        return (
                            <div
                                key={word.id}
                                className={`glass-card p-4 cursor-pointer transition-all ${isSelected ? 'ring-2 ring-white/50' : ''}`}
                                onClick={() => selectionMode ? toggleSelection(word.id) : setSelectedWord(word)}
                            >
                                <div className="flex flex-col">
                                    {/* Selection checkbox */}
                                    {selectionMode && (
                                        <div className="absolute top-3 right-3">
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected ? 'bg-white border-white' : 'border-white/30'}`}>
                                                {isSelected && (
                                                    <svg className="w-4 h-4 text-surface-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Center all content */}
                                    <div className="flex flex-col items-center">
                                        {/* Word content - centered */}
                                        <div className="w-full text-center mb-4">
                                            {/* Arabic word - consistent size */}
                                            <div className="text-5xl font-bold text-white mb-2 leading-tight" dir="rtl">
                                                {word.word}
                                            </div>
                                            <div className="text-lg font-medium text-white/80">
                                                {word.translation}
                                            </div>
                                            {(word.pronunciation_egyptian || word.pronunciation_standard) && (
                                                <div className="text-sm text-white/60 mt-1 font-mono">
                                                    {word.pronunciation_egyptian || word.pronunciation_standard}
                                                </div>
                                            )}
                                        </div>

                                        {/* Memory aid - centered */}
                                        {(word.memory_image_url || word.memory_note) && (
                                            <div className="flex flex-col items-center mb-4">
                                                {word.memory_image_url && (
                                                    <img 
                                                        src={word.memory_image_url} 
                                                        alt="Memory aid" 
                                                        className="w-32 h-32 rounded-lg object-cover mb-2"
                                                    />
                                                )}
                                                {word.memory_note && (
                                                    <p className="text-xs text-white/60 text-center max-w-[200px]">
                                                        {word.memory_note}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Action buttons */}
                                    {!selectionMode && (
                                        <div className="flex gap-2 mt-3 pt-3 border-t border-white/10">
                                            <button
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    updateStatus(word.id, word.status === 'learned' ? 'active' : 'learned');
                                                }}
                                                className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-colors ${
                                                    word.status === 'learned' 
                                                        ? 'bg-teal-500/20 text-teal-300 hover:bg-teal-500/30' 
                                                        : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                                                }`}
                                            >
                                                {word.status === 'learned' ? '📚 Move to Practice' : '📦 Move to Archive'}
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setWordToDelete({ id: word.id, word: word.word });
                                                }}
                                                className="px-3 py-2 bg-red-500/20 text-red-300 rounded-lg font-medium text-sm hover:bg-red-500/30 transition-colors"
                                            >
                                                🗑️ Delete
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
                        {/* Header with navigation and close button */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                {/* Previous button */}
                                <button
                                    onClick={() => {
                                        const currentIndex = filteredWords.findIndex(w => w.id === selectedWord.id);
                                        if (currentIndex > 0) {
                                            setSelectedWord(filteredWords[currentIndex - 1]);
                                        }
                                    }}
                                    disabled={filteredWords.findIndex(w => w.id === selectedWord.id) === 0}
                                    className="p-2 rounded-lg bg-white/10 text-white/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                                    aria-label="Previous word"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                                
                                {/* Next button */}
                                <button
                                    onClick={() => {
                                        const currentIndex = filteredWords.findIndex(w => w.id === selectedWord.id);
                                        if (currentIndex < filteredWords.length - 1) {
                                            setSelectedWord(filteredWords[currentIndex + 1]);
                                        }
                                    }}
                                    disabled={filteredWords.findIndex(w => w.id === selectedWord.id) === filteredWords.length - 1}
                                    className="p-2 rounded-lg bg-white/10 text-white/50 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                                    aria-label="Next word"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                                
                                <div className="ml-2">
                                    <StatusBadge status={selectedWord.status} />
                                    {selectedWord.topic && (
                                        <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-white/10 text-white/50">
                                            {selectedWord.topic}
                                        </span>
                                    )}
                                </div>
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

                        {/* Use WordSurface for consistent word rendering */}
                        <WordSurface
                            word={{
                                arabic: selectedWord.word,
                                translation: selectedWord.translation,
                                transliteration: selectedWord.pronunciation_standard || undefined,
                                transliterationEgyptian: selectedWord.pronunciation_egyptian || undefined,
                                hebrewCognate: selectedWord.hebrew_cognate || findHebrewCognate(selectedWord.word) || undefined,
                                exampleSentences: selectedWord.example_sentences || undefined,
                            } as ArabicWordData}
                            language={language}
                            size="large"
                            showHebrewCognate={language === 'arabic'}
                            showLetterBreakdown={language === 'arabic'}
                            showExampleSentences={true}
                            dialectPreference="egyptian"
                        />

                        {/* Source Contexts - unique to vocabulary view, deduplicated by full_text */}
                        {selectedWord.contexts && selectedWord.contexts.length > 0 && (() => {
                            // Deduplicate contexts by full_text
                            const uniqueContexts = selectedWord.contexts.filter(
                                (ctx, idx, arr) => arr.findIndex(c => c.full_text === ctx.full_text) === idx
                            );
                            return uniqueContexts.length > 0 ? (
                                <div className="glass-card p-4 mt-4">
                                    <div className="text-purple-400/70 text-xs font-bold uppercase tracking-wider mb-3">
                                        Found In
                                    </div>
                                    <div className="space-y-3">
                                        {uniqueContexts.map((ctx, idx) => (
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
                            ) : null;
                        })()}

                        {/* Memory Aids Section */}
                        <div className="glass-card p-4 mt-4">
                            <MemoryAidEditor
                                primaryText={selectedWord.word}
                                translation={selectedWord.translation}
                                currentImageUrl={selectedWord.memory_image_url}
                                currentNote={selectedWord.memory_note}
                                onImageGenerated={async (imageUrl) => {
                                    await updateMemoryAids(selectedWord.id, { memory_image_url: imageUrl });
                                    setSelectedWord({ ...selectedWord, memory_image_url: imageUrl });
                                }}
                                onNoteChanged={async (note) => {
                                    await updateMemoryAids(selectedWord.id, { memory_note: note || undefined });
                                    setSelectedWord({ ...selectedWord, memory_note: note });
                                }}
                            />
                        </div>

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
                                        ? 'bg-teal-500/20 text-teal-300 hover:bg-teal-500/30'
                                        : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                                }`}
                            >
                                {selectedWord.status === 'learned' ? '📚 Move to Practice' : '📦 Move to Archive'}
                            </button>
                            <button
                                onClick={() => {
                                    setWordToDelete({ id: selectedWord.id, word: selectedWord.word });
                                }}
                                className="px-4 py-3 bg-red-500/20 text-red-300 rounded-xl font-medium hover:bg-red-500/30"
                            >
                                🗑️ Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Floating Add Button */}
            {!selectionMode && (
                <button
                    onClick={() => setShowLookup(true)}
                    className="fixed bottom-6 right-6 w-14 h-14 btn-primary rounded-full shadow-lg flex items-center justify-center z-40"
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

            {/* Delete confirmation dialog */}
            <ConfirmDialog
                isOpen={!!wordToDelete}
                title="Delete Word"
                message={`Delete "${wordToDelete?.word}" from your vocabulary? This cannot be undone.`}
                confirmLabel="Delete"
                variant="danger"
                onConfirm={() => {
                    if (wordToDelete) {
                        deleteWord(wordToDelete.id);
                        if (selectedWord?.id === wordToDelete.id) {
                            setSelectedWord(null);
                        }
                    }
                    setWordToDelete(null);
                }}
                onCancel={() => setWordToDelete(null)}
            />
        </div>
    );
}
