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
    memory_note?: string | null;
    memory_image_url?: string | null;
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
    language?: 'arabic' | 'spanish';  // Prefer passing explicitly; falls back to hook param
    status?: 'active' | 'learned';  // Default: 'active'
    memory_note?: string;
    memory_image_url?: string;
}

/**
 * Hook for managing saved sentences (spoken Arabic phrases).
 * Provides CRUD operations and filtering.
 */
export function useSavedSentences(language?: 'arabic' | 'spanish') {
    const [sentences, setSentences] = useState<SavedSentence[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch all sentences
    const fetchSentences = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            let query = supabase
                .from('saved_sentences')
                .select('*')
                .order('created_at', { ascending: false });
            
            // Apply language filter if provided
            if (language) {
                query = query.eq('language', language);
            }
            
            const { data, error: fetchError } = await query;
            
            if (fetchError) throw fetchError;
            setSentences(data || []);
        } catch (err) {
            console.error('[useSavedSentences] Fetch error:', err);
            setError('Failed to load sentences');
        } finally {
            setLoading(false);
        }
    }, [language]);

    // Initial fetch
    useEffect(() => {
        fetchSentences();
    }, [fetchSentences]);

    // Save a new sentence
    const saveSentence = useCallback(async (input: SaveSentenceInput): Promise<SavedSentence | null> => {
        try {
            
            // Check if sentence already exists (by arabic_text)
            const { data: existing } = await supabase
                .from('saved_sentences')
                .select('id')
                .eq('arabic_text', input.arabic_text)
                .single();
            
            if (existing) {
                return null;
            }
            
            // Resolve language: prefer explicit input.language, then hook param
            const resolvedLanguage = input.language || language;
            if (!resolvedLanguage) {
                console.warn('[useSavedSentences] saveSentence called without language — defaulting to "arabic". Pass language explicitly.');
            }

            const { data, error: insertError } = await supabase
                .from('saved_sentences')
                .insert({
                    ...input,
                    language: resolvedLanguage || 'arabic',
                    status: input.status || 'active',
                    memory_note: input.memory_note || null,
                    memory_image_url: input.memory_image_url || null,
                })
                .select()
                .single();
            
            if (insertError) throw insertError;
            
            // Update local state
            setSentences(prev => [data, ...prev]);
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

    // Get saved sentence by Arabic text (returns full object with status)
    const getSentenceByText = useCallback((arabicText: string): SavedSentence | null => {
        return sentences.find(s => s.arabic_text === arabicText) || null;
    }, [sentences]);

    // Update memory aids (note and/or image)
    const updateMemoryAids = useCallback(async (
        id: string,
        updates: { memory_note?: string; memory_image_url?: string }
    ): Promise<boolean> => {
        try {
            const { error: updateError } = await supabase
                .from('saved_sentences')
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('id', id);
            
            if (updateError) throw updateError;
            
            setSentences(prev => prev.map(s => 
                s.id === id ? { ...s, ...updates } : s
            ));
            return true;
        } catch (err) {
            console.error('[useSavedSentences] Update memory aids error:', err);
            return false;
        }
    }, []);

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
        updateMemoryAids,
        isSentenceSaved,
        getSentenceByText,
        refetch: fetchSentences,
    };
}
