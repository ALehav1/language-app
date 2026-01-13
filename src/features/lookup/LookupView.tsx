import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { lookupWord, analyzePassage, type LookupResult, type PassageResult } from '../../lib/openai';
import { useSavedWords } from '../../hooks/useSavedWords';
import { useSavedSentences } from '../../hooks/useSavedSentences';
import { useSavedPassages } from '../../hooks/useSavedPassages';
import { WordDisplay } from '../../components/WordDisplay';
import { SaveDecisionPanel, type SaveDecision } from '../../components/SaveDecisionPanel';
import { MemoryAidTile } from '../../components/MemoryAidTile';
import { ContextTile } from '../../components/ContextTile';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { CollapsibleSection } from '../../components/CollapsibleSection';
import { AddedContextTile } from '../../components/AddedContextTile';
import { WordBreakdownList, type WordBreakdownWord } from '../../components/WordBreakdownList';
import { WordDetailModal } from '../../components/modals/WordDetailModal';
import type { WordSelectionContext } from '../../types/selection';
import { useLanguage } from '../../contexts/LanguageContext';

// Dialect preference storage key
const DIALECT_PREFERENCE_KEY = 'language-app-dialect-preference';

/**
 * LookupView - Full-page lookup for translating Arabic/English text.
 * 
 * Features:
 * - Paste any Arabic or English text (auto-detects language)
 * - For passages: sentence-by-sentence, word-by-word breakdown
 * - Save individual words to My Words
 * - Save sentences to My Sentences
 * - Save full passages to My Passages
 */
export function LookupView() {
    const navigate = useNavigate();
    const { language } = useLanguage();
    const { saveWord, isWordSaved } = useSavedWords();
    const { saveSentence, getSentenceByText, updateStatus, deleteSentence } = useSavedSentences();
    const { savePassage, getPassageByText, updateStatus: updatePassageStatus, deletePassage } = useSavedPassages();
    
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<LookupResult | null>(null);
    const [passageResult, setPassageResult] = useState<PassageResult | null>(null);
    const [savedWords, setSavedWords] = useState<Set<string>>(new Set());
    const [mode, setMode] = useState<'word' | 'sentence' | 'passage'>('word');
    const [selectedSentence, setSelectedSentence] = useState<any | null>(null);
    const [memoryNote, setMemoryNote] = useState<string | null>(null);
    const [memoryImageUrl, setMemoryImageUrl] = useState<string | null>(null);
    
    // Word modal state
    const [wordModalOpen, setWordModalOpen] = useState(false);
    const [wordSelection, setWordSelection] = useState<WordSelectionContext | null>(null);
    
    // Dialect preference: 'egyptian' (default) or 'standard'
    const [dialectPreference, setDialectPreference] = useState<'egyptian' | 'standard'>(() => {
        const saved = localStorage.getItem(DIALECT_PREFERENCE_KEY);
        return (saved === 'standard') ? 'standard' : 'egyptian';
    });
    
    // Persist dialect preference
    useEffect(() => {
        localStorage.setItem(DIALECT_PREFERENCE_KEY, dialectPreference);
    }, [dialectPreference]);

    // Detect content type from input
    const detectContentType = (text: string): 'word' | 'sentence' | 'passage' => {
        const trimmed = text.trim();
        
        // Count sentences by splitting on sentence-ending punctuation
        const sentenceEnders = /[.؟!]\s+/g;
        const sentences = trimmed.split(sentenceEnders).filter(s => s.trim().length > 0);
        
        // If 2+ sentences → passage
        if (sentences.length >= 2) {
            return 'passage';
        }
        
        // If exactly 1 sentence (or has sentence punctuation) → sentence
        if (sentences.length === 1 || /[.؟!،]/.test(trimmed)) {
            return 'sentence';
        }
        
        // If single token (no spaces or very few words) → word
        const wordCount = trimmed.split(/\s+/).length;
        if (wordCount === 1) {
            return 'word';
        }
        
        // Default: if short phrase (2-4 words) without punctuation → treat as sentence
        return wordCount <= 4 ? 'sentence' : 'passage';
    };

    // Handle lookup - auto-detect word vs passage
    const handleLookup = async () => {
        if (!input.trim()) return;
        
        setIsLoading(true);
        setError(null);
        setResult(null);
        setPassageResult(null);

        const contentType = detectContentType(input);
        setMode(contentType);
        setSelectedSentence(null); // Reset sentence selection

        try {
            if (contentType === 'word') {
                console.log('[LookupView] Looking up word:', input);
                const data = await lookupWord(input.trim(), { language });
                console.log('[LookupView] Word result:', data);
                setResult(data);
            } else {
                // Both sentence and passage use analyzePassage
                console.log(`[LookupView] Analyzing ${contentType}:`, input);
                const data = await analyzePassage(input.trim(), { language });
                console.log(`[LookupView] ${contentType} result:`, data);
                setPassageResult(data);
            }
        } catch (err) {
            console.error('[LookupView] Error:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to analyze. Please try again.';
            console.error('[LookupView] Error details:', errorMessage);
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle save word with explicit decision (Practice/Archive/Skip)
    const handleWordDecision = async (
        decision: SaveDecision,
        memoryAid?: { note?: string; imageUrl?: string }
    ) => {
        if (!result || decision === 'discard') return;
        
        try {
            await saveWord({
                word: result.arabic_word,
                translation: result.translation,
                pronunciation_standard: result.pronunciation_standard,
                pronunciation_egyptian: result.pronunciation_egyptian,
                letter_breakdown: result.letter_breakdown,
                hebrew_cognate: result.hebrew_cognate,
                example_sentences: result.example_sentences,
                status: decision === 'practice' ? 'active' : 'learned', // archive = learned
                memory_note: memoryAid?.note,
                memory_image_url: memoryAid?.imageUrl,
            });
            setSavedWords(prev => new Set(prev).add(result.arabic_word));
        } catch (err) {
            console.error('[LookupView] Failed to save word:', err);
        }
    };

    // Handle sentence click - switches to Sentence view
    const handleSentenceClick = (sentence: any) => {
        setSelectedSentence(sentence);
        setMode('sentence');
    };

    // Handle word click - opens Word Detail modal
    const handleWordClick = (word: WordBreakdownWord) => {
        setWordSelection({
            selectedText: word.arabic || word.translation,
            parentSentence: selectedSentence?.arabic_msa || passageResult?.original_text || '',
            sourceView: 'lookup',
            language: language,
            contentType: 'word',
        } as WordSelectionContext);
        setWordModalOpen(true);
    };

    // Handle save sentence (from example sentences or passage)
    const handleSaveSentence = async (sentence: { arabic_msa: string; transliteration_msa: string; arabic_egyptian?: string; transliteration_egyptian?: string; english: string; explanation?: string }) => {
        try {
            await saveSentence({
                arabic_text: sentence.arabic_msa,
                arabic_egyptian: sentence.arabic_egyptian,
                transliteration: sentence.transliteration_msa,
                transliteration_egyptian: sentence.transliteration_egyptian,
                translation: sentence.english,
                explanation: sentence.explanation,
                source: 'lookup',
            });
        } catch (err) {
            console.error('[LookupView] Failed to save sentence:', err);
        }
    };

    // Handle save passage
    const handleSavePassage = async () => {
        if (!passageResult || !passageResult.original_text) return;
        
        try {
            await savePassage({
                original_text: passageResult.original_text,
                source_language: passageResult.detected_language || 'arabic',
                full_translation: passageResult.full_translation,
                full_transliteration: passageResult.full_transliteration,
                sentence_count: passageResult.sentences?.length || 1,
                source: 'lookup',
            });
        } catch (err) {
            console.error('[LookupView] Failed to save passage:', err);
        }
    };

    // Check if current word is saved
    const isCurrentWordSaved = result ? (savedWords.has(result.arabic_word) || isWordSaved(result.arabic_word)) : false;

    return (
        <div className="min-h-screen bg-surface-300 pb-24">
            {/* Header with back button and language switcher */}
            <header className="sticky top-0 z-10 bg-surface-300/95 backdrop-blur-sm border-b border-white/10 px-4 py-3">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span className="text-sm font-medium">Back</span>
                    </button>
                    <LanguageSwitcher />
                </div>
            </header>

            <div className="p-4">
            {/* Input area */}
            <div className="mb-6">
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={language === 'arabic' ? 'Paste Arabic text or type English...' : 'Paste Spanish text or type English...'}
                    className="w-full h-32 p-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 resize-none focus:outline-none focus:border-teal-500/50 text-lg"
                    dir="auto"
                />
                <button
                    onClick={handleLookup}
                    disabled={!input.trim() || isLoading}
                    className="w-full mt-3 py-4 btn-primary font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Translating...
                        </span>
                    ) : (
                        'Translate'
                    )}
                </button>
            </div>

            {/* Error */}
            {error && (
                <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300">
                    {error}
                </div>
            )}

            {/* Results */}
            {result && (
                <div className="space-y-4">
                    {/* Quick summary */}
                    <div className="glass-card p-4 text-center">
                        <div className="text-sm text-white/50 mb-1">
                            {language === 'arabic'
                                ? (result.detected_language === 'arabic' ? 'Arabic → English' : 'English → Arabic')
                                : (result.detected_language === 'spanish' ? 'Spanish → English' : 'English → Spanish')
                            }
                        </div>
                    </div>

                    {/* Full word details using shared component */}
                    <WordDisplay
                        word={{
                            arabic: result.arabic_word,
                            arabicEgyptian: result.arabic_word_egyptian,
                            translation: result.translation,
                            transliteration: result.pronunciation_standard,
                            transliterationEgyptian: result.pronunciation_egyptian,
                            hebrewCognate: result.hebrew_cognate,
                        }}
                        size="large"
                        showHebrewCognate={language === 'arabic'}
                        showLetterBreakdown={language === 'arabic'}
                        showExampleSentences={false}
                        showPronunciations={true}
                        dialectPreference="egyptian"
                    />

                    {/* Added Context */}
                    <ContextTile context={result.word_context} language={language} />

                    {/* Memory Aid */}
                    <MemoryAidTile
                        primaryText={result.arabic_word}
                        translation={result.translation}
                        currentNote={memoryNote}
                        currentImageUrl={memoryImageUrl}
                        onImageGenerated={setMemoryImageUrl}
                        onNoteChanged={setMemoryNote}
                    />

                    {/* Example sentences - Collapsed by default */}
                    {result.example_sentences && result.example_sentences.length > 0 && (
                        <CollapsibleSection
                            title="Example Sentences"
                            count={result.example_sentences.length}
                            defaultExpanded={false}
                        >
                            {result.example_sentences.map((sentence, idx) => {
                                        const savedSentence = getSentenceByText?.(sentence.arabic_msa);
                                        const isSaved = !!savedSentence;
                                        return (
                                            <div key={idx} className="glass-card p-3">
                                                <div className="text-white font-arabic text-2xl mb-1" dir={language === 'arabic' ? 'rtl' : 'ltr'}>
                                                    {sentence.arabic_egyptian || sentence.arabic_msa}
                                                </div>
                                                <div className="text-white/60 text-sm mb-2">
                                                    {sentence.english}
                                                </div>
                                                
                                                {isSaved && savedSentence ? (
                                                    <div className="space-y-2">
                                                        <div className="text-xs text-green-400 font-medium">
                                                            ✓ Saved to {savedSentence.status === 'active' ? 'Practice' : 'Archive'}
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => updateStatus?.(savedSentence.id, savedSentence.status === 'active' ? 'learned' : 'active')}
                                                                className="flex-1 py-2 px-3 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-xs rounded-lg transition-colors"
                                                            >
                                                                Move to {savedSentence.status === 'active' ? 'Archive' : 'Practice'}
                                                            </button>
                                                            <button
                                                                onClick={() => deleteSentence?.(savedSentence.id)}
                                                                className="py-2 px-3 bg-red-500/20 text-red-300 hover:bg-red-500/30 text-xs rounded-lg transition-colors"
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleSaveSentence(sentence)}
                                                        className="w-full py-2 rounded-lg text-sm font-medium transition-colors bg-purple-500/20 text-purple-300 hover:bg-purple-500/30"
                                                    >
                                                        💬 Save Sentence
                                                    </button>
                                                )}
                                            </div>
                                    );
                                })}
                        </CollapsibleSection>
                    )}

                    {/* Save decision panel - MOVED TO BOTTOM */}
                    <div className="glass-card p-4">
                        <SaveDecisionPanel
                            primaryText={result.arabic_word}
                            translation={result.translation}
                            onDecision={handleWordDecision}
                            alreadySaved={isCurrentWordSaved}
                        />
                    </div>
                </div>
            )}

            {/* Sentence View (when clicked from passage or directly looked up) */}
            {selectedSentence && mode === 'sentence' && (
                <div className="space-y-6">
                    {/* Back button */}
                    <button
                        onClick={() => {
                            setSelectedSentence(null);
                            setMode('passage');
                        }}
                        className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span>Back to Passage</span>
                    </button>

                    {/* Sentence Header */}
                    <div className="glass-card p-4">
                        <div className="text-3xl font-arabic text-white mb-3" dir="rtl">
                            {dialectPreference === 'egyptian' 
                                ? (selectedSentence.arabic_egyptian || selectedSentence.arabic_msa)
                                : (selectedSentence.arabic_msa || selectedSentence.arabic_egyptian)
                            }
                        </div>
                        <div className="text-white/80 text-lg mb-2">
                            {selectedSentence.translation}
                        </div>
                        {selectedSentence.explanation && (
                            <div className="text-white/60 text-sm italic mt-2">
                                {selectedSentence.explanation}
                            </div>
                        )}
                    </div>

                    {/* Added Context for Sentence */}
                    {selectedSentence.context && (
                        <AddedContextTile
                            language={language}
                            context={selectedSentence.context}
                        />
                    )}

                    {/* Word Breakdown (collapsed by default) */}
                    {selectedSentence.words && selectedSentence.words.length > 0 && (
                        <CollapsibleSection
                            title="Word Breakdown"
                            count={selectedSentence.words.length}
                            defaultExpanded={false}
                        >
                            <WordBreakdownList
                                words={selectedSentence.words}
                                language={language}
                                dialectPreference={dialectPreference}
                                onWordClick={handleWordClick}
                            />
                        </CollapsibleSection>
                    )}

                    {/* Save Sentence Controls */}
                    {(() => {
                        const savedSentence = getSentenceByText?.(selectedSentence.arabic_msa);
                        return savedSentence ? (
                            <div className="glass-card p-4 space-y-2">
                                <div className="text-xs text-green-400 font-medium">
                                    ✓ Saved to {savedSentence.status === 'active' ? 'Practice' : 'Archive'}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => updateStatus?.(savedSentence.id, savedSentence.status === 'active' ? 'learned' : 'active')}
                                        className="flex-1 py-2 px-3 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-sm rounded-lg transition-colors"
                                    >
                                        Move to {savedSentence.status === 'active' ? 'Archive' : 'Practice'}
                                    </button>
                                    <button
                                        onClick={() => deleteSentence?.(savedSentence.id)}
                                        className="py-2 px-3 bg-red-500/20 text-red-300 hover:bg-red-500/30 text-sm rounded-lg transition-colors"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="glass-card p-4">
                                <div className="text-sm text-white/60 mb-3">Save this sentence to:</div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleSaveSentence(selectedSentence)}
                                        className="flex-1 py-3 rounded-lg text-sm font-medium transition-colors bg-purple-500/20 text-purple-300 hover:bg-purple-500/30"
                                    >
                                        💬 Save to Practice
                                    </button>
                                    <button
                                        onClick={async () => {
                                            await saveSentence({
                                                arabic_text: selectedSentence.arabic_msa,
                                                arabic_egyptian: selectedSentence.arabic_egyptian,
                                                transliteration: selectedSentence.transliteration_msa,
                                                transliteration_egyptian: selectedSentence.transliteration_egyptian,
                                                translation: selectedSentence.translation,
                                                explanation: selectedSentence.explanation,
                                                source: 'lookup',
                                                status: 'learned',
                                            });
                                        }}
                                        className="flex-1 py-3 rounded-lg text-sm font-medium transition-colors bg-blue-500/20 text-blue-300 hover:bg-blue-500/30"
                                    >
                                        📚 Save to Archive
                                    </button>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            )}

            {/* Passage Results */}
            {passageResult && mode === 'passage' && (
                <div className="space-y-6">
                    {/* Detected language badge + Save Passage button (only for multi-sentence) */}
                    <div className="flex items-center justify-between">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            passageResult.detected_language === 'english'
                                ? 'bg-blue-500/20 text-blue-300'
                                : 'bg-teal-500/20 text-teal-300'
                        }`}>
                            {passageResult.detected_language === 'english' ? '🇺🇸 English → Arabic' : '🇪🇬 Arabic → English'}
                        </span>
                        {/* Save Passage controls (only for 2+ sentences) */}
                        {passageResult.sentences && passageResult.sentences.length > 1 && passageResult.original_text && (() => {
                            const savedPassage = getPassageByText?.(passageResult.original_text);
                            return savedPassage ? (
                                <div className="flex items-center gap-2">
                                    <div className="text-xs text-green-400 font-medium">
                                        ✓ Saved to {savedPassage.status === 'active' ? 'Practice' : 'Archive'}
                                    </div>
                                    <button
                                        onClick={() => updatePassageStatus?.(savedPassage.id, savedPassage.status === 'active' ? 'learned' : 'active')}
                                        className="px-3 py-1 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-xs rounded-lg transition-colors"
                                    >
                                        Move to {savedPassage.status === 'active' ? 'Archive' : 'Practice'}
                                    </button>
                                    <button
                                        onClick={() => deletePassage?.(savedPassage.id)}
                                        className="px-3 py-1 bg-red-500/20 text-red-300 hover:bg-red-500/30 text-xs rounded-lg transition-colors"
                                    >
                                        Delete
                                    </button>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleSavePassage}
                                        className="px-4 py-2 rounded-xl text-sm font-semibold transition-colors bg-purple-500/20 text-purple-300 hover:bg-purple-500/30"
                                    >
                                        📄 Save to Practice
                                    </button>
                                    <button
                                        onClick={async () => {
                                            if (!passageResult || !passageResult.original_text) return;
                                            await savePassage({
                                                original_text: passageResult.original_text,
                                                source_language: passageResult.detected_language || 'arabic',
                                                full_translation: passageResult.full_translation,
                                                full_transliteration: passageResult.full_transliteration,
                                                sentence_count: passageResult.sentences?.length || 1,
                                                source: 'lookup',
                                                status: 'learned',
                                            });
                                        }}
                                        className="px-4 py-2 rounded-xl text-sm font-semibold transition-colors bg-blue-500/20 text-blue-300 hover:bg-blue-500/30"
                                    >
                                        📄 Save to Archive
                                    </button>
                                </div>
                            );
                        })()}
                    </div>

                    {/* Dialect toggle */}
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-white/40">Show first:</span>
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

                    {/* English translation (only for Arabic input) */}
                    {passageResult.detected_language === 'arabic' && (
                        <div className="glass-card p-4">
                            <div className="text-xs text-white/40 mb-2">📝 English Translation</div>
                            <div className="text-white text-lg">
                                {passageResult.full_translation}
                            </div>
                        </div>
                    )}

                    {/* Sentence by sentence breakdown */}
                    {passageResult.sentences?.map((sentence, sentenceIdx) => (
                        <div key={sentenceIdx} className="glass-card p-4 space-y-4">
                            {/* Sentence header with save state */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-white/40">Sentence {sentenceIdx + 1}</span>
                                </div>
                                
                                {(() => {
                                    const savedSentence = getSentenceByText?.(sentence.arabic_msa);
                                    const isSaved = !!savedSentence;
                                    
                                    return isSaved && savedSentence ? (
                                        <div className="space-y-2">
                                            <div className="text-xs text-green-400 font-medium">
                                                ✓ Saved to {savedSentence.status === 'active' ? 'Practice' : 'Archive'}
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => updateStatus?.(savedSentence.id, savedSentence.status === 'active' ? 'learned' : 'active')}
                                                    className="flex-1 py-1 px-2 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-xs rounded-lg transition-colors"
                                                >
                                                    Move to {savedSentence.status === 'active' ? 'Archive' : 'Practice'}
                                                </button>
                                                <button
                                                    onClick={() => deleteSentence?.(savedSentence.id)}
                                                    className="py-1 px-2 bg-red-500/20 text-red-300 hover:bg-red-500/30 text-xs rounded-lg transition-colors"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => handleSaveSentence({
                                                arabic_msa: sentence.arabic_msa,
                                                arabic_egyptian: sentence.arabic_egyptian,
                                                transliteration_msa: sentence.transliteration_msa,
                                                transliteration_egyptian: sentence.transliteration_egyptian,
                                                english: sentence.translation,
                                                explanation: sentence.explanation,
                                            })}
                                            className="px-3 py-1 rounded-lg text-xs font-medium transition-colors bg-purple-500/20 text-purple-300 hover:bg-purple-500/30"
                                        >
                                            💬 Save Sentence
                                        </button>
                                    );
                                })()}
                            </div>

                            {/* Primary dialect (based on preference) */}
                            {dialectPreference === 'egyptian' ? (
                                <>
                                    {/* Egyptian first */}
                                    <div>
                                        <div className="text-xs text-amber-400/60 mb-1">🇪🇬 Egyptian (Spoken)</div>
                                        <div className="text-2xl font-arabic text-white" dir="rtl">
                                            {sentence.arabic_egyptian}
                                        </div>
                                        <div className="text-amber-300">
                                            {sentence.transliteration_egyptian}
                                        </div>
                                    </div>
                                    {/* MSA as reference */}
                                    <div className="bg-white/5 rounded-lg p-3">
                                        <div className="text-xs text-teal-400/60 mb-1">📖 MSA (Formal)</div>
                                        <div className="text-lg font-arabic text-white/70" dir="rtl">
                                            {sentence.arabic_msa}
                                        </div>
                                        <div className="text-teal-300/60 text-sm">
                                            {sentence.transliteration_msa}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    {/* MSA first */}
                                    <div>
                                        <div className="text-xs text-teal-400/60 mb-1">📖 MSA (Formal)</div>
                                        <div className="text-2xl font-arabic text-white" dir="rtl">
                                            {sentence.arabic_msa}
                                        </div>
                                        <div className="text-teal-300">
                                            {sentence.transliteration_msa}
                                        </div>
                                    </div>
                                    {/* Egyptian as reference */}
                                    <div className="bg-white/5 rounded-lg p-3">
                                        <div className="text-xs text-amber-400/60 mb-1">🇪🇬 Egyptian (Spoken)</div>
                                        <div className="text-lg font-arabic text-white/70" dir="rtl">
                                            {sentence.arabic_egyptian}
                                        </div>
                                        <div className="text-amber-300/60 text-sm">
                                            {sentence.transliteration_egyptian}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Translation */}
                            <div className="text-white">
                                {sentence.translation}
                            </div>

                            {/* Explanation */}
                            {sentence.explanation && (
                                <div className="text-white/50 text-sm italic">
                                    💡 {sentence.explanation}
                                </div>
                            )}

                            {/* Word-by-word breakdown - Vertical RTL */}
                            {sentence.words && sentence.words.length > 0 && (
                                <div>
                                    <div className="text-xs text-white/40 mb-2 flex items-center justify-between">
                                        <span>Word Breakdown ({sentence.words.length} words)</span>
                                        <button
                                            onClick={() => handleSentenceClick(sentence)}
                                            className="text-teal-400 hover:text-teal-300 text-xs flex items-center gap-1"
                                        >
                                            <span>View Detail</span>
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    </div>
                                    <WordBreakdownList
                                        words={sentence.words}
                                        language={language}
                                        dialectPreference={dialectPreference}
                                        onWordClick={handleWordClick}
                                    />
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Empty state */}
            {!result && !passageResult && !isLoading && !error && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="text-5xl mb-4">🔍</div>
                    <h2 className="text-lg font-semibold text-white/70 mb-2">
                        Translate anything
                    </h2>
                    <p className="text-white/40 text-sm max-w-xs">
                        Paste Arabic text to see translation, pronunciation, and word breakdown. Or type English to get the Arabic.
                    </p>
                </div>
            )}
            </div>

            {/* Word Detail Modal */}
            {wordSelection && (
                <WordDetailModal
                    isOpen={wordModalOpen}
                    onClose={() => setWordModalOpen(false)}
                    selection={wordSelection}
                />
            )}
        </div>
    );
}
