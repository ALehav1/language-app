import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { generateLessonContent } from '../../lib/openai';
import type { Language, MasteryLevel, ContentType } from '../../types';

interface LessonGeneratorProps {
    onLessonCreated: () => void;
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
        setStatus('Asking AI to create lesson...');

        try {
            // 1. Generate Content
            const content = await generateLessonContent(topic, language, level, contentType);

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

            // Success
            setIsOpen(false);
            setTopic('');
            onLessonCreated();

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="glass-card w-full max-w-md p-6 relative animate-card-enter">
                <button
                    onClick={() => setIsOpen(false)}
                    className="absolute top-4 right-4 text-white/50 hover:text-white"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <h2 className="text-2xl font-bold text-white mb-6">Create AI Lesson</h2>

                <form onSubmit={handleGenerate} className="space-y-4">
                    {/* Content Type Selector */}
                    <div>
                        <label className="block text-sm text-white/70 mb-2">What do you want to practice?</label>
                        <div className="grid grid-cols-2 gap-2">
                            {(Object.keys(CONTENT_TYPE_INFO) as ContentType[]).map(type => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setContentType(type)}
                                    className={`p-3 rounded-xl border text-left transition-all ${
                                        contentType === type
                                            ? 'bg-white/20 border-white/40 text-white'
                                            : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">{CONTENT_TYPE_INFO[type].icon}</span>
                                        <div>
                                            <div className="font-medium text-sm">{CONTENT_TYPE_INFO[type].label}</div>
                                            <div className="text-xs text-white/40">{CONTENT_TYPE_INFO[type].description}</div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

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

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm text-white/70 mb-1">Language</label>
                            <select
                                value={language}
                                onChange={e => setLanguage(e.target.value as Language)}
                                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white focus:outline-none focus:border-white/30 appearance-none"
                            >
                                <option value="spanish">Spanish</option>
                                <option value="arabic">Arabic</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm text-white/70 mb-1">Level</label>
                            <select
                                value={level}
                                onChange={e => setLevel(e.target.value as MasteryLevel)}
                                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white focus:outline-none focus:border-white/30 appearance-none"
                            >
                                <option value="new">Beginner</option>
                                <option value="learning">Intermediate</option>
                                <option value="practiced">Advanced</option>
                            </select>
                        </div>
                    </div>

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
