import { useState } from 'react';
import { lookupWord, type LookupResult } from '../../lib/openai';
import { useSavedWords } from '../../hooks/useSavedWords';

interface LookupModalProps {
    isOpen: boolean;
    onClose: () => void;
}

/**
 * Modal for looking up any word (Arabic or English) and getting full breakdown.
 * Users can type/paste any word and save it to their vocabulary.
 */
export function LookupModal({ isOpen, onClose }: LookupModalProps) {
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<LookupResult | null>(null);
    const [saved, setSaved] = useState(false);

    const { saveWord, isWordSaved } = useSavedWords();

    const handleLookup = async () => {
        if (!input.trim()) return;

        setLoading(true);
        setError(null);
        setResult(null);
        setSaved(false);

        try {
            const lookupResult = await lookupWord(input.trim());
            setResult(lookupResult);
            // Check if already saved
            if (isWordSaved(lookupResult.arabic_word)) {
                setSaved(true);
            }
        } catch (err) {
            console.error('Lookup error:', err);
            setError(err instanceof Error ? err.message : 'Failed to look up word');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!result) return;

        try {
            await saveWord(
                {
                    word: result.arabic_word,
                    translation: result.translation,
                    pronunciation_standard: result.pronunciation_standard,
                    pronunciation_egyptian: result.pronunciation_egyptian,
                    letter_breakdown: result.letter_breakdown,
                    hebrew_cognate: result.hebrew_cognate,
                },
                {
                    content_type: 'lookup',
                    full_text: result.arabic_word,
                    full_transliteration: result.pronunciation_standard,
                    full_translation: result.translation,
                }
            );
            setSaved(true);
        } catch (err) {
            console.error('Save error:', err);
        }
    };

    const handleClose = () => {
        setInput('');
        setResult(null);
        setError(null);
        setSaved(false);
        onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !loading) {
            handleLookup();
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
            onClick={handleClose}
        >
            <div
                className="w-full max-w-md bg-surface-300 rounded-2xl max-h-[85vh] overflow-hidden flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <h2 className="text-lg font-bold text-white">Look Up Word</h2>
                    <button
                        onClick={handleClose}
                        className="text-white/50 hover:text-white"
                        aria-label="Close"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Input */}
                <div className="p-4 border-b border-white/10">
                    <div className="relative">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type any word (English or Arabic)..."
                            className="w-full px-4 py-3 bg-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 text-lg"
                            autoFocus
                            dir="auto"
                        />
                    </div>
                    <p className="text-white/40 text-sm mt-2">
                        Examples: "hello", "مرحبا", "work", "كيف"
                    </p>
                    <button
                        onClick={handleLookup}
                        disabled={!input.trim() || loading}
                        className="w-full mt-3 py-3 btn-primary font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                </svg>
                                Looking up...
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                Look Up
                            </>
                        )}
                    </button>
                </div>

                {/* Error */}
                {error && (
                    <div className="p-4 bg-red-500/20 text-red-300 text-center">
                        {error}
                    </div>
                )}

                {/* Result */}
                {result && (
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {/* Word + Translation */}
                        <div className="glass-card p-4 text-center">
                            <div className="text-4xl font-bold text-white font-arabic mb-2" dir="rtl">
                                {result.arabic_word}
                            </div>
                            <div className="text-xl text-white/80 mb-4">
                                {result.translation}
                            </div>
                            
                            {/* Pronunciations */}
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="bg-white/5 rounded-lg p-3">
                                    <div className="text-white/40 text-xs mb-1">Standard (MSA)</div>
                                    <div className="text-white font-medium">{result.pronunciation_standard}</div>
                                </div>
                                <div className="bg-white/5 rounded-lg p-3">
                                    <div className="text-white/40 text-xs mb-1">Egyptian</div>
                                    <div className="text-white font-medium">{result.pronunciation_egyptian}</div>
                                </div>
                            </div>
                        </div>

                        {/* Hebrew Cognate */}
                        {result.hebrew_cognate && (
                            <div className="glass-card p-4 border-l-4 border-l-blue-500/50">
                                <div className="text-blue-300 text-xs font-bold uppercase tracking-wider mb-2">
                                    Hebrew Connection
                                </div>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="text-2xl font-hebrew text-white mb-1">
                                            {result.hebrew_cognate.root}
                                        </div>
                                        <div className="text-sm text-white/60">
                                            {result.hebrew_cognate.meaning}
                                        </div>
                                    </div>
                                    {result.hebrew_cognate.notes && (
                                        <div className="text-xs text-white/40 max-w-[150px] text-right italic">
                                            "{result.hebrew_cognate.notes}"
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Example Sentences */}
                        {result.example_sentences && result.example_sentences.length > 0 && (
                            <div className="glass-card p-4">
                                <div className="text-purple-400/70 text-xs font-bold uppercase tracking-wider mb-3">
                                    Example Sentences
                                </div>
                                <div className="space-y-4">
                                    {result.example_sentences.map((sentence, idx) => (
                                        <div key={idx} className="bg-white/5 rounded-xl p-3 space-y-2">
                                            {/* Arabic sentence */}
                                            <div className="text-xl font-arabic text-white text-right" dir="rtl">
                                                {sentence.arabic}
                                            </div>
                                            {/* Transliteration */}
                                            <div className="text-sm text-teal-400/80 italic">
                                                {sentence.transliteration}
                                            </div>
                                            {/* English translation */}
                                            <div className="text-white/80">
                                                {sentence.english}
                                            </div>
                                            {/* Explanation if present */}
                                            {sentence.explanation && (
                                                <div className="text-xs text-white/40 border-t border-white/10 pt-2 mt-2">
                                                    💡 {sentence.explanation}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Letter Breakdown */}
                        {result.letter_breakdown && result.letter_breakdown.length > 0 && (
                            <div className="glass-card p-4">
                                <div className="text-teal-400/70 text-xs font-bold uppercase tracking-wider mb-3">
                                    Letter Breakdown
                                </div>
                                <div className="flex flex-wrap justify-center gap-2" dir="rtl">
                                    {result.letter_breakdown.map((l, idx) => (
                                        <div key={idx} className="flex flex-col items-center gap-1 p-2 bg-white/5 rounded-xl min-w-[55px]">
                                            <span className="text-2xl font-arabic text-white">{l.letter}</span>
                                            <span className="text-[9px] text-white/50 text-center leading-tight">{l.name}</span>
                                            <span className="text-xs text-teal-400/80 font-mono">/{l.sound}/</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Save Button */}
                        <button
                            onClick={handleSave}
                            disabled={saved}
                            className={`w-full py-4 font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors ${
                                saved
                                    ? 'bg-green-500/20 text-green-300 cursor-default'
                                    : 'btn-primary'
                            }`}
                        >
                            {saved ? (
                                <>
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                                    </svg>
                                    Saved to My Vocabulary
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                    Save to My Vocabulary
                                </>
                            )}
                        </button>

                        {/* Look up another */}
                        <button
                            onClick={() => {
                                setResult(null);
                                setInput('');
                                setSaved(false);
                            }}
                            className="w-full py-3 bg-white/10 text-white/70 rounded-xl font-medium hover:bg-white/20"
                        >
                            Look up another word
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
