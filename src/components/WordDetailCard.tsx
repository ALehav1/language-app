import { useMemo, useState, useEffect } from 'react';
import { generateArabicBreakdownByWord, type WordBreakdown } from '../utils/arabicLetters';
import { lookupWord, type LookupResult, type ExampleSentence } from '../lib/openai';
import type { HebrewCognate } from '../types';

/**
 * Props for WordDetailCard - unified word display for both exercise feedback and vocabulary view.
 * This component shows the same rich information everywhere a word is displayed.
 */
interface WordDetailCardProps {
    // Core word data
    word: string;
    translation: string;
    language: 'arabic' | 'spanish';
    
    // Optional pre-loaded data (from database)
    transliteration?: string;
    pronunciationStandard?: string;
    pronunciationEgyptian?: string;
    hebrewCognate?: HebrewCognate | null;
    exampleSentences?: ExampleSentence[];
    
    // Display options
    showHeader?: boolean;
    headerContent?: React.ReactNode;
}

/**
 * WordDetailCard - Unified component for displaying word details.
 * Used by both ExerciseFeedback and MyVocabularyView to ensure consistent display.
 * 
 * Features:
 * - Arabic word with vowels (harakat)
 * - Both dialect pronunciations (MSA + Egyptian)
 * - Example sentences showing both dialects
 * - Hebrew cognate (if genuine Semitic connection)
 * - Letter breakdown (RTL display)
 * 
 * If enhanced data isn't provided, it fetches from OpenAI.
 */
export function WordDetailCard({
    word,
    translation,
    language,
    transliteration,
    pronunciationStandard,
    pronunciationEgyptian,
    hebrewCognate,
    exampleSentences,
    showHeader = false,
    headerContent,
}: WordDetailCardProps) {
    const isArabic = language === 'arabic';

    // State for enhanced word data fetched from OpenAI
    const [enhancedData, setEnhancedData] = useState<LookupResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [fetchAttempted, setFetchAttempted] = useState(false);

    // Determine if we need to fetch enhanced data
    // Fetch if: Arabic AND (missing example sentences OR missing Hebrew cognate check)
    const needsFetch = isArabic && !fetchAttempted && (
        !exampleSentences || exampleSentences.length === 0 || hebrewCognate === undefined
    );

    // Fetch enhanced data for Arabic words if not provided
    useEffect(() => {
        if (!needsFetch) return;
        
        console.log('[WordDetailCard] Fetching enhanced data for:', word);
        setIsLoading(true);
        setFetchAttempted(true);
        
        lookupWord(word)
            .then(data => {
                console.log('[WordDetailCard] Got enhanced data:', data);
                setEnhancedData(data);
            })
            .catch(err => {
                console.error('[WordDetailCard] Failed to fetch enhanced data:', err);
            })
            .finally(() => setIsLoading(false));
    }, [word, needsFetch]);

    // Merge provided data with fetched data (provided takes precedence)
    const displayData = {
        arabicWord: enhancedData?.arabic_word || word,
        arabicWordEgyptian: enhancedData?.arabic_word_egyptian,
        pronunciationStandard: pronunciationStandard || enhancedData?.pronunciation_standard || transliteration,
        pronunciationEgyptian: pronunciationEgyptian || enhancedData?.pronunciation_egyptian,
        hebrewCognate: hebrewCognate !== undefined ? hebrewCognate : enhancedData?.hebrew_cognate,
        exampleSentences: (exampleSentences && exampleSentences.length > 0) 
            ? exampleSentences 
            : enhancedData?.example_sentences || [],
    };

    // Generate letter breakdown by word
    const wordBreakdowns: WordBreakdown[] = useMemo(() => {
        if (isArabic) {
            return generateArabicBreakdownByWord(word);
        }
        return [];
    }, [word, isArabic]);

    return (
        <div className="space-y-4">
            {/* Optional Header */}
            {showHeader && headerContent}

            {/* 1. Word + Translation + Pronunciations */}
            <div className="glass-card p-4">
                <div className="text-center mb-3">
                    <span className="text-4xl font-bold text-white font-arabic" dir="rtl">
                        {displayData.arabicWord}
                    </span>
                    {/* Show Egyptian variant if different */}
                    {displayData.arabicWordEgyptian && displayData.arabicWordEgyptian !== displayData.arabicWord && (
                        <div className="text-sm text-amber-400/70 mt-1">
                            🇪🇬 {displayData.arabicWordEgyptian}
                        </div>
                    )}
                </div>
                <div className="text-center text-xl text-white/80 mb-3">
                    {translation}
                </div>
                
                {/* Pronunciations */}
                {isArabic && (displayData.pronunciationStandard || displayData.pronunciationEgyptian) && (
                    <div className="flex flex-col gap-2 text-center">
                        {displayData.pronunciationStandard && (
                            <div className="text-white/60">
                                <span className="text-white/40 text-sm">Standard (MSA):</span>{' '}
                                <span className="font-medium">'{displayData.pronunciationStandard}</span>
                            </div>
                        )}
                        {displayData.pronunciationEgyptian && (
                            <div className="text-amber-400/80">
                                <span className="text-amber-400/50 text-sm">🇪🇬 Egyptian:</span>{' '}
                                <span className="font-medium">'{displayData.pronunciationEgyptian}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 2. Hebrew Connection (Arabic only) */}
            {isArabic && (
                <div className="glass-card p-4 border-l-4 border-l-blue-500/50">
                    <div className="flex items-center gap-2 text-blue-300 text-xs font-bold uppercase tracking-wider mb-2">
                        <span>Hebrew Connection</span>
                        {isLoading && !displayData.hebrewCognate && (
                            <span className="text-white/30 animate-pulse">checking...</span>
                        )}
                    </div>
                    {displayData.hebrewCognate ? (
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="text-2xl font-hebrew text-white mb-1">
                                    {displayData.hebrewCognate.root}
                                </div>
                                <div className="text-sm text-white/60">
                                    {displayData.hebrewCognate.meaning}
                                </div>
                            </div>
                            {displayData.hebrewCognate.notes && (
                                <div className="text-xs text-white/40 max-w-[150px] text-right italic">
                                    "{displayData.hebrewCognate.notes}"
                                </div>
                            )}
                        </div>
                    ) : !isLoading ? (
                        <div className="text-white/40 text-sm italic">
                            No Hebrew cognate - this word doesn't share a Semitic root with Hebrew
                        </div>
                    ) : null}
                </div>
            )}

            {/* 3. Example Sentences - Egyptian (spoken) first, then MSA */}
            {isArabic && displayData.exampleSentences.length > 0 && (
                <div className="glass-card p-4">
                    <div className="text-purple-400/70 text-xs font-bold uppercase tracking-wider mb-3">
                        Example Sentences
                    </div>
                    <div className="space-y-4">
                        {displayData.exampleSentences.map((sentence, idx) => (
                            <div key={idx} className="bg-white/5 rounded-xl p-3 space-y-3">
                                {/* Egyptian (spoken) - PRIMARY */}
                                <div className="border-l-2 border-amber-500/50 pl-3">
                                    <div className="text-amber-400/60 text-xs font-bold uppercase tracking-wider mb-1">
                                        🇪🇬 Egyptian (Spoken)
                                    </div>
                                    <div className="text-xl font-arabic text-white text-right" dir="rtl">
                                        {sentence.arabic_egyptian}
                                    </div>
                                    <div className="text-sm text-amber-400/80 italic">
                                        {sentence.transliteration_egyptian}
                                    </div>
                                </div>
                                
                                {/* MSA (formal) */}
                                <div className="border-l-2 border-teal-500/30 pl-3 opacity-70">
                                    <div className="text-teal-400/60 text-xs font-bold uppercase tracking-wider mb-1">
                                        📖 MSA (Formal)
                                    </div>
                                    <div className="text-lg font-arabic text-white/80 text-right" dir="rtl">
                                        {sentence.arabic_msa}
                                    </div>
                                    <div className="text-sm text-teal-400/60 italic">
                                        {sentence.transliteration_msa}
                                    </div>
                                </div>
                                
                                {/* English translation */}
                                <div className="text-white/80 pt-1">
                                    {sentence.english}
                                </div>
                                
                                {/* Explanation if present */}
                                {sentence.explanation && (
                                    <div className="text-xs text-white/40 border-t border-white/10 pt-2">
                                        💡 {sentence.explanation}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 4. Arabic Letter Breakdown - Each word on its own line, RTL */}
            {isArabic && wordBreakdowns.length > 0 && (
                <div className="glass-card p-4">
                    <div className="text-teal-400/70 text-xs font-bold uppercase tracking-wider mb-3">
                        Letter Breakdown
                    </div>
                    <div className="space-y-4">
                        {wordBreakdowns.map((wordBreakdown, wordIdx) => (
                            <div key={wordIdx} className="space-y-2">
                                {/* Word label (only if multiple words) */}
                                {wordBreakdowns.length > 1 && (
                                    <div className="text-center text-white/60 text-sm font-arabic" dir="rtl">
                                        {wordBreakdown.word}
                                    </div>
                                )}
                                {/* Letters for this word */}
                                <div className="flex flex-wrap justify-center gap-2" dir="rtl">
                                    {wordBreakdown.letters.map((l, idx) => (
                                        <div key={idx} className="flex flex-col items-center gap-1 p-3 bg-white/5 rounded-xl min-w-[60px]">
                                            <span className="text-2xl font-arabic text-white">{l.letter}</span>
                                            <span className="text-[10px] text-white/50 text-center leading-tight">{l.name}</span>
                                            <span className="text-xs text-teal-400/80 font-mono">/{l.sound}/</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
