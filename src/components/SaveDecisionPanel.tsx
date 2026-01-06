import { useState } from 'react';
import { MemoryAidEditor } from './MemoryAidEditor';

/**
 * Save decision options for vocabulary items.
 * - practice: Save to active practice queue (will appear in lessons)
 * - archive: Save for reference only (won't appear in practice)
 * - discard: Don't save this item
 */
export type SaveDecision = 'practice' | 'archive' | 'discard';

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
    compact = false,
}: SaveDecisionPanelProps) {
    // Memory aid state (temporary, before save)
    const [memoryImageUrl, setMemoryImageUrl] = useState<string | null>(null);
    const [memoryNote, setMemoryNote] = useState<string | null>(null);
    const [showMemoryAid, setShowMemoryAid] = useState(false);

    // Handle decision with memory aids
    const handleDecision = (decision: SaveDecision) => {
        const memoryAid = (memoryImageUrl || memoryNote) 
            ? { note: memoryNote || undefined, imageUrl: memoryImageUrl || undefined }
            : undefined;
        onDecision(decision, memoryAid);
    };

    if (alreadySaved) {
        return (
            <div className={`${compact ? 'p-2' : 'p-4'} bg-green-500/10 rounded-xl border border-green-500/30`}>
                <div className="text-green-300 text-sm text-center">
                    ✓ Already saved
                </div>
            </div>
        );
    }

    return (
        <div className={`${compact ? 'space-y-3' : 'space-y-4'}`}>
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
                    <span className={`font-medium ${compact ? 'text-xs' : 'text-sm'}`}>Practice</span>
                </button>
                <button
                    onClick={() => handleDecision('archive')}
                    className="flex flex-col items-center gap-1 py-3 px-2 rounded-xl bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition-colors"
                >
                    <span className="text-lg">📦</span>
                    <span className={`font-medium ${compact ? 'text-xs' : 'text-sm'}`}>Archive</span>
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
                Practice = active learning • Archive = reference only • Skip = don't save
            </div>
        </div>
    );
}
