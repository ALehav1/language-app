import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { SavedWord, WordContext, SavedWordWithContexts, WordStatus, LetterBreakdown, HebrewCognate, ExampleSentence } from '../types';

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
            example_sentences?: ExampleSentence[];
            topic?: string;
            status?: WordStatus;  // Default: 'active' (still practicing)
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
                // Insert new word - default to 'active' (still practicing)
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
                        example_sentences: wordData.example_sentences || null,
                        topic: wordData.topic || null,
                        tags: null,
                        status: wordData.status || 'active',  // Default to active (practicing)
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

    // Delete word permanently
    const deleteWord = useCallback(async (wordId: string) => {
        try {
            // Delete contexts first (foreign key constraint)
            await supabase
                .from('word_contexts')
                .delete()
                .eq('saved_word_id', wordId);

            // Then delete the word
            const { error } = await supabase
                .from('saved_words')
                .delete()
                .eq('id', wordId);

            if (error) throw error;

            // Remove from local state
            setWords(prev => prev.filter(w => w.id !== wordId));
        } catch (err) {
            console.error('Error deleting word:', err);
            setError(err instanceof Error ? err.message : 'Failed to delete word');
        }
    }, []);

    // Archive word (mark as learned)
    const archiveWord = useCallback(async (wordId: string) => {
        await updateStatus(wordId, 'learned');
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

    // Save word as active (heart button during exercises)
    // If word exists, keep it active
    // If word doesn't exist, save it with active status
    const saveAsActive = useCallback(async (
        wordData: {
            word: string;
            translation: string;
            pronunciation_standard?: string;
            pronunciation_egyptian?: string;
            letter_breakdown?: LetterBreakdown[];
            hebrew_cognate?: HebrewCognate;
            example_sentences?: ExampleSentence[];
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
                // Word exists - ensure it's active (not learned)
                if (existing.status === 'learned') {
                    await updateStatus(existing.id, 'active');
                }
            } else {
                // Save new word with active status
                await saveWord({ ...wordData, status: 'active' }, context);
            }
        } catch (err) {
            console.error('Error saving word:', err);
        }
    }, [updateStatus, saveWord]);

    // Check if a word is already saved
    const isWordSaved = useCallback((arabicWord: string): boolean => {
        return words.some(w => w.word === arabicWord);
    }, [words]);

    // Check if a word is active (still practicing)
    const isActive = useCallback((arabicWord: string): boolean => {
        return words.some(w => w.word === arabicWord && w.status === 'active');
    }, [words]);

    // Update memory aids (note and/or image)
    const updateMemoryAids = useCallback(async (
        wordId: string,
        updates: { memory_note?: string; memory_image_url?: string }
    ) => {
        try {
            const { error } = await supabase
                .from('saved_words')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', wordId);

            if (error) throw error;

            // Optimistic update
            setWords(prev => prev.map(w => 
                w.id === wordId ? { ...w, ...updates } : w
            ));
        } catch (err) {
            console.error('Error updating memory aids:', err);
            setError(err instanceof Error ? err.message : 'Failed to update memory aids');
        }
    }, []);

    // Get unique topics for filtering
    const topics = [...new Set(words.map(w => w.topic).filter(Boolean))] as string[];

    // Get counts by status
    const counts = {
        total: words.length,
        active: words.filter(w => w.status === 'active').length,
        learned: words.filter(w => w.status === 'learned').length,
    };

    return {
        words,
        loading,
        error,
        saveWord,
        updateStatus,
        deleteWord,
        archiveWord,
        recordPractice,
        saveAsActive,
        isWordSaved,
        isActive,
        updateMemoryAids,
        refetch: fetchWords,
        topics,
        counts,
    };
}
