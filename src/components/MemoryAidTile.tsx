import { useState } from 'react';
import { MemoryAidEditor } from './MemoryAidEditor';

interface MemoryAidTileProps {
    primaryText: string;
    translation: string;
    currentNote: string | null;
    currentImageUrl: string | null;
    onImageGenerated: (imageUrl: string) => void;
    onNoteChanged: (note: string | null) => void;
}

export function MemoryAidTile({
    primaryText,
    translation,
    currentNote,
    currentImageUrl,
    onImageGenerated,
    onNoteChanged,
}: MemoryAidTileProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="glass-card overflow-hidden">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <span className="text-lg">🎨</span>
                    <span className="font-semibold text-white">Memory Aid</span>
                    {(currentNote || currentImageUrl) && (
                        <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full">
                            Saved
                        </span>
                    )}
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
                <div className="px-4 pb-4">
                    <MemoryAidEditor
                        primaryText={primaryText}
                        translation={translation}
                        currentNote={currentNote}
                        currentImageUrl={currentImageUrl}
                        onImageGenerated={onImageGenerated}
                        onNoteChanged={onNoteChanged}
                    />
                </div>
            )}
        </div>
    );
}
