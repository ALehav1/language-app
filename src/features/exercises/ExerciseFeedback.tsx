import { useMemo, useState, useEffect } from 'react';
import type { AnswerResult, VocabularyItem } from '../../types';
import { generateArabicBreakdownByWord, type WordBreakdown } from '../../utils/arabicLetters';
import { lookupWord, type LookupResult } from '../../lib/openai';
import { SaveDecisionPanel, type SaveDecision } from '../../components/SaveDecisionPanel';

interface ExerciseFeedbackProps {
    result: AnswerResult;
    item: VocabularyItem; // Need the item for details
    onContinue: (saveDecision?: { decision: SaveDecision; memoryAid?: { note?: string; imageUrl?: string } }) => void;
    isLastQuestion: boolean;
    isWordAlreadySaved?: boolean; // Check if word is already in saved_words
}

/**
 * Displays feedback after an answer is submitted.
 * Shows detailed breakdown including:
 * - Correct/Incorrect status
 * - Spelling/Pronunciation (Transliteration)
 * - Arabic Letter Breakdown (if available)
 * - Hebrew Cognate (if available)
 */
export function ExerciseFeedback({ result, item, onContinue, isLastQuestion, isWordAlreadySaved = false }: ExerciseFeedbackProps) {
    const { correct, userAnswer, correctAnswer } = result;
    const isArabic = item.language === 'arabic';

    // State for enhanced word data (both dialects, Hebrew cognate)
    const [enhancedData, setEnhancedData] = useState<LookupResult | null>(null);
    const [isLoadingEnhanced, setIsLoadingEnhanced] = useState(false);

    // Fetch enhanced data for Arabic words (both dialects + Hebrew cognate)
    useEffect(() => {
        if (!isArabic) {
            console.log('[ExerciseFeedback] Not Arabic, skipping lookup');
            return;
        }
        
        // Always fetch for Arabic words to get both dialects
        console.log('[ExerciseFeedback] Fetching enhanced data for:', item.word);
        setIsLoadingEnhanced(true);
        lookupWord(item.word)
            .then(data => {
                console.log('[ExerciseFeedback] Got enhanced data:', data);
                setEnhancedData(data);
            })
            .catch(err => {
                console.error('[ExerciseFeedback] Failed to fetch enhanced data:', err);
            })
            .finally(() => setIsLoadingEnhanced(false));
    }, [item.word, isArabic]);

    // Use enhanced data if available, otherwise fall back to item data
    const hebrewCognate = enhancedData?.hebrew_cognate || item.hebrew_cognate;
    const pronunciationStandard = enhancedData?.pronunciation_standard || item.transliteration;
    const pronunciationEgyptian = enhancedData?.pronunciation_egyptian;
    const arabicWordWithHarakat = enhancedData?.arabic_word || item.word;
    const egyptianWord = enhancedData?.arabic_word_egyptian;

    // Generate letter breakdown by word on-the-fly
    const wordBreakdowns: WordBreakdown[] = useMemo(() => {
        if (isArabic) {
            return generateArabicBreakdownByWord(item.word);
        }
        return [];
    }, [item.word, isArabic]);

    return (
        <div className="space-y-6 pb-20">
            {/* Result Header */}
            <div
                className={`
                    glass-card p-6 text-center
                    ${correct ? 'border-green-500/30' : 'border-red-500/30'}
                    border-2
                `}
            >
                <h3
                    className={`text-2xl font-bold mb-2 ${correct ? 'text-green-400' : 'text-red-400'
                        }`}
                >
                    {correct ? 'Correct!' : 'Not quite'}
                </h3>

                {/* Dual result display for Arabic transliteration mode */}
                {result.userTransliteration !== undefined && (
                    <div className="space-y-2 mt-4 text-left">
                        {/* Transliteration result */}
                        <div className={`flex items-center gap-2 p-2 rounded-lg ${
                            result.transliterationCorrect ? 'bg-green-500/10' : 'bg-red-500/10'
                        }`}>
                            <span className={result.transliterationCorrect ? 'text-green-400' : 'text-red-400'}>
                                {result.transliterationCorrect ? '✓' : '✗'}
                            </span>
                            <span className="text-white/70 text-sm">Pronunciation:</span>
                            <span className={`font-medium ${result.transliterationCorrect ? 'text-green-400' : 'text-red-400'}`}>
                                {result.userTransliteration}
                            </span>
                            {!result.transliterationCorrect && (
                                <span className="text-white/40 text-sm">
                                    (expected: {result.correctTransliteration})
                                </span>
                            )}
                        </div>

                        {/* Translation result */}
                        <div className={`flex items-center gap-2 p-2 rounded-lg ${
                            correct || (result.transliterationCorrect === false && userAnswer.toLowerCase() === correctAnswer.toLowerCase())
                                ? 'bg-green-500/10' : 'bg-red-500/10'
                        }`}>
                            <span className={
                                correct || (result.transliterationCorrect === false && userAnswer.toLowerCase() === correctAnswer.toLowerCase())
                                    ? 'text-green-400' : 'text-red-400'
                            }>
                                {correct || (result.transliterationCorrect === false && userAnswer.toLowerCase() === correctAnswer.toLowerCase()) ? '✓' : '✗'}
                            </span>
                            <span className="text-white/70 text-sm">Translation:</span>
                            <span className={`font-medium ${
                                correct || (result.transliterationCorrect === false && userAnswer.toLowerCase() === correctAnswer.toLowerCase())
                                    ? 'text-green-400' : 'text-red-400'
                            }`}>
                                {userAnswer}
                            </span>
                            {!correct && !(result.transliterationCorrect === false && userAnswer.toLowerCase() === correctAnswer.toLowerCase()) && (
                                <span className="text-white/40 text-sm">
                                    (expected: {correctAnswer})
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Single result display (non-Arabic or no transliteration) */}
                {result.userTransliteration === undefined && !correct && (
                    <div className="space-y-1 mt-4">
                        <div className="text-white/50 text-sm">Correct answer:</div>
                        <div className="text-xl text-green-400 font-bold">{correctAnswer}</div>
                        <div className="text-white/30 text-xs mt-2">You said: <span className="text-red-400/80">{userAnswer}</span></div>
                    </div>
                )}

                {/* AI Explanation / Feedback */}
                {result.feedback && (
                    <div className="mt-4 p-3 bg-white/10 rounded-lg text-sm text-white/80">
                        {result.feedback}
                    </div>
                )}
            </div>

            {/* Detailed Breakdown Section */}
            <div className="space-y-4">
                <h4 className="text-white/70 font-semibold px-1">Word Details</h4>

                {/* 1. The Word itself with translation + both dialect pronunciations */}
                <div className="glass-card p-4">
                    <div className="flex items-center justify-between mb-3">
                        <span className={`text-3xl font-bold text-white ${isArabic ? 'font-arabic' : ''}`} dir={isArabic ? 'rtl' : 'ltr'}>
                            {arabicWordWithHarakat}
                        </span>
                        <span className="text-white/60 text-lg">{item.translation}</span>
                    </div>
                    
                    {/* Pronunciations - show both dialects for Arabic with actual words */}
                    {isArabic && (pronunciationStandard || pronunciationEgyptian) ? (
                        <div className="grid grid-cols-2 gap-3 mt-3">
                            {pronunciationStandard && (
                                <div className="bg-white/5 rounded-lg p-3 text-center">
                                    <div className="text-white/40 text-xs mb-1">Standard (MSA)</div>
                                    <div className="text-xl font-arabic text-white/90 mb-1" dir="rtl">{arabicWordWithHarakat}</div>
                                    <div className="text-white/60 text-sm">{pronunciationStandard}</div>
                                </div>
                            )}
                            {pronunciationEgyptian && (
                                <div className="bg-white/5 rounded-lg p-3 text-center">
                                    <div className="text-white/40 text-xs mb-1">Egyptian</div>
                                    {egyptianWord && egyptianWord !== arabicWordWithHarakat ? (
                                        <>
                                            <div className="text-xl font-arabic text-amber-300/90 mb-1" dir="rtl">{egyptianWord}</div>
                                            <div className="text-white/60 text-sm">{pronunciationEgyptian}</div>
                                        </>
                                    ) : (
                                        <div className="text-white/60 text-sm mt-2">{pronunciationEgyptian}</div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : item.transliteration ? (
                        <div className="flex items-center gap-2 text-white/50 text-sm">
                            <span className="text-white/30">Pronunciation:</span>
                            <span className="font-medium text-white/70">{item.transliteration}</span>
                        </div>
                    ) : isLoadingEnhanced ? (
                        <div className="text-white/30 text-sm animate-pulse">Loading pronunciations...</div>
                    ) : null}
                </div>

                {/* 2. Hebrew Cognate (Arabic only) - use enhanced data if available */}
                {isArabic && (
                    <div className={`glass-card p-4 space-y-2 border-l-4 ${hebrewCognate ? 'border-l-blue-500/50' : 'border-l-white/10'}`}>
                        <div className="flex items-center gap-2 text-blue-300 mb-1">
                            <span className="text-xs font-bold uppercase tracking-wider">Hebrew Connection</span>
                            {isLoadingEnhanced && !hebrewCognate && (
                                <span className="text-white/30 text-xs animate-pulse">checking...</span>
                            )}
                        </div>
                        {hebrewCognate ? (
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="text-2xl font-hebrew text-white mb-1">{hebrewCognate.root}</div>
                                    <div className="text-sm text-white/60">{hebrewCognate.meaning}</div>
                                </div>
                                {hebrewCognate.notes && (
                                    <div className="text-xs text-white/40 max-w-[150px] text-right italic">
                                        "{hebrewCognate.notes}"
                                    </div>
                                )}
                            </div>
                        ) : !isLoadingEnhanced ? (
                            <div className="text-white/40 text-sm italic">
                                No Hebrew cognate - this word doesn't share a Semitic root with Hebrew
                            </div>
                        ) : null}
                    </div>
                )}

                {/* 3. Example Sentences - Egyptian (spoken) first, then MSA */}
                {isArabic && enhancedData?.example_sentences && enhancedData.example_sentences.length > 0 && (
                    <div className="glass-card p-4">
                        <div className="text-purple-400/70 text-xs font-bold uppercase tracking-wider mb-3">Example Sentences</div>
                        <div className="space-y-4">
                            {enhancedData.example_sentences.map((sentence, idx) => (
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
                        <div className="text-teal-400/70 text-xs font-bold uppercase tracking-wider mb-3">Letter Breakdown</div>
                        <div className="space-y-4">
                            {wordBreakdowns.map((wordBreakdown, wordIdx) => (
                                <div key={wordIdx} className="space-y-2">
                                    {/* Word label */}
                                    <div className="text-center text-white/60 text-sm font-arabic" dir="rtl">
                                        {wordBreakdown.word}
                                    </div>
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

            {/* Save Decision Panel for Arabic words */}
            {isArabic && (
                <div className="glass-card p-4">
                    <SaveDecisionPanel
                        primaryText={item.word}
                        translation={item.translation}
                        onDecision={(decision, memoryAid) => {
                            onContinue({ decision, memoryAid });
                        }}
                        alreadySaved={isWordAlreadySaved}
                    />
                </div>
            )}

            {/* Simple Next button for non-Arabic (Spanish) */}
            {!isArabic && (
                <div className="flex gap-3 pt-4">
                    <button
                        onClick={() => onContinue()}
                        className="flex-1 touch-btn py-4 text-lg font-semibold rounded-xl btn-primary"
                    >
                        {isLastQuestion ? 'See Results' : 'Next'}
                    </button>
                </div>
            )}
        </div>
    );
}
