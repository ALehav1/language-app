import { useState } from 'react';
import type { WordContext, SpanishWordContext } from '../lib/openai';
import type { Language } from '../types';

interface ContextTileProps {
    context?: WordContext | SpanishWordContext;
    language: Language;
}

export function ContextTile({ context, language }: ContextTileProps) {
    const [isExpanded, setIsExpanded] = useState(true);

    if (!context) return null;

    // Check for content based on language
    const isSpanish = language === 'spanish';
    const spanishContext = context as SpanishWordContext;
    const arabicContext = context as WordContext;
    
    const hasContent = isSpanish
        ? (spanishContext.usage_notes || spanishContext.latam_notes || spanishContext.spain_notes || spanishContext.etymology)
        : (arabicContext.root || arabicContext.egyptian_usage || arabicContext.msa_comparison || arabicContext.cultural_notes);
    
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
                    {/* Spanish context fields */}
                    {isSpanish && spanishContext.usage_notes && (
                        <div>
                            <div className="text-amber-400 font-medium mb-1">Usage Notes</div>
                            <div className="text-white/80">{spanishContext.usage_notes}</div>
                        </div>
                    )}
                    {isSpanish && spanishContext.latam_notes && (
                        <div>
                            <div className="text-teal-400 font-medium mb-1">🌎 Latin America</div>
                            <div className="text-white/80">{spanishContext.latam_notes}</div>
                        </div>
                    )}
                    {isSpanish && spanishContext.spain_notes && (
                        <div>
                            <div className="text-red-400 font-medium mb-1">🇪🇸 Spain</div>
                            <div className="text-white/80">{spanishContext.spain_notes}</div>
                        </div>
                    )}
                    {isSpanish && spanishContext.etymology && (
                        <div>
                            <div className="text-purple-400 font-medium mb-1">Etymology</div>
                            <div className="text-white/80 italic">{spanishContext.etymology}</div>
                        </div>
                    )}
                    
                    {/* Arabic context fields */}
                    {!isSpanish && arabicContext.root && (
                        <div>
                            <div className="text-teal-400 font-medium mb-1">Root</div>
                            <div className="text-white/80">{arabicContext.root}</div>
                        </div>
                    )}
                    {!isSpanish && arabicContext.egyptian_usage && (
                        <div>
                            <div className="text-amber-400 font-medium mb-1">Egyptian Usage</div>
                            <div className="text-white/80">{arabicContext.egyptian_usage}</div>
                        </div>
                    )}
                    {!isSpanish && arabicContext.msa_comparison && (
                        <div>
                            <div className="text-blue-400 font-medium mb-1">MSA Comparison</div>
                            <div className="text-white/80">{arabicContext.msa_comparison}</div>
                        </div>
                    )}
                    {!isSpanish && arabicContext.cultural_notes && (
                        <div>
                            <div className="text-purple-400 font-medium mb-1">Cultural Notes</div>
                            <div className="text-white/80">{arabicContext.cultural_notes}</div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
