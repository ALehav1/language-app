import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { lookupWord, analyzePassage, type LookupResult, type PassageResult } from '../../lib/openai';
import { useSavedWords } from '../../hooks/useSavedWords';
import { useSavedSentences } from '../../hooks/useSavedSentences';
import { useSavedPassages } from '../../hooks/useSavedPassages';
import { WordSurface } from '../../components/surfaces/WordSurface';
import { SaveDecisionPanel, type SaveDecision } from '../../components/SaveDecisionPanel';
import { MemoryAidTile } from '../../components/MemoryAidTile';
import { ContextTile } from '../../components/ContextTile';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { CollapsibleSection } from '../../components/CollapsibleSection';
import { AddedContextTile } from '../../components/AddedContextTile';
import { WordBreakdownList, type WordBreakdownWord } from '../../components/WordBreakdownList';
import { useLanguage } from '../../contexts/LanguageContext';

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
    const { language, dialectPreferences, setArabicDialect } = useLanguage();
    const { saveWord, isWordSaved } = useSavedWords();
    const { saveSentence, getSentenceByText, updateStatus, deleteSentence } = useSavedSentences();
    const { savePassage, getPassageByText, updateStatus: updatePassageStatus, deletePassage } = useSavedPassages();
    
    const [input, setInput] = useState('');
    const [result, setResult] = useState<LookupResult | null>(null);
    const [passageResult, setPassageResult] = useState<PassageResult | null>(null);
    const [selectedSentence, setSelectedSentence] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [savedWords, setSavedWords] = useState<Set<string>>(new Set());
    const [mode, setMode] = useState<'word' | 'sentence' | 'passage'>('word');
    const [memoryNote, setMemoryNote] = useState<string | null>(null);
    const [memoryImageUrl, setMemoryImageUrl] = useState<string | null>(null);
    
    // Helper: extract the primary word from a lookup result based on language
    const getWordFromResult = (r: LookupResult) =>
        language === 'spanish' ? (r as any).spanish_latam : r.arabic_word;

    // Dialect preference from global context
    const dialectPreference = dialectPreferences.arabic;

    // Detect content type from input
    const detectContentType = (text: string): 'word' | 'sentence' | 'passage' => {
        const trimmed = text.trim();
        
        // CRITICAL: Check word count FIRST to catch single tokens
        const wordCount = trimmed.split(/\s+/).length;
        
        // Single token with no spaces → always word
        if (wordCount === 1) {
            return 'word';
        }
        
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
        
        // Default: if short phrase (2-4 words) without punctuation → treat as sentence
        return wordCount <= 4 ? 'sentence' : 'passage';
    };

    // Handle lookup - auto-detect word vs passage
    const handleLookup = async () => {
        // STEP 0: Hard proof signal
        console.log('[LOOKUP] Translate clicked', { language, textLength: input.length });
        console.log('[LOOKUP] Translate begin');
        
        if (!input.trim()) {
            console.warn('[LOOKUP] Empty input, aborting');
            setError('Please enter text to translate');
            return;
        }
        
        try {
            // STEP 2: Set loading state and clear previous results
            setIsLoading(true);
            setError(null);
            setResult(null);
            setPassageResult(null);

            const contentType = detectContentType(input);
            console.log('[LOOKUP] Detected content type:', contentType);
            setMode(contentType);
            setSelectedSentence(null);

            if (contentType === 'word') {
                console.log('[LOOKUP] Looking up word:', input.slice(0, 40));
                // STEP 3: Log before API call
                console.log('[LOOKUP] calling lookupWord', { language, textPreview: input.slice(0, 40) });
                const data = await lookupWord(input.trim(), { language });
                // STEP 3: Log after API call
                console.log('[LOOKUP] lookupWord returned', data);
                setResult(data);
            } else {
                // Both sentence and passage use analyzePassage
                console.log('[LOOKUP] Analyzing ${contentType}:', input.slice(0, 40));
                // STEP 3: Log before API call
                console.log('[LOOKUP] calling analyzePassage', { language, contentType, textPreview: input.slice(0, 40) });
                const data = await analyzePassage(input.trim(), { language });
                // STEP 3: Log after API call
                console.log('[LOOKUP] analyzePassage returned', data);
                setPassageResult(data);
            }
            
            console.log('[LOOKUP] Translate complete successfully');
        } catch (err) {
            // STEP 4: Catch and surface all errors
            console.error('[LOOKUP] Translate failed', err);
            const errorMessage = err instanceof Error ? err.message : String(err);
            console.error('[LOOKUP] Error details:', errorMessage);
            setError('Translation failed. Please try again.');
        } finally {
            // STEP 2: Always reset loading state
            console.log('[LOOKUP] Resetting loading state');
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
            const isSpanish = language === 'spanish';
            await saveWord({
                word: isSpanish ? (result as any).spanish_latam : result.arabic_word,
                translation: isSpanish ? (result as any).translation_en : result.translation,
                pronunciation_standard: isSpanish ? ((result as any).pronunciation || null) : result.pronunciation_standard,
                pronunciation_egyptian: isSpanish ? undefined : result.pronunciation_egyptian,
                letter_breakdown: isSpanish ? undefined : result.letter_breakdown,
                hebrew_cognate: isSpanish ? undefined : result.hebrew_cognate,
                example_sentences: result.example_sentences || null,
                status: decision === 'practice' ? 'active' : 'learned', // archive = learned
                memory_note: memoryAid?.note,
                memory_image_url: memoryAid?.imageUrl,
            });
            const word = getWordFromResult(result);
            setSavedWords(prev => new Set(prev).add(word));
        } catch (err) {
            console.error('[LookupView] Failed to save word:', err);
        }
    };

    // Handle sentence click - switches to Sentence view
    const handleSentenceClick = (sentence: any) => {
        setSelectedSentence(sentence);
        setMode('sentence');
    };

    // P2-B: Handle word click - navigates to unified word detail page
    const handleWordClick = (word: WordBreakdownWord) => {
        console.log('[LOOKUP] Word chip clicked, navigating to word detail', { word, language });
        
        // Navigate to canonical /vocabulary/word route with lookup context
        // Pass word text as query param + full word data in state
        const wordText = language === 'arabic' 
            ? (word.arabic || word.arabic_egyptian || '')
            : (word.arabic || ''); // Spanish stored in .arabic field temporarily
            
        navigate(`/vocabulary/word?text=${encodeURIComponent(wordText)}&from=lookup`, {
            state: {
                wordData: word,
                language: language,
                parentSentence: selectedSentence?.arabic_msa || selectedSentence?.arabic_egyptian || passageResult?.original_text || '',
            }
        });
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
                enrichment_data: {
                    sentences: passageResult.sentences,
                    detected_language: passageResult.detected_language,
                },
                source: 'lookup',
            });
        } catch (err) {
            console.error('[LookupView] Failed to save passage:', err);
        }
    };

    // Check if current word is saved
    const currentWord = result ? getWordFromResult(result) : '';
    const isCurrentWordSaved = result ? (savedWords.has(currentWord) || isWordSaved(currentWord)) : false;

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
                    type="button"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleLookup();
                    }}
                    disabled={!input.trim() || isLoading}
                    className="w-full mt-3 py-4 btn-primary font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed select-none touch-manipulation"
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

                    {/* Full word details using WordSurface (canonical renderer) */}
                    {/* Spanish: Use SpanishLookupResult fields directly (NO Arabic overloading) */}
                    <WordSurface
                        word={language === 'spanish' ? {
                            // SpanishLookupResult fields
                            language: 'spanish' as const,
                            spanish_latam: (result as any).spanish_latam || result.arabic_word || '',
                            spanish_spain: (result as any).spanish_spain || result.arabic_word_egyptian,
                            translation: (result as any).translation_en || result.translation || '',
                            pronunciation: (result as any).pronunciation,
                            partOfSpeech: (result as any).part_of_speech,
                            wordContext: (result as any).word_context,
                            memoryAid: (result as any).memory_aid,
                            exampleSentences: (result as any).example_sentences,
                        } : {
                            // Arabic: existing fields
                            arabic: result.arabic_word,
                            arabicEgyptian: result.arabic_word_egyptian,
                            translation: result.translation,
                            transliteration: result.pronunciation_standard,
                            transliterationEgyptian: result.pronunciation_egyptian,
                            hebrewCognate: result.hebrew_cognate,
                        }}
                        language={language}
                        size={language === 'spanish' ? 'normal' : 'large'}
                        showHebrewCognate={language === 'arabic'}
                        showLetterBreakdown={language === 'arabic'}
                        showExampleSentences={true}
                        showPronunciations={language === 'arabic'}
                        showSaveOption={false}
                        dialectPreference={language === 'spanish' ? 'latam' : 'egyptian'}
                    />

                    {/* Added Context - Spanish uses SpanishWordContext */}
                    <ContextTile 
                        context={language === 'spanish' ? (result as any).word_context : result.word_context} 
                        language={language} 
                    />

                    {/* Memory Aid */}
                    <MemoryAidTile
                        primaryText={language === 'spanish' ? ((result as any).spanish_latam || result.arabic_word) : result.arabic_word}
                        translation={(result as any).translation_en || result.translation}
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
                            primaryText={language === 'spanish' ? ((result as any).spanish_latam || result.arabic_word) : result.arabic_word}
                            translation={(result as any).translation_en || result.translation}
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

            {/* Passage Results (includes single-sentence results) */}
            {passageResult && !selectedSentence && (
                <div className="space-y-6">
                    {/* Detected language badge + Save Passage button */}
                    <div className="flex items-center justify-between">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            passageResult.detected_language === 'english'
                                ? 'bg-blue-500/20 text-blue-300'
                                : language === 'spanish'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-teal-500/20 text-teal-300'
                        }`}>
                            {passageResult.detected_language === 'english'
                                ? (language === 'spanish' ? '🇺🇸 English → Spanish' : '🇺🇸 English → Arabic')
                                : (language === 'spanish' ? '🇲🇽 Spanish → English' : '🇪🇬 Arabic → English')
                            }
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

                    {/* Dialect toggle (Arabic only) */}
                    {language === 'arabic' && (
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-white/40">Show first:</span>
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

                    {/* English translation (only for non-English input) */}
                    {passageResult.detected_language !== 'english' && (
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

                            {/* Language-aware sentence rendering */}
                            {language === 'spanish' ? (
                                // Spanish mode: show Spanish text + English translation
                                <>
                                    <div className="text-2xl text-white mb-3" dir="ltr">
                                        {sentence.arabic_msa}
                                    </div>
                                </>
                            ) : (
                                // Arabic mode: show dialect variants
                                <>
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

            {/* Dev-only Debug Panel */}
            {import.meta.env.DEV && (
                <div className="fixed bottom-4 right-4 bg-black/90 text-white p-4 rounded-lg text-xs font-mono max-w-md overflow-auto max-h-96 border border-white/20">
                    <div className="font-bold mb-2 text-teal-300">🔍 Debug Panel</div>
                    <div className="space-y-1">
                        <div><span className="text-white/50">language:</span> <span className="text-amber-300">{language}</span></div>
                        <div><span className="text-white/50">mode:</span> <span className="text-purple-300">{mode}</span></div>
                        <div><span className="text-white/50">isLoading:</span> <span className="text-blue-300">{String(isLoading)}</span></div>
                        <div><span className="text-white/50">error:</span> <span className="text-red-300">{error || 'null'}</span></div>
                        <div><span className="text-white/50">hasResult:</span> <span className="text-green-300">{String(!!result)}</span></div>
                        <div><span className="text-white/50">hasPassageResult:</span> <span className="text-green-300">{String(!!passageResult)}</span></div>
                        {passageResult && (
                            <>
                                <div><span className="text-white/50">detected_language:</span> <span className="text-yellow-300">{passageResult.detected_language}</span></div>
                                <div><span className="text-white/50">sentences.length:</span> <span className="text-cyan-300">{passageResult.sentences?.length || 0}</span></div>
                                {passageResult.sentences?.[0] && (
                                    <div className="text-white/40 text-[10px] mt-1">
                                        First sentence keys: {Object.keys(passageResult.sentences[0]).join(', ')}
                                    </div>
                                )}
                            </>
                        )}
                        {result && (
                            <div className="text-white/40 text-[10px] mt-1">
                                Result keys: {Object.keys(result).slice(0, 5).join(', ')}...
                            </div>
                        )}
                        <div><span className="text-white/50">selectedSentence:</span> <span className="text-pink-300">{String(!!selectedSentence)}</span></div>
                        <div className="text-white/40 text-[10px] mt-2">
                            localStorage: {localStorage.getItem('language-app-selected-language') || 'null'}
                        </div>
                    </div>
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
        </div>
    );
}
