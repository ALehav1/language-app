import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { SavedWord, WordContext, SavedWordWithContexts, WordStatus, LetterBreakdown, HebrewCognate } from '../types';

/**
 * Hook for managing saved Arabic vocabulary words.
 * Provides CRUD operations and filtering for the My Vocabulary feature.
 */
export function useSavedWords(options?: {
    status?: WordStatus | 'all';
    topic?: string;
    searchQuery?: string;
}) {
    const [words, setWords] = useState<SavedWordWithContexts[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch saved words with their contexts
    const fetchWords = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            // Build query for saved_words
            let query = supabase
                .from('saved_words')
                .select('*')
                .order('created_at', { ascending: false });

            // Apply status filter
            if (options?.status && options.status !== 'all') {
                query = query.eq('status', options.status);
            } else {
                // By default, exclude retired words
                query = query.neq('status', 'retired');
            }

            // Apply topic filter
            if (options?.topic) {
                query = query.eq('topic', options.topic);
            }

            // Apply search filter (searches word and translation)
            if (options?.searchQuery) {
                const searchTerm = `%${options.searchQuery}%`;
                query = query.or(`word.ilike.${searchTerm},translation.ilike.${searchTerm}`);
            }

            const { data: wordsData, error: wordsError } = await query;

            if (wordsError) throw wordsError;

            // Fetch contexts for all words
            const wordIds = wordsData?.map(w => w.id) || [];
            
            let contextsData: WordContext[] = [];
            if (wordIds.length > 0) {
                const { data, error: contextsError } = await supabase
                    .from('word_contexts')
                    .select('*')
                    .in('saved_word_id', wordIds);

                if (contextsError) throw contextsError;
                contextsData = data || [];
            }

            // Combine words with their contexts
            const wordsWithContexts: SavedWordWithContexts[] = (wordsData || []).map(word => ({
                ...word,
                contexts: contextsData.filter(c => c.saved_word_id === word.id),
            }));

            setWords(wordsWithContexts);
        } catch (err) {
            console.error('Error fetching saved words:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch saved words');
        } finally {
            setLoading(false);
        }
    }, [options?.status, options?.topic, options?.searchQuery]);

    // Initial fetch
    useEffect(() => {
        fetchWords();
    }, [fetchWords]);

    // Save a new word with context
    const saveWord = useCallback(async (
        wordData: {
            word: string;
            translation: string;
            pronunciation_standard?: string;
            pronunciation_egyptian?: string;
            letter_breakdown?: LetterBreakdown[];
            hebrew_cognate?: HebrewCognate;
            topic?: string;
            status?: WordStatus;  // Default: 'solid' (auto-saved from practice)
            times_practiced?: number;
            times_correct?: number;
        },
        context?: {
            content_type: 'word' | 'phrase' | 'dialog' | 'paragraph' | 'lookup';
            full_text: string;
            full_transliteration?: string;
            full_translation: string;
            speaker?: string;
            dialog_context?: string;
            lesson_id?: string;
            vocabulary_item_id?: string;
        }
    ): Promise<SavedWord | null> => {
        try {
            // Check if word already exists
            const { data: existing } = await supabase
                .from('saved_words')
                .select('id')
                .eq('word', wordData.word)
                .single();

            let savedWord: SavedWord;

            if (existing) {
                // Word exists - just add new context if provided
                const { data, error } = await supabase
                    .from('saved_words')
                    .select('*')
                    .eq('id', existing.id)
                    .single();

                if (error) throw error;
                savedWord = data;
            } else {
                // Insert new word - default to 'solid' (auto-saved from practice)
                // Heart button will change to 'needs_review' for priority words
                const { data, error } = await supabase
                    .from('saved_words')
                    .insert({
                        word: wordData.word,
                        translation: wordData.translation,
                        language: 'arabic',
                        pronunciation_standard: wordData.pronunciation_standard || null,
                        pronunciation_egyptian: wordData.pronunciation_egyptian || null,
                        letter_breakdown: wordData.letter_breakdown || null,
                        hebrew_cognate: wordData.hebrew_cognate || null,
                        topic: wordData.topic || null,
                        tags: null,
                        status: wordData.status || 'solid',  // Default to solid (practiced)
                        times_practiced: wordData.times_practiced || 1,
                        times_correct: wordData.times_correct || 0,
                        last_practiced: new Date().toISOString(),
                        next_review: null,
                    })
                    .select()
                    .single();

                if (error) throw error;
                savedWord = data;
            }

            // Add context if provided
            if (context && savedWord) {
                const { error: contextError } = await supabase
                    .from('word_contexts')
                    .insert({
                        saved_word_id: savedWord.id,
                        content_type: context.content_type,
                        full_text: context.full_text,
                        full_transliteration: context.full_transliteration || null,
                        full_translation: context.full_translation,
                        speaker: context.speaker || null,
                        dialog_context: context.dialog_context || null,
                        lesson_id: context.lesson_id || null,
                        vocabulary_item_id: context.vocabulary_item_id || null,
                    });

                if (contextError) {
                    console.error('Error adding context:', contextError);
                    // Don't throw - word was saved successfully
                }
            }

            // Refresh the list
            await fetchWords();
            return savedWord;
        } catch (err) {
            console.error('Error saving word:', err);
            setError(err instanceof Error ? err.message : 'Failed to save word');
            return null;
        }
    }, [fetchWords]);

    // Update word status
    const updateStatus = useCallback(async (wordId: string, status: WordStatus) => {
        try {
            const { error } = await supabase
                .from('saved_words')
                .update({ status, updated_at: new Date().toISOString() })
                .eq('id', wordId);

            if (error) throw error;

            // Optimistic update
            setWords(prev => prev.map(w => 
                w.id === wordId ? { ...w, status } : w
            ));
        } catch (err) {
            console.error('Error updating status:', err);
            setError(err instanceof Error ? err.message : 'Failed to update status');
        }
    }, []);

    // Remove word (set to retired or hard delete)
    const removeWord = useCallback(async (wordId: string, hardDelete = false) => {
        try {
            if (hardDelete) {
                const { error } = await supabase
                    .from('saved_words')
                    .delete()
                    .eq('id', wordId);

                if (error) throw error;
            } else {
                // Soft delete - set to retired
                await updateStatus(wordId, 'retired');
            }

            // Remove from local state
            setWords(prev => prev.filter(w => w.id !== wordId));
        } catch (err) {
            console.error('Error removing word:', err);
            setError(err instanceof Error ? err.message : 'Failed to remove word');
        }
    }, [updateStatus]);

    // Update practice stats
    const recordPractice = useCallback(async (wordId: string, correct: boolean) => {
        try {
            const word = words.find(w => w.id === wordId);
            if (!word) return;

            const updates = {
                times_practiced: word.times_practiced + 1,
                times_correct: correct ? word.times_correct + 1 : word.times_correct,
                last_practiced: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabase
                .from('saved_words')
                .update(updates)
                .eq('id', wordId);

            if (error) throw error;

            // Optimistic update
            setWords(prev => prev.map(w => 
                w.id === wordId ? { ...w, ...updates } : w
            ));
        } catch (err) {
            console.error('Error recording practice:', err);
        }
    }, [words]);

    // Mark a word for additional review (heart button)
    // If word exists, change status to needs_review
    // If word doesn't exist, save it with needs_review status
    const markForReview = useCallback(async (
        wordData: {
            word: string;
            translation: string;
            pronunciation_standard?: string;
            pronunciation_egyptian?: string;
            letter_breakdown?: LetterBreakdown[];
            hebrew_cognate?: HebrewCognate;
        },
        context?: {
            content_type: 'word' | 'phrase' | 'dialog' | 'paragraph' | 'lookup';
            full_text: string;
            full_transliteration?: string;
            full_translation: string;
            lesson_id?: string;
            vocabulary_item_id?: string;
        }
    ): Promise<void> => {
        try {
            // Check if word already exists
            const { data: existing } = await supabase
                .from('saved_words')
                .select('id, status')
                .eq('word', wordData.word)
                .single();

            if (existing) {
                // Word exists - mark for review
                await updateStatus(existing.id, 'needs_review');
            } else {
                // Save new word with needs_review status
                await saveWord({ ...wordData, status: 'needs_review' }, context);
            }
        } catch (err) {
            console.error('Error marking for review:', err);
        }
    }, [updateStatus, saveWord]);

    // Check if a word is already saved
    const isWordSaved = useCallback((arabicWord: string): boolean => {
        return words.some(w => w.word === arabicWord);
    }, [words]);

    // Check if a word is marked for review
    const isMarkedForReview = useCallback((arabicWord: string): boolean => {
        return words.some(w => w.word === arabicWord && w.status === 'needs_review');
    }, [words]);

    // Get unique topics for filtering
    const topics = [...new Set(words.map(w => w.topic).filter(Boolean))] as string[];

    // Get counts by status
    const counts = {
        total: words.length,
        needsReview: words.filter(w => w.status === 'needs_review').length,
        solid: words.filter(w => w.status === 'solid').length,
    };

    return {
        words,
        loading,
        error,
        saveWord,
        updateStatus,
        removeWord,
        recordPractice,
        markForReview,
        isWordSaved,
        isMarkedForReview,
        refetch: fetchWords,
        topics,
        counts,
    };
}
