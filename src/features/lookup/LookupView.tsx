import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { lookupWord, type LookupResult } from '../../lib/openai';
import { useSavedWords } from '../../hooks/useSavedWords';
import { useSavedSentences } from '../../hooks/useSavedSentences';
import { WordDetailCard } from '../../components/WordDetailCard';

/**
 * LookupView - Full-page lookup for translating Arabic text.
 * Phase 15: Handles both single words and pasted passages.
 * 
 * Features:
 * - Paste any Arabic or English text
 * - Get full translation + transliteration
 * - Save individual words to My Words
 * - Save sentences to My Sentences (coming soon)
 */
export function LookupView() {
    const navigate = useNavigate();
    const { saveWord, isWordSaved } = useSavedWords();
    const { saveSentence, isSentenceSaved } = useSavedSentences();
    
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<LookupResult | null>(null);
    const [savedWords, setSavedWords] = useState<Set<string>>(new Set());
    const [savedSentences, setSavedSentences] = useState<Set<string>>(new Set());

    // Handle lookup
    const handleLookup = async () => {
        if (!input.trim()) return;
        
        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            console.log('[LookupView] Looking up:', input);
            const data = await lookupWord(input.trim());
            console.log('[LookupView] Result:', data);
            setResult(data);
        } catch (err) {
            console.error('[LookupView] Error:', err);
            setError('Failed to look up. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle save word
    const handleSaveWord = async () => {
        if (!result) return;
        
        try {
            await saveWord({
                word: result.arabic_word,
                translation: result.translation,
                pronunciation_standard: result.pronunciation_standard,
                pronunciation_egyptian: result.pronunciation_egyptian,
                letter_breakdown: result.letter_breakdown,
                hebrew_cognate: result.hebrew_cognate,
                example_sentences: result.example_sentences,
            });
            setSavedWords(prev => new Set(prev).add(result.arabic_word));
        } catch (err) {
            console.error('[LookupView] Failed to save word:', err);
        }
    };

    // Handle save sentence (from example sentences)
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

    // Check if current word is saved
    const isCurrentWordSaved = result ? (savedWords.has(result.arabic_word) || isWordSaved(result.arabic_word)) : false;
    
    // Check if a sentence is saved
    const isSentenceAlreadySaved = (arabicText: string) => savedSentences.has(arabicText) || isSentenceSaved(arabicText);

    return (
        <div className="min-h-screen bg-surface-300 p-4 pb-24">
            {/* Header */}
            <header className="flex items-center justify-between mb-6">
                <button
                    onClick={() => navigate('/')}
                    className="touch-btn w-10 h-10 flex items-center justify-center rounded-xl bg-white/10"
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
                    placeholder="Paste Arabic text or type English..."
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
                            {result.detected_language === 'arabic' ? 'Arabic → English' : 'English → Arabic'}
                        </div>
                        <div className="text-2xl font-bold text-white font-arabic mb-2" dir="rtl">
                            {result.arabic_word}
                        </div>
                        <div className="text-lg text-white/80">
                            {result.translation}
                        </div>
                    </div>

                    {/* Full word details using shared component */}
                    <WordDetailCard
                        word={result.arabic_word}
                        translation={result.translation}
                        language="arabic"
                        pronunciationStandard={result.pronunciation_standard}
                        pronunciationEgyptian={result.pronunciation_egyptian}
                        hebrewCognate={result.hebrew_cognate}
                        exampleSentences={result.example_sentences}
                    />

                    {/* Save word button */}
                    <div className="flex gap-3">
                        <button
                            onClick={handleSaveWord}
                            disabled={isCurrentWordSaved}
                            className={`flex-1 py-4 rounded-xl font-semibold transition-colors ${
                                isCurrentWordSaved
                                    ? 'bg-green-500/20 text-green-400 cursor-default'
                                    : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                            }`}
                        >
                            {isCurrentWordSaved ? '✓ Saved to My Words' : 'Save to My Words'}
                        </button>
                    </div>

                    {/* Save example sentences */}
                    {result.example_sentences && result.example_sentences.length > 0 && (
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-white/50">Save Example Sentences</h3>
                            {result.example_sentences.map((sentence, idx) => {
                                const isSaved = isSentenceAlreadySaved(sentence.arabic_msa);
                                return (
                                    <div key={idx} className="glass-card p-3">
                                        <div className="text-white font-arabic text-lg mb-1" dir="rtl">
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
                </div>
            )}

            {/* Empty state */}
            {!result && !isLoading && !error && (
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
