import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Saved sentence structure matching the database schema.
 */
export interface SavedSentence {
    id: string;
    arabic_text: string;
    arabic_egyptian?: string;
    transliteration: string;
    transliteration_egyptian?: string;
    translation: string;
    explanation?: string;
    topic?: string;
    source?: string;
    status: 'active' | 'learned';
    created_at: string;
    updated_at: string;
}

/**
 * Input for saving a new sentence (without id/timestamps).
 */
export interface SaveSentenceInput {
    arabic_text: string;
    arabic_egyptian?: string;
    transliteration: string;
    transliteration_egyptian?: string;
    translation: string;
    explanation?: string;
    topic?: string;
    source?: string;
}

/**
 * Hook for managing saved sentences (spoken Arabic phrases).
 * Provides CRUD operations and filtering.
 */
export function useSavedSentences() {
    const [sentences, setSentences] = useState<SavedSentence[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch all sentences
    const fetchSentences = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            const { data, error: fetchError } = await supabase
                .from('saved_sentences')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (fetchError) throw fetchError;
            setSentences(data || []);
        } catch (err) {
            console.error('[useSavedSentences] Fetch error:', err);
            setError('Failed to load sentences');
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchSentences();
    }, [fetchSentences]);

    // Save a new sentence
    const saveSentence = useCallback(async (input: SaveSentenceInput): Promise<SavedSentence | null> => {
        try {
            console.log('[useSavedSentences] Saving sentence:', input.arabic_text);
            
            // Check if sentence already exists (by arabic_text)
            const { data: existing } = await supabase
                .from('saved_sentences')
                .select('id')
                .eq('arabic_text', input.arabic_text)
                .single();
            
            if (existing) {
                console.log('[useSavedSentences] Sentence already saved');
                return null;
            }
            
            const { data, error: insertError } = await supabase
                .from('saved_sentences')
                .insert({
                    ...input,
                    status: 'active',
                })
                .select()
                .single();
            
            if (insertError) throw insertError;
            
            // Update local state
            setSentences(prev => [data, ...prev]);
            console.log('[useSavedSentences] Saved successfully:', data.id);
            return data;
        } catch (err) {
            console.error('[useSavedSentences] Save error:', err);
            return null;
        }
    }, []);

    // Delete a sentence
    const deleteSentence = useCallback(async (id: string): Promise<boolean> => {
        try {
            const { error: deleteError } = await supabase
                .from('saved_sentences')
                .delete()
                .eq('id', id);
            
            if (deleteError) throw deleteError;
            
            setSentences(prev => prev.filter(s => s.id !== id));
            return true;
        } catch (err) {
            console.error('[useSavedSentences] Delete error:', err);
            return false;
        }
    }, []);

    // Update sentence status (active -> learned)
    const updateStatus = useCallback(async (id: string, status: 'active' | 'learned'): Promise<boolean> => {
        try {
            const { error: updateError } = await supabase
                .from('saved_sentences')
                .update({ status, updated_at: new Date().toISOString() })
                .eq('id', id);
            
            if (updateError) throw updateError;
            
            setSentences(prev => prev.map(s => 
                s.id === id ? { ...s, status } : s
            ));
            return true;
        } catch (err) {
            console.error('[useSavedSentences] Update status error:', err);
            return false;
        }
    }, []);

    // Check if a sentence is already saved
    const isSentenceSaved = useCallback((arabicText: string): boolean => {
        return sentences.some(s => s.arabic_text === arabicText);
    }, [sentences]);

    // Get counts by status
    const counts = {
        total: sentences.length,
        active: sentences.filter(s => s.status === 'active').length,
        learned: sentences.filter(s => s.status === 'learned').length,
    };

    return {
        sentences,
        loading,
        error,
        counts,
        saveSentence,
        deleteSentence,
        updateStatus,
        isSentenceSaved,
        refetch: fetchSentences,
    };
}
