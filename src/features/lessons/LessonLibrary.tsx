import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLessons } from '../../hooks/useLessons';
import { LessonGenerator } from './LessonGenerator';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useToast } from '../../contexts/ToastContext';
import { supabase } from '../../lib/supabase';
import { useLanguage } from '../../contexts/LanguageContext';
import type { ContentType, Lesson } from '../../types';

const CONTENT_TYPE_INFO: Record<ContentType, { label: string; icon: string; itemLabel: string }> = {
    word: { label: 'Words', icon: 'Aa', itemLabel: '7 items' },
    sentence: { label: 'Sentences', icon: '""', itemLabel: '5 items' },
    dialog: { label: 'Dialogs', icon: '💬', itemLabel: '4 turns' },
    passage: { label: 'Passages', icon: '📄', itemLabel: '2 passages' },
};

export function LessonLibrary() {
    const navigate = useNavigate();
    const { language } = useLanguage();
    const [generatorOpen, setGeneratorOpen] = useState(false);
    const [selectedContentType, setSelectedContentType] = useState<ContentType>('word');
    const [viewingSavedCategory, setViewingSavedCategory] = useState<ContentType | null>(null);
    
    // Lesson management state
    const [lessonToDelete, setLessonToDelete] = useState<Lesson | null>(null);
    const [lessonToEdit, setLessonToEdit] = useState<Lesson | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    const { showToast } = useToast();

    const { lessons, loading, error, refetch } = useLessons({
        language,
    });

    // Sort lessons chronologically (newest first)
    const sortedLessons = [...lessons].sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
    });

    const handleCreateLesson = (contentType: ContentType) => {
        setSelectedContentType(contentType);
        setGeneratorOpen(true);
    };

    const handleStartLesson = (lessonId: string) => {
        navigate(`/exercise/${lessonId}`);
    };

    // Delete lesson handler
    const handleDeleteLesson = async () => {
        if (!lessonToDelete) return;

        setIsDeleting(true);
        try {
            // Delete lesson from database (vocabulary_items cascade delete automatically)
            const { error } = await supabase
                .from('lessons')
                .delete()
                .eq('id', lessonToDelete.id);

            if (error) throw error;

            // Refresh lesson list
            await refetch();
            setLessonToDelete(null);
        } catch (err) {
            console.error('Failed to delete lesson:', err);
            showToast({ type: 'error', message: 'Failed to delete lesson. Please try again.' });
        } finally {
            setIsDeleting(false);
        }
    };

    // Edit lesson handler
    const handleEditLesson = async () => {
        if (!lessonToEdit) return;

        setIsUpdating(true);
        try {
            // Update lesson in database
            const { error } = await supabase
                .from('lessons')
                .update({
                    title: editTitle,
                    description: editDescription,
                })
                .eq('id', lessonToEdit.id);

            if (error) throw error;

            // Refresh lesson list
            await refetch();
            setLessonToEdit(null);
            setEditTitle('');
            setEditDescription('');
        } catch (err) {
            console.error('Failed to update lesson:', err);
            showToast({ type: 'error', message: 'Failed to update lesson. Please try again.' });
        } finally {
            setIsUpdating(false);
        }
    };

    // Open edit dialog with lesson data
    const openEditDialog = (lesson: Lesson) => {
        setLessonToEdit(lesson);
        setEditTitle(lesson.title);
        setEditDescription(lesson.description);
    };

    return (
        <div className="min-h-screen bg-surface-300 pb-24">
            {/* Header with back button and language switcher */}
            <header className="sticky top-0 z-10 bg-surface-300/95 backdrop-blur-sm border-b border-white/10 px-4 py-3">
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

            <div className="p-4 pb-8 space-y-4">
                {/* View Saved Lessons - Category Filtered */}
                {viewingSavedCategory && (
                    <div className="fixed inset-0 z-50 bg-surface-300 overflow-y-auto">
                        <div className="min-h-screen">
                            {/* Header */}
                            <header className="px-4 pt-4 pb-2 sticky top-0 bg-surface-300/95 backdrop-blur-sm z-10">
                                <div className="flex items-center justify-between">
                                    <button
                                        onClick={() => setViewingSavedCategory(null)}
                                        className="touch-btn w-10 h-10 bg-white/10 text-white hover:bg-white/20 flex items-center justify-center rounded-xl"
                                        aria-label="Back to categories"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    <h1 className="text-lg font-bold text-white">
                                        {CONTENT_TYPE_INFO[viewingSavedCategory].label}
                                    </h1>
                                    <div className="w-10" />
                                </div>
                            </header>

                            {/* Filtered Lessons */}
                            <div className="px-4 pb-8 space-y-2">
                                {loading ? (
                                    <div className="space-y-2">
                                        <div className="skeleton h-12 rounded-lg" />
                                        <div className="skeleton h-12 rounded-lg" />
                                    </div>
                                ) : error ? (
                                    <div className="glass-card p-3 text-center">
                                        <div className="text-red-400 text-sm mb-2">Failed to load lessons</div>
                                        <button
                                            onClick={() => refetch()}
                                            className="text-white/60 text-xs hover:text-white"
                                        >
                                            Try again
                                        </button>
                                    </div>
                                ) : sortedLessons.filter(l => l.contentType === viewingSavedCategory).length === 0 ? (
                                    <div className="glass-card p-4 text-center">
                                        <div className="text-white/40 text-sm mb-1">No saved {CONTENT_TYPE_INFO[viewingSavedCategory].label.toLowerCase()} lessons</div>
                                        <div className="text-white/30 text-xs">Create your first one!</div>
                                    </div>
                                ) : (
                                    sortedLessons
                                        .filter(lesson => lesson.contentType === viewingSavedCategory)
                                        .map((lesson) => {
                                            const contentInfo = CONTENT_TYPE_INFO[lesson.contentType];
                                            const itemCount = lesson.vocabCount;
                                            
                                            return (
                                                <div key={lesson.id} className="glass-card p-2 hover:bg-white/10 transition-all">
                                                    {/* Main lesson info - clickable */}
                                                    <button
                                                        onClick={() => handleStartLesson(lesson.id)}
                                                        className="w-full text-left flex items-center gap-2 mb-1.5"
                                                    >
                                                        <span className="text-lg">{contentInfo.icon}</span>
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="text-sm font-medium text-white truncate">
                                                                {lesson.title}
                                                            </h3>
                                                            <div className="flex items-center gap-1.5 text-xs text-white/40">
                                                                <span>{itemCount} {lesson.contentType === 'word' ? 'words' : lesson.contentType === 'sentence' ? 'sentences' : lesson.contentType === 'dialog' ? 'exchanges' : 'passages'}</span>
                                                                <span>•</span>
                                                                <span>{new Date(lesson.createdAt).toLocaleDateString()}</span>
                                                            </div>
                                                        </div>
                                                        <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    </button>
                                                    
                                                    {/* Action buttons */}
                                                    <div className="flex items-center gap-1.5 pt-1.5 border-t border-white/10">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                openEditDialog(lesson);
                                                            }}
                                                            className="flex-1 py-2 px-3 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                            Edit
                                                        </button>
                                                        {/* TODO: Implement regeneration by passing lesson ID to LessonGenerator */}
                                                        <button
                                                            disabled
                                                            className="flex-1 py-2 px-3 bg-white/5 text-white/30 text-xs rounded-lg flex items-center justify-center gap-1.5 cursor-not-allowed"
                                                            title="Regeneration coming soon"
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                            </svg>
                                                            Regenerate (soon)
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setLessonToDelete(lesson);
                                                            }}
                                                            className="py-2 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Category Cards - Words, Phrases, Passages, Dialogs */}
                <section className="space-y-3">
                    {(Object.keys(CONTENT_TYPE_INFO) as ContentType[]).map((type) => {
                        const info = CONTENT_TYPE_INFO[type];
                        const categoryLessonCount = sortedLessons.filter(l => l.contentType === type).length;
                        
                        return (
                            <div key={type} className="glass-card p-4">
                                {/* Category Header */}
                                <div className="flex items-center gap-3 mb-3">
                                    <span className="text-3xl">{info.icon}</span>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-white text-lg">{info.label}</h3>
                                        <p className="text-xs text-white/40">
                                            {categoryLessonCount} saved {categoryLessonCount === 1 ? 'lesson' : 'lessons'}
                                        </p>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => setViewingSavedCategory(type)}
                                        className="py-3 px-4 bg-white/10 hover:bg-white/20 text-white font-medium text-sm rounded-xl transition-all flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                                        </svg>
                                        View Saved
                                    </button>
                                    <button
                                        onClick={() => handleCreateLesson(type)}
                                        className="py-3 px-4 bg-white text-surface-300 hover:bg-white/90 font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                        </svg>
                                        Create New
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </section>

            {/* AI Lesson Generator */}
            <LessonGenerator
                onLessonCreated={(lessonId) => {
                    setGeneratorOpen(false);
                    if (lessonId) {
                        navigate(`/exercise/${lessonId}`);
                    } else {
                        refetch();
                    }
                }}
                defaultContentType={selectedContentType}
                externalOpen={generatorOpen}
                onOpenChange={setGeneratorOpen}
            />

            {/* Delete Lesson Confirmation Dialog */}
            <ConfirmDialog
                isOpen={!!lessonToDelete}
                title="Delete Lesson?"
                message={`Are you sure you want to delete "${lessonToDelete?.title}"? This will remove the lesson but keep any words you've already saved to your vocabulary.`}
                confirmLabel={isDeleting ? 'Deleting...' : 'Delete Lesson'}
                variant="danger"
                onConfirm={handleDeleteLesson}
                onCancel={() => setLessonToDelete(null)}
            />

            {/* Edit Lesson Dialog */}
            {lessonToEdit && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                    <div className="glass-card w-full max-w-md p-6 space-y-4">
                        <h3 className="text-xl font-bold text-white">Edit Lesson</h3>
                        
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm text-white/70 mb-1">Title</label>
                                <input
                                    type="text"
                                    value={editTitle}
                                    onChange={(e) => setEditTitle(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
                                    placeholder="Lesson title"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-white/70 mb-1">Description</label>
                                <textarea
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30 resize-none"
                                    placeholder="Lesson description"
                                />
                            </div>
                        </div>
                        
                        <div className="pt-2 space-y-2">
                            <button
                                onClick={handleEditLesson}
                                disabled={isUpdating || !editTitle.trim()}
                                className="w-full py-3 bg-white text-surface-300 font-bold rounded-xl hover:bg-white/90 transition-colors disabled:opacity-50"
                            >
                                {isUpdating ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button
                                onClick={() => {
                                    setLessonToEdit(null);
                                    setEditTitle('');
                                    setEditDescription('');
                                }}
                                disabled={isUpdating}
                                className="w-full py-3 text-white/70 font-medium hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            </div>
        </div>
    );
}
