import { useState } from 'react';
import { MemoryAidEditor } from './MemoryAidEditor';

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
    primaryText,
    translation,
    onDecision,
    alreadySaved = false,
    currentStatus,
    existingMemoryAid,
    compact = false,
}: SaveDecisionPanelProps) {
    // Memory aid state (temporary, before save)
    const [memoryImageUrl, setMemoryImageUrl] = useState<string | null>(existingMemoryAid?.imageUrl || null);
    const [memoryNote, setMemoryNote] = useState<string | null>(existingMemoryAid?.note || null);
    const [showMemoryAid, setShowMemoryAid] = useState(false);
    const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);

    // Handle decision with memory aids
    const handleDecision = (decision: SaveDecision) => {
        const memoryAid = (memoryImageUrl || memoryNote) 
            ? { note: memoryNote || undefined, imageUrl: memoryImageUrl || undefined }
            : undefined;
        onDecision(decision, memoryAid);
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

                {/* Memory Aid Display - Large image with Arabic word */}
                {existingMemoryAid?.imageUrl && (
                    <div className="glass-card p-4 bg-purple-500/10">
                        <div className="flex items-center gap-4">
                            <img 
                                src={existingMemoryAid.imageUrl} 
                                alt="Memory aid" 
                                className="w-32 h-32 rounded-xl object-cover flex-shrink-0"
                            />
                            <div className="flex-1">
                                <div className="text-4xl font-arabic text-white mb-2" dir="rtl">
                                    {primaryText}
                                </div>
                                <div className="text-lg text-white/70">
                                    {translation}
                                </div>
                                {existingMemoryAid.note && (
                                    <div className="text-sm text-purple-300/70 italic mt-2">
                                        📝 {existingMemoryAid.note}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Memory Aid Section for already-saved words */}
                {showMemoryAid ? (
                    <div className="glass-card p-3">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-purple-400/70 text-xs font-bold uppercase tracking-wider">
                                🧠 Memory Aid
                            </span>
                            <button
                                onClick={() => setShowMemoryAid(false)}
                                className="text-white/40 hover:text-white/60 text-xs"
                            >
                                Hide
                            </button>
                        </div>
                        <MemoryAidEditor
                            primaryText={primaryText}
                            translation={translation}
                            currentImageUrl={memoryImageUrl}
                            currentNote={memoryNote}
                            onImageGenerated={setMemoryImageUrl}
                            onNoteChanged={setMemoryNote}
                            compact
                        />
                    </div>
                ) : (
                    <button
                        onClick={() => setShowMemoryAid(true)}
                        className="w-full py-2 text-sm text-purple-300/70 hover:text-purple-300 transition-colors"
                    >
                        {existingMemoryAid?.imageUrl || existingMemoryAid?.note 
                            ? '🧠 View/Edit Memory Aid' 
                            : '🧠 Add Memory Aid'}
                    </button>
                )}

                {/* Remove confirmation */}
                {showRemoveConfirm ? (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 space-y-2">
                        <div className="text-red-300 text-sm text-center">Remove from vocabulary?</div>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => handleDecision('remove')}
                                className="py-2 bg-red-500/20 text-red-300 rounded-lg text-sm hover:bg-red-500/30"
                            >
                                Yes, Remove
                            </button>
                            <button
                                onClick={() => setShowRemoveConfirm(false)}
                                className="py-2 bg-white/10 text-white/60 rounded-lg text-sm hover:bg-white/20"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Status change buttons */}
                        <div className="grid grid-cols-2 gap-2">
                            {isPractice ? (
                                <button
                                    onClick={() => handleDecision('archive')}
                                    className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition-colors text-sm"
                                >
                                    <span>📦</span>
                                    <span>Move to Archive</span>
                                </button>
                            ) : (
                                <button
                                    onClick={() => handleDecision('practice')}
                                    className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 transition-colors text-sm"
                                >
                                    <span>📚</span>
                                    <span>Move to Practice</span>
                                </button>
                            )}
                            <button
                                onClick={() => setShowRemoveConfirm(true)}
                                className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-red-500/10 text-red-300/70 hover:bg-red-500/20 transition-colors text-sm"
                            >
                                <span>🗑️</span>
                                <span>Remove</span>
                            </button>
                        </div>
                    </>
                )}
                
                {/* Continue button */}
                <button
                    onClick={() => onDecision('discard')}
                    className="w-full py-4 text-lg font-semibold rounded-xl btn-primary"
                >
                    Continue
                </button>
            </div>
        );
    }

    return (
        <div className={`${compact ? 'space-y-3' : 'space-y-4'}`}>
            {/* Memory Aid Display - Large image with Arabic word (for new saves) */}
            {memoryImageUrl && !alreadySaved && (
                <div className="glass-card p-4 bg-purple-500/10 mb-3">
                    <div className="flex items-center gap-4">
                        <img 
                            src={memoryImageUrl} 
                            alt="Memory aid" 
                            className="w-32 h-32 rounded-xl object-cover flex-shrink-0"
                        />
                        <div className="flex-1">
                            <div className="text-4xl font-arabic text-white mb-2" dir="rtl">
                                {primaryText}
                            </div>
                            <div className="text-lg text-white/70">
                                {translation}
                            </div>
                            {memoryNote && (
                                <div className="text-sm text-purple-300/70 italic mt-2">
                                    📝 {memoryNote}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Memory Aid Section (collapsible) */}
            {showMemoryAid ? (
                <div className="glass-card p-3">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-purple-400/70 text-xs font-bold uppercase tracking-wider">
                            🧠 Memory Aid (Optional)
                        </span>
                        <button
                            onClick={() => setShowMemoryAid(false)}
                            className="text-white/40 hover:text-white/60 text-xs"
                        >
                            Hide
                        </button>
                    </div>
                    <MemoryAidEditor
                        primaryText={primaryText}
                        translation={translation}
                        currentImageUrl={memoryImageUrl}
                        currentNote={memoryNote}
                        onImageGenerated={setMemoryImageUrl}
                        onNoteChanged={setMemoryNote}
                        compact
                    />
                </div>
            ) : (
                <button
                    onClick={() => setShowMemoryAid(true)}
                    className="w-full py-2 text-sm text-purple-300/70 hover:text-purple-300 transition-colors"
                >
                    🧠 Add Memory Aid (optional)
                </button>
            )}

            {/* Memory aid indicators if added */}
            {(memoryImageUrl || memoryNote) && !showMemoryAid && (
                <div className="flex items-center justify-center gap-2 text-xs text-purple-300/60">
                    {memoryImageUrl && <span>🖼️ Visual added</span>}
                    {memoryNote && <span>📝 Note added</span>}
                </div>
            )}

            {/* Save Decision Buttons */}
            <div className={`grid grid-cols-3 gap-2 ${compact ? '' : 'pt-2'}`}>
                <button
                    onClick={() => handleDecision('practice')}
                    className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 transition-colors"
                >
                    <span className="text-lg">📚</span>
                    <span className={`font-medium ${compact ? 'text-xs' : 'text-sm'}`}>Save to Practice</span>
                </button>
                <button
                    onClick={() => handleDecision('archive')}
                    className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition-colors"
                >
                    <span className="text-lg">📦</span>
                    <span className={`font-medium ${compact ? 'text-xs' : 'text-sm'}`}>Save to Archive</span>
                </button>
                <button
                    onClick={() => handleDecision('discard')}
                    className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl bg-white/10 text-white/50 hover:bg-white/20 transition-colors"
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
