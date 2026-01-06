import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { generateLessonContent } from '../../lib/openai';
import type { Language, MasteryLevel, ContentType, ArabicDialect } from '../../types';

interface LessonGeneratorProps {
    onLessonCreated: (lessonId?: string) => void;
    defaultLanguage?: Language;
    defaultContentType?: ContentType;
    externalOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
}

const CONTENT_TYPE_INFO: Record<ContentType, { label: string; description: string; icon: string }> = {
    word: { label: 'Words', description: 'Individual vocabulary', icon: 'Aa' },
    phrase: { label: 'Phrases', description: 'Common expressions', icon: '""' },
    dialog: { label: 'Dialog', description: 'Short conversations', icon: '💬' },
    paragraph: { label: 'Paragraphs', description: 'Reading passages', icon: '📄' },
};

export function LessonGenerator({
    onLessonCreated,
    defaultLanguage = 'arabic',
    defaultContentType,
    externalOpen,
    onOpenChange
}: LessonGeneratorProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const [topic, setTopic] = useState('');
    const [language, setLanguage] = useState<Language>(defaultLanguage);
    const [arabicDialect, setArabicDialect] = useState<ArabicDialect>('standard');
    const [level, setLevel] = useState<MasteryLevel>('new');
    const [contentType, setContentType] = useState<ContentType>(defaultContentType || 'word');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState<string>('');

    // Use external open state if provided, otherwise use internal
    const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
    const setIsOpen = (open: boolean) => {
        if (onOpenChange) {
            onOpenChange(open);
        } else {
            setInternalOpen(open);
        }
    };

    // Update language when defaultLanguage changes (e.g., user switches filter)
    useEffect(() => {
        setLanguage(defaultLanguage);
    }, [defaultLanguage]);

    // Update content type when defaultContentType changes
    useEffect(() => {
        if (defaultContentType) {
            setContentType(defaultContentType);
        }
    }, [defaultContentType]);

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!topic.trim()) return;

        setIsGenerating(true);
        setError(null);
        setStatus('Fetching your vocabulary...');

        try {
            // 0. Fetch user's saved words to exclude from new lessons
            const { data: savedWords } = await supabase
                .from('saved_words')
                .select('word')
                .limit(100);
            
            const excludeWords = savedWords?.map(w => w.word) || [];
            
            setStatus('Asking AI to create lesson...');

            // 1. Generate Content (excluding already-practiced words)
            const content = await generateLessonContent(topic, language, level, contentType, arabicDialect, excludeWords);

            setStatus('Saving to database...');

            // Estimate time based on content type
            const estimatedMinutes = contentType === 'word' ? 5
                : contentType === 'phrase' ? 7
                : contentType === 'dialog' ? 10
                : 15;

            // 2. Insert Lesson
            const { data: lessonData, error: lessonError } = await supabase
                .from('lessons')
                .insert({
                    title: content.title,
                    description: content.description,
                    language,
                    difficulty: level,
                    content_type: contentType,
                    estimated_minutes: estimatedMinutes,
                    vocab_count: content.items.length
                })
                .select()
                .single();

            if (lessonError) throw new Error(lessonError.message);
            if (!lessonData) throw new Error('Failed to create lesson');

            // 3. Insert Vocabulary/Content Items
            const vocabItems = content.items.map(item => ({
                lesson_id: lessonData.id,
                word: item.word,
                translation: item.translation,
                language,
                content_type: contentType,
                transliteration: item.transliteration,
                hebrew_cognate: item.hebrew_root ? {
                    root: item.hebrew_root,
                    meaning: item.hebrew_meaning,
                    notes: item.hebrew_note
                } : null,
                letter_breakdown: item.letter_breakdown || null,
                mastery_level: 'new' as const,
                times_practiced: 0
            }));

            const { error: vocabError } = await supabase
                .from('vocabulary_items')
                .insert(vocabItems);

            if (vocabError) throw new Error(vocabError.message);

            // Success - pass the lesson ID so we can navigate directly to exercise
            setIsOpen(false);
            setTopic('');
            onLessonCreated(lessonData.id);

        } catch (err) {
            console.error('Generation failed:', err);
            setError(err instanceof Error ? err.message : 'Failed to generate lesson');
        } finally {
            setIsGenerating(false);
            setStatus('');
        }
    };

    // Don't render anything when closed - menu handles the open trigger
    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <div className="glass-card w-full max-w-md p-6 relative animate-card-enter">
                <button
                    onClick={() => setIsOpen(false)}
                    className="absolute top-4 right-4 text-white/50 hover:text-white"
                    aria-label="Close"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <h2 className="text-2xl font-bold text-white mb-2">Create AI Lesson</h2>
                <div className="flex items-center gap-2 mb-6">
                    <span className="text-lg">{CONTENT_TYPE_INFO[contentType].icon}</span>
                    <span className="text-white/60">{CONTENT_TYPE_INFO[contentType].label}</span>
                    <span className="text-white/30">•</span>
                    <span className="text-white/60">{language === 'arabic' ? 'العربية' : 'Español'}</span>
                </div>

                <form onSubmit={handleGenerate} className="space-y-4">
                    <div>
                        <label className="block text-sm text-white/70 mb-1">Topic</label>
                        <input
                            type="text"
                            value={topic}
                            onChange={e => setTopic(e.target.value)}
                            placeholder={contentType === 'word' ? 'e.g. Colors, Animals, Food'
                                : contentType === 'phrase' ? 'e.g. Ordering at a restaurant'
                                : contentType === 'dialog' ? 'e.g. Meeting someone new'
                                : 'e.g. A day at the market'}
                            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm text-white/70 mb-1">Level</label>
                        <div className="flex gap-2">
                            {[
                                { value: 'new', label: 'Beginner' },
                                { value: 'learning', label: 'Intermediate' },
                                { value: 'practiced', label: 'Advanced' },
                            ].map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setLevel(opt.value as MasteryLevel)}
                                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                                        level === opt.value
                                            ? 'bg-white/20 text-white'
                                            : 'bg-white/5 text-white/50 hover:bg-white/10'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Arabic Dialect Selector - only show for Arabic */}
                    {language === 'arabic' && (
                        <div>
                            <label className="block text-sm text-white/70 mb-1">Dialect</label>
                            <div className="flex gap-2">
                                {[
                                    { value: 'standard', label: 'Standard (MSA)' },
                                    { value: 'egyptian', label: 'Egyptian' },
                                ].map(opt => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setArabicDialect(opt.value as ArabicDialect)}
                                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                                            arabicDialect === opt.value
                                                ? 'bg-teal-500/30 text-teal-300 border border-teal-500/50'
                                                : 'bg-white/5 text-white/50 hover:bg-white/10'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="p-3 bg-red-500/20 text-red-200 text-sm rounded-lg">
                            {error}
                        </div>
                    )}

                    {status && (
                        <div className="text-center text-white/70 text-sm animate-pulse">
                            {status}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isGenerating || !topic.trim()}
                        className="w-full touch-btn py-4 bg-white text-surface-300 font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                    >
                        {isGenerating ? 'Generating...' : 'Create Lesson'}
                    </button>
                </form>
            </div>
        </div>
    );
}
