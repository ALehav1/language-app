import { useState } from 'react';

/**
 * Save decision options for vocabulary items.
 * - practice: Save to active practice queue (will appear in lessons)
 * - archive: Save for reference only (won't appear in practice)
 * - discard: Don't save this item
 * - remove: Remove from library (only for already-saved items)
 */
export type SaveDecision = 'practice' | 'archive' | 'discard' | 'remove';

/**
 * Props for SaveDecisionPanel component.
 */
interface SaveDecisionPanelProps {
    // Content info for display and memory aid generation
    primaryText: string;      // Arabic word/sentence
    translation: string;      // English translation
    
    // Callback when user makes a decision
    onDecision: (decision: SaveDecision, memoryAid?: { note?: string; imageUrl?: string }) => void;
    
    // Optional: show as already saved (for items that exist)
    alreadySaved?: boolean;
    
    // Optional: current status of saved word (for already-saved items)
    currentStatus?: 'active' | 'learned';
    
    // Optional: existing memory aid data (for already-saved items)
    existingMemoryAid?: { note?: string; imageUrl?: string };
    
    // Optional: compact mode
    compact?: boolean;
}

/**
 * SaveDecisionPanel - Explicit save control for vocabulary items.
 * 
 * Flow:
 * 1. User can optionally add memory aids (image + note)
 * 2. User chooses: Practice (active) / Archive (reference) / Discard
 * 
 * This replaces auto-save behavior with explicit user control.
 */
export function SaveDecisionPanel({
    onDecision,
    alreadySaved = false,
    currentStatus,
    compact = false,
}: SaveDecisionPanelProps) {
    const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingDecision, setLoadingDecision] = useState<SaveDecision | null>(null);
    const [justSaved, setJustSaved] = useState<SaveDecision | null>(null);

    // Handle decision
    const handleDecision = async (decision: SaveDecision) => {
        setIsLoading(true);
        setLoadingDecision(decision);
        setJustSaved(null);
        
        try {
            await onDecision(decision);
            setJustSaved(decision);
            setTimeout(() => setJustSaved(null), 2000);
        } finally {
            setIsLoading(false);
            setLoadingDecision(null);
        }
    };

    // For already-saved words, show different UI with options
    if (alreadySaved) {
        const isPractice = currentStatus === 'active';
        
        return (
            <div className="space-y-3">
                {/* Status indicator */}
                <div className={`${compact ? 'p-2' : 'p-3'} bg-green-500/10 rounded-xl border border-green-500/30`}>
                    <div className="text-green-300 text-sm">
                        ✓ In your vocabulary
                        <span className="text-white/40 ml-2">
                            ({isPractice ? '📚 Practice' : '📦 Archive'})
                        </span>
                    </div>
                </div>

                {/* Remove confirmation */}
                {showRemoveConfirm ? (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 space-y-2">
                        <div className="text-red-300 text-sm text-center">Remove from vocabulary?</div>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => handleDecision('remove')}
                                className="py-2 bg-red-500/20 text-red-300 rounded-lg text-sm hover:bg-red-500/30 active:scale-95 active:bg-red-500/40 transition-all duration-100"
                            >
                                Yes, Remove
                            </button>
                            <button
                                onClick={() => setShowRemoveConfirm(false)}
                                className="py-2 bg-white/10 text-white/60 rounded-lg text-sm hover:bg-white/20 active:scale-95 active:bg-white/30 transition-all duration-100"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Save buttons - always show both options */}
                        <div className="grid grid-cols-3 gap-2">
                            <button
                                onClick={() => handleDecision('practice')}
                                disabled={isLoading}
                                className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 active:scale-95 active:bg-teal-500/40 transition-all duration-100 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading && loadingDecision === 'practice' ? (
                                    <span className="animate-spin">⏳</span>
                                ) : justSaved === 'practice' ? (
                                    <span className="text-green-400">✓</span>
                                ) : (
                                    <span>📚</span>
                                )}
                                <span>{justSaved === 'practice' ? 'Saved!' : 'Save to Practice'}</span>
                            </button>
                            <button
                                onClick={() => handleDecision('archive')}
                                disabled={isLoading}
                                className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 active:scale-95 active:bg-amber-500/40 transition-all duration-100 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading && loadingDecision === 'archive' ? (
                                    <span className="animate-spin">⏳</span>
                                ) : justSaved === 'archive' ? (
                                    <span className="text-green-400">✓</span>
                                ) : (
                                    <span>📦</span>
                                )}
                                <span>{justSaved === 'archive' ? 'Saved!' : 'Save to Archive'}</span>
                            </button>
                            <button
                                onClick={() => setShowRemoveConfirm(true)}
                                disabled={isLoading}
                                className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-red-500/10 text-red-300/70 hover:bg-red-500/20 active:scale-95 active:bg-red-500/30 transition-all duration-100 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span>🗑️</span>
                                <span>Delete</span>
                            </button>
                        </div>
                    </>
                )}
            </div>
        );
    }

    return (
        <div className={`${compact ? 'space-y-3' : 'space-y-4'}`}>
            {/* Save Decision Buttons */}
            <div className={`grid grid-cols-3 gap-2 ${compact ? '' : 'pt-2'}`}>
                <button
                    onClick={() => handleDecision('practice')}
                    disabled={isLoading}
                    className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 active:scale-95 active:bg-teal-500/40 transition-all duration-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading && loadingDecision === 'practice' ? (
                        <span className="text-lg animate-spin">⏳</span>
                    ) : justSaved === 'practice' ? (
                        <span className="text-lg text-green-400">✓</span>
                    ) : (
                        <span className="text-lg">📚</span>
                    )}
                    <span className={`font-medium ${compact ? 'text-xs' : 'text-sm'}`}>
                        {justSaved === 'practice' ? 'Saved!' : 'Save to Practice'}
                    </span>
                </button>
                <button
                    onClick={() => handleDecision('archive')}
                    disabled={isLoading}
                    className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 active:scale-95 active:bg-amber-500/40 transition-all duration-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading && loadingDecision === 'archive' ? (
                        <span className="text-lg animate-spin">⏳</span>
                    ) : justSaved === 'archive' ? (
                        <span className="text-lg text-green-400">✓</span>
                    ) : (
                        <span className="text-lg">📦</span>
                    )}
                    <span className={`font-medium ${compact ? 'text-xs' : 'text-sm'}`}>
                        {justSaved === 'archive' ? 'Saved!' : 'Save to Archive'}
                    </span>
                </button>
                <button
                    onClick={() => handleDecision('discard')}
                    className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl bg-white/10 text-white/50 hover:bg-white/20 active:scale-95 active:bg-white/30 transition-all duration-100"
                >
                    <span className="text-lg">⏭️</span>
                    <span className={`font-medium ${compact ? 'text-xs' : 'text-sm'}`}>Skip</span>
                </button>
            </div>

            {/* Help text */}
            <div className={`text-center text-white/30 ${compact ? 'text-xs' : 'text-xs'}`}>
                Practice = actively learning • Archive = know it, save for reference • Skip = don't save
            </div>
        </div>
    );
}
