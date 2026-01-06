import { useState } from 'react';
import { generateMemoryImage } from '../lib/openai';

/**
 * Props for MemoryAidEditor component.
 * Used for words, sentences, and passages.
 */
interface MemoryAidEditorProps {
    // Content to generate image for
    primaryText: string;      // Arabic word/sentence or English text
    translation: string;      // English translation or Arabic translation
    
    // Current values (for editing existing)
    currentImageUrl?: string | null;
    currentNote?: string | null;
    
    // Callbacks
    onImageGenerated: (imageDataUrl: string) => void;
    onNoteChanged: (note: string | null) => void;
    
    // Optional: compact mode for inline use
    compact?: boolean;
}

/**
 * MemoryAidEditor - Reusable component for adding/editing memory aids.
 * Supports:
 * - Custom image prompts
 * - Note editing
 * - Regenerating images with different prompts
 */
export function MemoryAidEditor({
    primaryText,
    translation,
    currentImageUrl,
    currentNote,
    onImageGenerated,
    onNoteChanged,
    compact = false,
}: MemoryAidEditorProps) {
    // Image generation state
    const [generatingImage, setGeneratingImage] = useState(false);
    const [showCustomPrompt, setShowCustomPrompt] = useState(false);
    const [customPrompt, setCustomPrompt] = useState('');
    
    // Note editing state
    const [editingNote, setEditingNote] = useState(false);
    const [noteText, setNoteText] = useState(currentNote || '');

    // Generate image with optional custom prompt
    const handleGenerateImage = async (useCustomPrompt = false) => {
        setGeneratingImage(true);
        try {
            // If custom prompt provided, pass it as context
            const context = useCustomPrompt && customPrompt.trim() 
                ? customPrompt.trim() 
                : undefined;
            
            const imageData = await generateMemoryImage(primaryText, translation, context);
            if (imageData) {
                const dataUrl = `data:image/png;base64,${imageData}`;
                onImageGenerated(dataUrl);
                setShowCustomPrompt(false);
                setCustomPrompt('');
            }
        } catch (err) {
            console.error('Failed to generate image:', err);
            alert('Failed to generate image. Please try again.');
        } finally {
            setGeneratingImage(false);
        }
    };

    // Save note
    const handleSaveNote = () => {
        onNoteChanged(noteText.trim() || null);
        setEditingNote(false);
    };

    return (
        <div className={`${compact ? 'space-y-2' : 'space-y-4'}`}>
            {/* Section header */}
            {!compact && (
                <div className="text-purple-400/70 text-xs font-bold uppercase tracking-wider">
                    🧠 Memory Aids
                </div>
            )}
            
            {/* Memory Image */}
            <div>
                {currentImageUrl ? (
                    <div className="relative">
                        <img 
                            src={currentImageUrl} 
                            alt="Memory aid visual"
                            className={`w-full ${compact ? 'h-32' : 'h-48'} object-cover rounded-lg`}
                        />
                        {/* Regenerate button */}
                        <button
                            onClick={() => setShowCustomPrompt(true)}
                            disabled={generatingImage}
                            className="absolute top-2 right-2 px-2 py-1 bg-black/50 text-white/80 text-xs rounded hover:bg-black/70"
                            title="Generate new image"
                        >
                            {generatingImage ? '...' : '🔄'}
                        </button>
                    </div>
                ) : showCustomPrompt ? (
                    // Custom prompt input
                    <div className="space-y-2">
                        <textarea
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                            placeholder={`Describe what image would help you remember "${translation}"...`}
                            className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 resize-none text-sm"
                            rows={2}
                            autoFocus
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleGenerateImage(true)}
                                disabled={generatingImage}
                                className="flex-1 py-2 bg-purple-500/20 text-purple-300 rounded-lg text-sm hover:bg-purple-500/30 disabled:opacity-50"
                            >
                                {generatingImage ? '⏳ Generating...' : '🎨 Generate'}
                            </button>
                            <button
                                onClick={() => handleGenerateImage(false)}
                                disabled={generatingImage}
                                className="px-3 py-2 bg-white/10 text-white/60 rounded-lg text-sm hover:bg-white/20 disabled:opacity-50"
                                title="Use default prompt"
                            >
                                Auto
                            </button>
                            <button
                                onClick={() => {
                                    setShowCustomPrompt(false);
                                    setCustomPrompt('');
                                }}
                                className="px-3 py-2 bg-white/10 text-white/50 rounded-lg text-sm hover:bg-white/20"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                ) : (
                    // Generate button
                    <button
                        onClick={() => setShowCustomPrompt(true)}
                        disabled={generatingImage}
                        className={`w-full ${compact ? 'py-2 text-sm' : 'py-4'} border-2 border-dashed border-white/20 rounded-lg text-white/50 hover:border-purple-500/50 hover:text-purple-300 transition-colors`}
                    >
                        {generatingImage ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="animate-spin">⏳</span> Generating...
                            </span>
                        ) : (
                            '🎨 Generate Visual'
                        )}
                    </button>
                )}
                
                {/* Custom prompt option when image exists */}
                {currentImageUrl && showCustomPrompt && (
                    <div className="mt-2 space-y-2">
                        <textarea
                            value={customPrompt}
                            onChange={(e) => setCustomPrompt(e.target.value)}
                            placeholder="Describe a different image..."
                            className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 resize-none text-sm"
                            rows={2}
                            autoFocus
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleGenerateImage(true)}
                                disabled={generatingImage || !customPrompt.trim()}
                                className="flex-1 py-1.5 bg-purple-500/20 text-purple-300 rounded-lg text-xs hover:bg-purple-500/30 disabled:opacity-50"
                            >
                                {generatingImage ? '⏳...' : 'Generate with Custom Prompt'}
                            </button>
                            <button
                                onClick={() => {
                                    setShowCustomPrompt(false);
                                    setCustomPrompt('');
                                }}
                                className="px-3 py-1.5 bg-white/10 text-white/50 rounded-lg text-xs"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Memory Note */}
            <div>
                {editingNote ? (
                    <div className="space-y-2">
                        <textarea
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            placeholder="Add a note to help you remember..."
                            className={`w-full p-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 resize-none ${compact ? 'text-sm' : ''}`}
                            rows={compact ? 2 : 3}
                            autoFocus
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={handleSaveNote}
                                className={`flex-1 ${compact ? 'py-1.5 text-xs' : 'py-2 text-sm'} bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30`}
                            >
                                Save Note
                            </button>
                            <button
                                onClick={() => {
                                    setNoteText(currentNote || '');
                                    setEditingNote(false);
                                }}
                                className={`px-3 ${compact ? 'py-1.5 text-xs' : 'py-2 text-sm'} bg-white/10 text-white/50 rounded-lg hover:bg-white/20`}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        onClick={() => {
                            setNoteText(currentNote || '');
                            setEditingNote(true);
                        }}
                        className={`w-full text-left ${compact ? 'p-2' : 'p-3'} bg-white/5 rounded-lg hover:bg-white/10 transition-colors`}
                    >
                        {currentNote ? (
                            <div className={`text-white/80 ${compact ? 'text-xs' : 'text-sm'}`}>{currentNote}</div>
                        ) : (
                            <div className={`text-white/40 italic ${compact ? 'text-xs' : 'text-sm'}`}>📝 Add a memory note...</div>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}
