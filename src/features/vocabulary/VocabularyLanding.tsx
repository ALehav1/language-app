import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../contexts/LanguageContext';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import type { ContentType, WordStatus } from '../../types';

type VocabularyMode = 'practice' | 'archive';

const CONTENT_TYPE_INFO: Record<ContentType, { label: string; icon: string }> = {
    word: { label: 'Words', icon: 'Aa' },
    sentence: { label: 'Sentences', icon: '""' },
    dialog: { label: 'Dialogs', icon: '💬' },
    passage: { label: 'Passages', icon: '📄' },
};

interface TypeCounts {
    word: number;
    sentence: number;
    dialog: number;
    passage: number;
}

export function VocabularyLanding() {
    const navigate = useNavigate();
    const { language } = useLanguage();
    const [mode, setMode] = useState<VocabularyMode>('practice');
    const [practiceCounts, setPracticeCounts] = useState<TypeCounts>({ word: 0, sentence: 0, dialog: 0, passage: 0 });
    const [archiveCounts, setArchiveCounts] = useState<TypeCounts>({ word: 0, sentence: 0, dialog: 0, passage: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchCounts() {
            setLoading(true);
            const status: WordStatus = mode === 'practice' ? 'active' : 'learned';
            
            const counts: TypeCounts = { word: 0, sentence: 0, dialog: 0, passage: 0 };

            // Words (from saved_words table, single-word entries only)
            const { count: wordCount } = await supabase
                .from('saved_words')
                .select('*', { count: 'exact', head: true })
                .eq('status', status)
                .eq('language', language);
            counts.word = wordCount || 0;

            // Sentences (from saved_sentences table)
            try {
                const { count: sentenceCount } = await supabase
                    .from('saved_sentences')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', status)
                    .eq('language', language);
                counts.sentence = sentenceCount || 0;
            } catch {
                counts.sentence = 0;
            }

            // Dialogs (from saved_dialogs table if exists)
            try {
                const { count: dialogCount } = await supabase
                    .from('saved_dialogs')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', status)
                    .eq('language', language);
                counts.dialog = dialogCount || 0;
            } catch {
                counts.dialog = 0;
            }

            // Passages (from saved_passages table)
            try {
                const { count: passageCount } = await supabase
                    .from('saved_passages')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', status)
                    .eq('source_language', language);
                counts.passage = passageCount || 0;
            } catch {
                counts.passage = 0;
            }

            if (mode === 'practice') {
                setPracticeCounts(counts);
            } else {
                setArchiveCounts(counts);
            }
            setLoading(false);
        }
        fetchCounts();
    }, [mode, language]);

    const currentCounts = mode === 'practice' ? practiceCounts : archiveCounts;
    const contentTypes: ContentType[] = ['word', 'sentence', 'dialog', 'passage'];

    const handleTypeClick = (type: ContentType) => {
        navigate(`/vocabulary/${type}?mode=${mode}`);
    };

    return (
        <div className="min-h-screen bg-surface-300 pb-24">
            {/* Header with back button and language switcher */}
            <header className="sticky top-0 z-10 bg-surface-300/95 backdrop-blur-sm border-b border-white/10 px-4 py-3 mb-6">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        <span className="text-sm font-medium">Back</span>
                    </button>
                    <LanguageSwitcher />
                </div>
            </header>

            <div className="px-6">
            {/* Mode Selector */}
            <div className="mb-8">
                <div className="flex gap-2 bg-white/5 p-1 rounded-xl">
                    <button
                        onClick={() => setMode('practice')}
                        className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                            mode === 'practice'
                                ? 'bg-teal-500/30 text-teal-300 border border-teal-500/50'
                                : 'text-white/50 hover:text-white/70'
                        }`}
                    >
                        Practice
                    </button>
                    <button
                        onClick={() => setMode('archive')}
                        className={`flex-1 py-3 rounded-lg font-medium transition-all ${
                            mode === 'archive'
                                ? 'bg-amber-500/30 text-amber-300 border border-amber-500/50'
                                : 'text-white/50 hover:text-white/70'
                        }`}
                    >
                        Archive
                    </button>
                </div>
                <p className="text-sm text-white/50 mt-2 text-center">
                    {mode === 'practice' 
                        ? 'Items you\'re actively practicing'
                        : 'Items you\'ve mastered and archived'}
                </p>
            </div>

            {/* Type Tiles */}
            <div className="space-y-3">
                {loading ? (
                    <div className="text-center text-white/50 py-8">Loading...</div>
                ) : (
                    contentTypes.map((type) => {
                        const info = CONTENT_TYPE_INFO[type];
                        const count = currentCounts[type];
                        
                        return (
                            <button
                                key={type}
                                onClick={() => handleTypeClick(type)}
                                className="w-full p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-200 flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="text-3xl">{info.icon}</div>
                                    <div className="text-left">
                                        <h3 className="text-lg font-semibold text-white">{info.label}</h3>
                                        <p className="text-sm text-white/50">{count} items</p>
                                    </div>
                                </div>
                                <svg 
                                    className="w-5 h-5 text-white/30 group-hover:text-white/60 transition-colors" 
                                    fill="none" 
                                    stroke="currentColor" 
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        );
                    })
                )}
            </div>
            </div>
        </div>
    );
}
