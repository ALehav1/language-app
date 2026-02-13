import { useState, useEffect } from 'react';
import type { AnswerResult, VocabularyItem } from '../../types';
import { lookupWord, type LookupResult } from '../../lib/openai';
import { useLanguage } from '../../contexts/LanguageContext';
import { SaveDecisionPanel, type SaveDecision } from '../../components/SaveDecisionPanel';
import { WordSurface } from '../../components/surfaces/WordSurface';
import { ContextTile } from '../../components/ContextTile';
import { MemoryAidTile } from '../../components/MemoryAidTile';
import { ChatTile, type ChatMessage } from '../../components/ChatTile';
import { ClickableText } from '../../components/text/ClickableText';
import { WordDetailModal } from '../../components/modals/WordDetailModal';
import type { WordSelectionContext } from '../../types/selection';

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
    const { language } = useLanguage();

    // State for enhanced word data (both dialects, Hebrew cognate)
    const [enhancedData, setEnhancedData] = useState<LookupResult | null>(null);
    const [isLoadingEnhanced, setIsLoadingEnhanced] = useState(isArabic);
    
    // State for memory aid
    const [memoryNote, setMemoryNote] = useState<string | null>(savedWordMemoryAid?.note || null);
    const [memoryImageUrl, setMemoryImageUrl] = useState<string | null>(savedWordMemoryAid?.imageUrl || null);
    
    // State for chat messages
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [exampleSentencesExpanded, setExampleSentencesExpanded] = useState(false);
    const [wordModalOpen, setWordModalOpen] = useState(false);
    const [wordSelection, setWordSelection] = useState<WordSelectionContext | null>(null);

    // Fetch enhanced data for Arabic words (both dialects + Hebrew cognate)
    useEffect(() => {
        if (!isArabic) {
            console.log('[ExerciseFeedback] Not Arabic, skipping lookup');
            return;
        }
        
        // Always fetch for Arabic words to get both dialects
        console.log('[ExerciseFeedback] Fetching enhanced data for:', item.word);
        setIsLoadingEnhanced(true);
        lookupWord(item.word, { language })
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

    // Generate letter breakdown - WordSurface will handle this internally
    // We don't need to pass it explicitly since WordSurface generates it when showLetterBreakdown=true

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

                {/* Use WordSurface for the word details (canonical renderer) */}
                {isArabic && isLoadingEnhanced ? (
                    /* Loading skeleton for Arabic words */
                    <div className="glass-card p-4 animate-pulse">
                        <div className="h-10 bg-white/10 rounded mb-4"></div>
                        <div className="h-6 bg-white/10 rounded mb-2 w-3/4"></div>
                        <div className="h-6 bg-white/10 rounded w-1/2"></div>
                    </div>
                ) : isArabic && enhancedData ? (
                    <WordSurface
                        word={{
                            arabic: item.word,
                            arabicEgyptian: enhancedData.arabic_word_egyptian || item.word,
                            translation: item.translation,
                            transliteration: enhancedData.pronunciation_standard || item.transliteration,
                            transliterationEgyptian: enhancedData.pronunciation_egyptian,
                            hebrewCognate: enhancedData.hebrew_cognate,
                            exampleSentences: enhancedData.example_sentences,
                        }}
                        language="arabic"
                        size="large"
                        showHebrewCognate={true}
                        showLetterBreakdown={true}
                        showExampleSentences={false}
                        showSaveOption={false}
                        dialectPreference="egyptian"
                    />
                ) : (
                    /* Non-Arabic word display - use WordSurface for Spanish too */
                    <WordSurface
                        word={{
                            language: 'spanish' as const,
                            spanish_latam: item.word,
                            translation: item.translation,
                        }}
                        language="spanish"
                        size="large"
                        showExampleSentences={false}
                        showSaveOption={false}
                        dialectPreference="latam"
                    />
                )}
                
                {/* Context and tiles for Arabic words */}
                {isArabic && !isLoadingEnhanced && enhancedData && (
                    <div className="space-y-3 mt-4">
                        {/* Context Tile - Root, Usage, Cultural Notes */}
                        <ContextTile context={enhancedData.word_context} language={language} />
                        
                        {/* Memory Aid Tile - Separate dropdown */}
                        <MemoryAidTile
                            primaryText={item.word}
                            translation={item.translation}
                            currentNote={memoryNote}
                            currentImageUrl={memoryImageUrl}
                            onImageGenerated={(imageUrl) => setMemoryImageUrl(imageUrl)}
                            onNoteChanged={(note) => setMemoryNote(note)}
                        />
                        
                        {/* Example Sentences - Collapsible (default collapsed) */}
                        {enhancedData.example_sentences && enhancedData.example_sentences.length > 0 && (
                            <div className="glass-card p-4">
                                <button
                                    onClick={() => setExampleSentencesExpanded(!exampleSentencesExpanded)}
                                    className="w-full flex items-center justify-between text-left"
                                >
                                    <div className="text-teal-400/70 text-xs font-bold uppercase tracking-wider">
                                        Example Sentences ({enhancedData.example_sentences.length})
                                    </div>
                                    <svg
                                        className={`w-4 h-4 text-teal-400/70 transition-transform ${exampleSentencesExpanded ? 'rotate-180' : ''}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                
                                {exampleSentencesExpanded && (
                                    <div className="space-y-3 mt-3">
                                        {enhancedData.example_sentences.map((sentence, idx) => (
                                            <div key={idx} className="bg-white/5 rounded-xl p-3 space-y-2">
                                                {sentence.arabic_egyptian && (
                                                    <div className="space-y-1">
                                                        <div className="text-sm text-white/50">Egyptian</div>
                                                        <div className="text-2xl font-arabic text-white">
                                                            <ClickableText
                                                                text={sentence.arabic_egyptian}
                                                                language="arabic"
                                                                dir="rtl"
                                                                mode="word"
                                                                sourceView="exercise"
                                                                dialect="egyptian"
                                                                contentType="sentence"
                                                                onWordClick={(context) => {
                                                                    setWordSelection(context);
                                                                    setWordModalOpen(true);
                                                                }}
                                                            />
                                                        </div>
                                                        {sentence.transliteration_egyptian && (
                                                            <div className="text-base text-white/40 italic">
                                                                {sentence.transliteration_egyptian}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                {sentence.arabic_msa && (
                                                    <div className="space-y-1">
                                                        <div className="text-sm text-white/50">MSA</div>
                                                        <div className="text-xl font-arabic text-white/70">
                                                            <ClickableText
                                                                text={sentence.arabic_msa}
                                                                language="arabic"
                                                                dir="rtl"
                                                                mode="word"
                                                                sourceView="exercise"
                                                                dialect="standard"
                                                                contentType="sentence"
                                                                onWordClick={(context) => {
                                                                    setWordSelection(context);
                                                                    setWordModalOpen(true);
                                                                }}
                                                            />
                                                        </div>
                                                        {sentence.transliteration_msa && (
                                                            <div className="text-base text-white/30 italic">
                                                                {sentence.transliteration_msa}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                <div className="text-white/60 text-base pt-1">
                                                    {sentence.english}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {/* Chat Tile - After Example Sentences */}
                        <ChatTile
                            word={item.word}
                            translation={item.translation}
                            context={enhancedData.word_context?.egyptian_usage}
                            savedMessages={chatMessages}
                            onMessagesChange={setChatMessages}
                        />
                    </div>
                )}
            </div>

            {/* Save Decision Panel for Arabic words */}
            {isArabic && !isLoadingEnhanced && (
                <div className="glass-card p-4">
                    <SaveDecisionPanel
                        primaryText={item.word}
                        translation={item.translation}
                        onDecision={(decision, memoryAid) => {
                            // Merge memory aid from tile with SaveDecisionPanel
                            const finalMemoryAid = {
                                note: memoryNote || memoryAid?.note,
                                imageUrl: memoryImageUrl || memoryAid?.imageUrl,
                            };
                            onContinue({ 
                                decision, 
                                memoryAid: finalMemoryAid,
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

            {/* Word Detail Modal */}
            {wordSelection && (
                <WordDetailModal
                    isOpen={wordModalOpen}
                    onClose={() => {
                        setWordModalOpen(false);
                        setWordSelection(null);
                    }}
                    selection={wordSelection}
                />
            )}

        </div>
    );
}
