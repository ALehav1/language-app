import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { lookupWord, analyzePassage, type LookupResult, type PassageResult, type PassageWord } from '../../lib/openai';
import { useSavedWords } from '../../hooks/useSavedWords';
import { useSavedSentences } from '../../hooks/useSavedSentences';
import { useSavedPassages } from '../../hooks/useSavedPassages';
import { WordDisplay } from '../../components/WordDisplay';
import { SaveDecisionPanel, type SaveDecision } from '../../components/SaveDecisionPanel';
import { MemoryAidTile } from '../../components/MemoryAidTile';
import { ContextTile } from '../../components/ContextTile';
import { findHebrewCognate } from '../../utils/hebrewCognates';
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
    const { saveSentence, isSentenceSaved } = useSavedSentences();
    const { savePassage, isPassageSaved } = useSavedPassages();
    
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<LookupResult | null>(null);
    const [passageResult, setPassageResult] = useState<PassageResult | null>(null);
    const [savedWords, setSavedWords] = useState<Set<string>>(new Set());
    const [savedSentences, setSavedSentences] = useState<Set<string>>(new Set());
    const [passageSaved, setPassageSaved] = useState(false);
    const [mode, setMode] = useState<'word' | 'passage'>('word');
    const [memoryNote, setMemoryNote] = useState<string | null>(null);
    const [memoryImageUrl, setMemoryImageUrl] = useState<string | null>(null);
    
    // Dialect preference: 'egyptian' (default) or 'standard'
    const [dialectPreference, setDialectPreference] = useState<'egyptian' | 'standard'>(() => {
        const saved = localStorage.getItem(DIALECT_PREFERENCE_KEY);
        return (saved === 'standard') ? 'standard' : 'egyptian';
    });
    
    // Persist dialect preference
    useEffect(() => {
        localStorage.setItem(DIALECT_PREFERENCE_KEY, dialectPreference);
    }, [dialectPreference]);

    // Detect if input looks like a passage (multiple words/sentences)
    const isPassageInput = (text: string): boolean => {
        const trimmed = text.trim();
        // Check for multiple sentences (periods, question marks) or many words
        const hasMultipleSentences = /[.؟!،]/.test(trimmed);
        const wordCount = trimmed.split(/\s+/).length;
        return hasMultipleSentences || wordCount > 4;
    };

    // Handle lookup - auto-detect word vs passage
    const handleLookup = async () => {
        if (!input.trim()) return;
        
        setIsLoading(true);
        setError(null);
        setResult(null);
        setPassageResult(null);

        const isPassage = isPassageInput(input);
        setMode(isPassage ? 'passage' : 'word');

        try {
            if (isPassage) {
                console.log('[LookupView] Analyzing passage:', input);
                const data = await analyzePassage(input.trim(), { language });
                console.log('[LookupView] Passage result:', data);
                setPassageResult(data);
            } else {
                console.log('[LookupView] Looking up word:', input);
                const data = await lookupWord(input.trim(), { language });
                console.log('[LookupView] Word result:', data);
                setResult(data);
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
            setSavedSentences(prev => new Set(prev).add(sentence.arabic_msa));
        } catch (err) {
            console.error('[LookupView] Failed to save sentence:', err);
        }
    };

    // Handle save word from passage breakdown
    const handleSavePassageWord = async (word: PassageWord) => {
        try {
            const cognate = findHebrewCognate(word.arabic);
            await saveWord({
                word: word.arabic,
                translation: word.translation,
                pronunciation_standard: word.transliteration,
                pronunciation_egyptian: word.transliteration_egyptian,
                hebrew_cognate: cognate || undefined,
            });
            setSavedWords(prev => new Set(prev).add(word.arabic));
        } catch (err) {
            console.error('[LookupView] Failed to save word from passage:', err);
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
            setPassageSaved(true);
        } catch (err) {
            console.error('[LookupView] Failed to save passage:', err);
        }
    };

    // Check if current word is saved
    const isCurrentWordSaved = result ? (savedWords.has(result.arabic_word) || isWordSaved(result.arabic_word)) : false;
    
    // Check if a word is saved (for passage words)
    const isWordAlreadySaved = (arabicWord: string) => savedWords.has(arabicWord) || isWordSaved(arabicWord);
    
    // Check if a sentence is saved
    const isSentenceAlreadySaved = (arabicText: string) => savedSentences.has(arabicText) || isSentenceSaved(arabicText);
    
    // Check if current passage is saved
    const isCurrentPassageSaved = passageResult?.original_text ? (passageSaved || isPassageSaved(passageResult.original_text)) : false;

    return (
        <div className="min-h-screen bg-surface-300 p-4 pb-24">
            {/* Header */}
            <header className="flex items-center justify-between mb-6">
                <button
                    onClick={() => navigate('/')}
                    className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-200"
                    aria-label="Back to menu"
                >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <h1 className="text-xl font-bold text-white">Lookup</h1>
                <div className="w-10" /> {/* Spacer for centering */}
            </header>

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

                    {/* Save example sentences */}
                    {result.example_sentences && result.example_sentences.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-white/50">Save Example Sentences</h3>
                            {result.example_sentences.map((sentence, idx) => {
                                const isSaved = isSentenceAlreadySaved(sentence.arabic_msa);
                                return (
                                    <div key={idx} className="glass-card p-3">
                                        <div className="text-white font-arabic text-lg mb-1" dir={language === 'arabic' ? 'rtl' : 'ltr'}>
                                            {sentence.arabic_egyptian || sentence.arabic_msa}
                                        </div>
                                        <div className="text-white/60 text-sm mb-2">
                                            {sentence.english}
                                        </div>
                                        <button
                                            onClick={() => handleSaveSentence(sentence)}
                                            disabled={isSaved}
                                            className={`w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                                                isSaved
                                                    ? 'bg-green-500/20 text-green-400 cursor-default'
                                                    : 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30'
                                            }`}
                                        >
                                            {isSaved ? '✓ Saved' : '💬 Save Sentence'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
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

            {/* Passage Results */}
            {passageResult && mode === 'passage' && (
                <div className="space-y-6">
                    {/* Detected language badge + Save Passage button */}
                    <div className="flex items-center justify-between">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            passageResult.detected_language === 'english'
                                ? 'bg-blue-500/20 text-blue-300'
                                : 'bg-teal-500/20 text-teal-300'
                        }`}>
                            {passageResult.detected_language === 'english' ? '🇺🇸 English → Arabic' : '🇪🇬 Arabic → English'}
                        </span>
                        <button
                            onClick={handleSavePassage}
                            disabled={isCurrentPassageSaved}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                                isCurrentPassageSaved
                                    ? 'bg-green-500/20 text-green-400 cursor-default'
                                    : 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30'
                            }`}
                        >
                            {isCurrentPassageSaved ? '✓ Passage Saved' : '📄 Save Passage'}
                        </button>
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
                            {/* Sentence header */}
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-white/40">Sentence {sentenceIdx + 1}</span>
                                <button
                                    onClick={() => handleSaveSentence({
                                        arabic_msa: sentence.arabic_msa,
                                        arabic_egyptian: sentence.arabic_egyptian,
                                        transliteration_msa: sentence.transliteration_msa,
                                        transliteration_egyptian: sentence.transliteration_egyptian,
                                        english: sentence.translation,
                                        explanation: sentence.explanation,
                                    })}
                                    disabled={isSentenceAlreadySaved(sentence.arabic_msa)}
                                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                                        isSentenceAlreadySaved(sentence.arabic_msa)
                                            ? 'bg-green-500/20 text-green-400'
                                            : 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30'
                                    }`}
                                >
                                    {isSentenceAlreadySaved(sentence.arabic_msa) ? '✓ Saved' : '💬 Save'}
                                </button>
                            </div>

                            {/* Primary dialect (based on preference) */}
                            {dialectPreference === 'egyptian' ? (
                                <>
                                    {/* Egyptian first */}
                                    <div>
                                        <div className="text-xs text-amber-400/60 mb-1">🇪🇬 Egyptian (Spoken)</div>
                                        <div className="text-xl font-arabic text-white" dir="rtl">
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
                                        <div className="text-xl font-arabic text-white" dir="rtl">
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

                            {/* Word-by-word breakdown */}
                            <div>
                                <div className="text-xs text-white/40 mb-2">Word Breakdown</div>
                                <div className="flex flex-wrap gap-2">
                                    {sentence.words?.map((word, wordIdx) => {
                                        const wordSaved = isWordAlreadySaved(word.arabic);
                                        // Show preferred dialect first
                                        const primaryArabic = dialectPreference === 'egyptian' 
                                            ? (word.arabic_egyptian || word.arabic)
                                            : (word.arabic || word.arabic_egyptian);
                                        const primaryTranslit = dialectPreference === 'egyptian'
                                            ? (word.transliteration_egyptian || word.transliteration)
                                            : (word.transliteration || word.transliteration_egyptian);
                                        return (
                                            <button
                                                key={wordIdx}
                                                onClick={() => !wordSaved && handleSavePassageWord(word)}
                                                disabled={wordSaved}
                                                className={`group relative px-3 py-2 rounded-lg text-left transition-colors ${
                                                    wordSaved
                                                        ? 'bg-green-500/10 border border-green-500/30'
                                                        : 'bg-white/10 hover:bg-amber-500/20 border border-white/10 hover:border-amber-500/30'
                                                }`}
                                            >
                                                <div className="text-white font-arabic" dir="rtl">
                                                    {primaryArabic}
                                                </div>
                                                <div className="text-white/60 text-xs">
                                                    {primaryTranslit}
                                                </div>
                                                <div className="text-white/80 text-sm">
                                                    {word.translation}
                                                </div>
                                                {word.part_of_speech && (
                                                    <div className="text-white/30 text-xs">
                                                        {word.part_of_speech}
                                                    </div>
                                                )}
                                                {/* Save indicator */}
                                                {wordSaved ? (
                                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-[10px]">✓</div>
                                                ) : (
                                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">+</div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
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
    );
}
