import { useState } from 'react';
import type { WordContext } from '../lib/openai';
import type { Language } from '../types';

interface ContextTileProps {
    context?: WordContext;
    language: Language;
}

export function ContextTile({ context, language }: ContextTileProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    if (!context) return null;

    const hasContent = context.root || context.egyptian_usage || context.msa_comparison || context.cultural_notes;
    if (!hasContent) return null;

    return (
        <div className="glass-card overflow-hidden">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <span className="text-lg">📚</span>
                    <span className="font-semibold text-white">Context</span>
                </div>
                <svg
                    className={`w-5 h-5 text-white/60 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {isExpanded && (
                <div className="px-4 pb-4 space-y-3 text-sm">
                    {context.root && (
                        <div>
                            <div className="text-teal-400 font-medium mb-1">Root</div>
                            <div className="text-white/80">{context.root}</div>
                        </div>
                    )}
                    {context.egyptian_usage && (
                        <div>
                            <div className="text-amber-400 font-medium mb-1">
                                {language === 'arabic' ? 'Egyptian Usage' : 'Usage Notes'}
                            </div>
                            <div className="text-white/80">{context.egyptian_usage}</div>
                        </div>
                    )}
                    {context.msa_comparison && language === 'arabic' && (
                        <div>
                            <div className="text-blue-400 font-medium mb-1">MSA Comparison</div>
                            <div className="text-white/80">{context.msa_comparison}</div>
                        </div>
                    )}
                    {context.cultural_notes && (
                        <div>
                            <div className="text-purple-400 font-medium mb-1">Cultural Notes</div>
                            <div className="text-white/80">{context.cultural_notes}</div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
