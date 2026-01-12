import type { VocabularyItem, ContentType } from '../../types';

interface ExercisePromptProps {
    item: VocabularyItem;
    questionNumber: number;
    totalQuestions: number;
}

const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
    word: 'Write in English',
    sentence: 'Write in English',
    dialog: 'Write in English',
    passage: 'Write in English',
};

/**
 * Displays the current vocabulary item to translate.
 * Adapts layout based on content type (word, phrase, dialog, paragraph).
 */
export function ExercisePrompt({ item, questionNumber, totalQuestions }: ExercisePromptProps) {
    const isArabic = item.language === 'arabic';
    const contentType = item.content_type || 'word';

    // Determine text size based on content type and length
    const getTextSize = () => {
        const length = item.word.length;
        if (contentType === 'word') {
            return 'text-5xl lg:text-7xl';
        }
        if (contentType === 'sentence') {
            return length > 30 ? 'text-2xl lg:text-3xl' : 'text-3xl lg:text-4xl';
        }
        if (contentType === 'dialog') {
            return length > 50 ? 'text-xl lg:text-2xl' : 'text-2xl lg:text-3xl';
        }
        // paragraph
        return 'text-lg lg:text-xl leading-relaxed';
    };

    // Type assertion for dialog fields that may exist
    const dialogItem = item as VocabularyItem & { speaker?: string; context?: string };

    return (
        <div className="glass-card p-6 lg:p-8 space-y-4">
            {/* Progress indicator - hidden on desktop (shown in sidebar) */}
            <div className="flex items-center justify-between text-sm lg:hidden">
                <span className="text-white/50">
                    Question {questionNumber} of {totalQuestions}
                </span>
                <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${isArabic
                            ? 'bg-teal-500/20 text-teal-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                >
                    {isArabic ? 'العربية' : 'Español'}
                </span>
            </div>

            {/* Language badge - desktop only (centered) */}
            <div className="hidden lg:flex justify-center gap-2">
                <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${isArabic
                            ? 'bg-teal-500/20 text-teal-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                >
                    {isArabic ? 'العربية' : 'Español'}
                </span>
                {contentType !== 'word' && (
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-white/10 text-white/60 capitalize">
                        {contentType}
                    </span>
                )}
            </div>

            {/* Dialog speaker indicator */}
            {contentType === 'dialog' && dialogItem.speaker && (
                <div className="flex justify-center">
                    <span className="px-4 py-1 rounded-full bg-purple-500/20 text-purple-300 text-sm font-medium">
                        Speaker {dialogItem.speaker}
                        {dialogItem.context && (
                            <span className="text-purple-300/60 ml-2 italic">({dialogItem.context})</span>
                        )}
                    </span>
                </div>
            )}

            {/* Main content */}
            <div className={`text-center ${contentType === 'passage' ? 'py-4 lg:py-6' : 'py-8 lg:py-12'}`}>
                <p
                    className={`${getTextSize()} font-bold text-white mb-4 ${isArabic ? 'font-arabic' : ''}`}
                    dir={isArabic ? 'rtl' : 'ltr'}
                >
                    {item.word}
                </p>
            </div>

            {/* Instruction */}
            <p className="text-center text-white/50 text-sm lg:text-base">
                {CONTENT_TYPE_LABELS[contentType]}
            </p>
        </div>
    );
}
