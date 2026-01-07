import { useState, useEffect } from 'react';
import type { AnswerResult, VocabularyItem } from '../../types';
import { lookupWord, type LookupResult } from '../../lib/openai';
import { SaveDecisionPanel, type SaveDecision } from '../../components/SaveDecisionPanel';
import { WordDisplay } from '../../components/WordDisplay';

interface ExerciseFeedbackProps {
    result: AnswerResult;
    item: VocabularyItem; // Need the item for details
    onContinue: (saveDecision?: { 
        decision: SaveDecision; 
        memoryAid?: { note?: string; imageUrl?: string };
        enhancedData?: {
            arabicWordEgyptian?: string;
            arabicWordMSA?: string;
            pronunciationStandard?: string;
            pronunciationEgyptian?: string;
            hebrewCognate?: any;
            letterBreakdown?: any[];
            exampleSentences?: any[];
        };
    }) => void;
    isLastQuestion: boolean;
    isWordAlreadySaved?: boolean; // Check if word is already in saved_words
    savedWordStatus?: 'active' | 'learned'; // Current status if already saved
    savedWordMemoryAid?: { note?: string; imageUrl?: string }; // Existing memory aid if saved
}

/**
 * Displays feedback after an answer is submitted.
 * Shows detailed breakdown including:
 * - Correct/Incorrect status
 * - Spelling/Pronunciation (Transliteration)
 * - Arabic Letter Breakdown (if available)
 * - Hebrew Cognate (if available)
 */
export function ExerciseFeedback({ 
    result, 
    item, 
    onContinue, 
    isLastQuestion, 
    isWordAlreadySaved = false,
    savedWordStatus,
    savedWordMemoryAid,
}: ExerciseFeedbackProps) {
    const { correct, userAnswer, correctAnswer } = result;
    const isArabic = item.language === 'arabic';

    // State for enhanced word data (both dialects, Hebrew cognate)
    const [enhancedData, setEnhancedData] = useState<LookupResult | null>(null);
    const [isLoadingEnhanced, setIsLoadingEnhanced] = useState(isArabic);

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
                setIsLoadingEnhanced(false);
            })
            .catch(err => {
                console.error('[ExerciseFeedback] Failed to fetch enhanced data:', err);
                setIsLoadingEnhanced(false);
            });
    }, [item.word, isArabic]);

    // Use enhanced data if available, otherwise fall back to item data
    const hebrewCognate = enhancedData?.hebrew_cognate || item.hebrew_cognate;
    const pronunciationStandard = enhancedData?.pronunciation_standard || item.transliteration;
    const pronunciationEgyptian = enhancedData?.pronunciation_egyptian;
    const arabicWordWithHarakat = enhancedData?.arabic_word || item.word;
    const arabicWordEgyptian = enhancedData?.arabic_word_egyptian || item.word;

    // Generate letter breakdown - WordDisplay will handle this internally
    // We don't need to pass it explicitly since WordDisplay generates it when showLetterBreakdown=true

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

                {/* Use WordDisplay for the word details */}
                {isArabic && isLoadingEnhanced ? (
                    /* Loading skeleton for Arabic words */
                    <div className="glass-card p-4 animate-pulse">
                        <div className="h-10 bg-white/10 rounded mb-4"></div>
                        <div className="h-6 bg-white/10 rounded mb-2 w-3/4"></div>
                        <div className="h-6 bg-white/10 rounded w-1/2"></div>
                    </div>
                ) : isArabic ? (
                    <WordDisplay
                        word={{
                            arabic: arabicWordWithHarakat,
                            arabicEgyptian: arabicWordEgyptian,
                            translation: item.translation,
                            transliteration: pronunciationStandard,
                            transliterationEgyptian: pronunciationEgyptian,
                            hebrewCognate: hebrewCognate,
                            exampleSentences: enhancedData?.example_sentences,
                            letterBreakdown: enhancedData?.letter_breakdown ? [{
                                word: arabicWordEgyptian || arabicWordWithHarakat,
                                letters: enhancedData.letter_breakdown as any
                            }] as any : undefined,
                        }}
                        size="large"
                        showHebrewCognate={true}
                        showLetterBreakdown={true}
                        showExampleSentences={true}
                        showSaveOption={false}
                        dialectPreference="egyptian"
                    />
                ) : (
                    /* Non-Arabic word display */
                    <div className="glass-card p-4">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-3xl font-bold text-white">
                                {item.word}
                            </span>
                            <span className="text-white/60 text-lg">{item.translation}</span>
                        </div>
                        {item.transliteration && (
                            <div className="flex items-center gap-2 text-white/50 text-sm">
                                <span className="text-white/30">Pronunciation:</span>
                                <span className="font-medium text-white/70">{item.transliteration}</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Save Decision Panel for Arabic words */}
            {isArabic && !isLoadingEnhanced && (
                <div className="glass-card p-4">
                    <SaveDecisionPanel
                        primaryText={arabicWordEgyptian || arabicWordWithHarakat}
                        translation={item.translation}
                        onDecision={(decision, memoryAid) => {
                            onContinue({ 
                                decision, 
                                memoryAid,
                                enhancedData: enhancedData ? {
                                    arabicWordEgyptian: enhancedData.arabic_word_egyptian,
                                    arabicWordMSA: enhancedData.arabic_word,
                                    pronunciationStandard: enhancedData.pronunciation_standard,
                                    pronunciationEgyptian: enhancedData.pronunciation_egyptian,
                                    hebrewCognate: enhancedData.hebrew_cognate,
                                    letterBreakdown: enhancedData.letter_breakdown,
                                    exampleSentences: enhancedData.example_sentences
                                } : undefined
                            });
                        }}
                        alreadySaved={isWordAlreadySaved}
                        currentStatus={savedWordStatus}
                        existingMemoryAid={savedWordMemoryAid}
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
