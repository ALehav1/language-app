import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Saved passage structure matching the database schema.
 */
export interface SavedPassage {
    id: string;
    original_text: string;
    source_language: 'arabic' | 'english' | 'spanish';
    full_translation: string;
    full_transliteration?: string;
    sentence_count: number;
    source?: string;
    status: 'active' | 'learned';
    memory_note?: string | null;
    memory_image_url?: string | null;
    created_at: string;
    updated_at: string;
}

/**
 * Input for saving a new passage (without id/timestamps).
 */
export interface SavePassageInput {
    original_text: string;
    source_language: 'arabic' | 'english' | 'spanish';
    full_translation: string;
    full_transliteration?: string;
    sentence_count?: number;
    source?: string;
    status?: 'active' | 'learned';  // Default: 'active'
    memory_note?: string;
    memory_image_url?: string;
}

/**
 * Hook for managing saved passages (full texts).
 * Provides CRUD operations and filtering.
 */
export function useSavedPassages(language?: 'arabic' | 'spanish') {
    const [passages, setPassages] = useState<SavedPassage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch all passages
    const fetchPassages = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            let query = supabase
                .from('saved_passages')
                .select('*')
                .order('created_at', { ascending: false });
            
            // Apply language filter if provided
            if (language) {
                query = query.eq('source_language', language);
            }
            
            const { data, error: fetchError } = await query;
            
            if (fetchError) throw fetchError;
            setPassages(data || []);
        } catch (err) {
            console.error('[useSavedPassages] Fetch error:', err);
            setError('Failed to load passages');
            setPassages([]);
        } finally {
            setLoading(false);
        }
    }, [language]);

    // Initial fetch
    useEffect(() => {
        fetchPassages();
    }, [fetchPassages]);

    // Save a new passage
    const savePassage = useCallback(async (input: SavePassageInput): Promise<SavedPassage | null> => {
        try {
            console.log('[useSavedPassages] Saving passage:', input.original_text.slice(0, 50));
            
            // Check if passage already exists (by original_text)
            const { data: existing } = await supabase
                .from('saved_passages')
                .select('id')
                .eq('original_text', input.original_text)
                .single();
            
            if (existing) {
                console.log('[useSavedPassages] Passage already saved');
                return null;
            }
            
            const { data, error: insertError } = await supabase
                .from('saved_passages')
                .insert({
                    ...input,
                    sentence_count: input.sentence_count || 1,
                    status: input.status || 'active',
                    memory_note: input.memory_note || null,
                    memory_image_url: input.memory_image_url || null,
                })
                .select()
                .single();
            
            if (insertError) throw insertError;
            
            // Update local state
            setPassages(prev => [data, ...prev]);
            console.log('[useSavedPassages] Saved successfully:', data.id);
            return data;
        } catch (err) {
            console.error('[useSavedPassages] Save error:', err);
            return null;
        }
    }, []);

    // Delete a passage
    const deletePassage = useCallback(async (id: string): Promise<boolean> => {
        try {
            const { error: deleteError } = await supabase
                .from('saved_passages')
                .delete()
                .eq('id', id);
            
            if (deleteError) throw deleteError;
            
            setPassages(prev => prev.filter(p => p.id !== id));
            return true;
        } catch (err) {
            console.error('[useSavedPassages] Delete error:', err);
            return false;
        }
    }, []);

    // Update passage status (active -> learned)
    const updateStatus = useCallback(async (id: string, status: 'active' | 'learned'): Promise<boolean> => {
        try {
            const { error: updateError } = await supabase
                .from('saved_passages')
                .update({ status, updated_at: new Date().toISOString() })
                .eq('id', id);
            
            if (updateError) throw updateError;
            
            setPassages(prev => prev.map(p => 
                p.id === id ? { ...p, status } : p
            ));
            return true;
        } catch (err) {
            console.error('[useSavedPassages] Update status error:', err);
            return false;
        }
    }, []);

    // Check if a passage is already saved
    const isPassageSaved = useCallback((originalText: string): boolean => {
        return passages.some(p => p.original_text === originalText);
    }, [passages]);

    // Get saved passage by original text (returns full object with status)
    const getPassageByText = useCallback((originalText: string): SavedPassage | null => {
        return passages.find(p => p.original_text === originalText) || null;
    }, [passages]);

    // Update memory aids (note and/or image)
    const updateMemoryAids = useCallback(async (
        id: string,
        updates: { memory_note?: string; memory_image_url?: string }
    ): Promise<boolean> => {
        try {
            const { error: updateError } = await supabase
                .from('saved_passages')
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('id', id);
            
            if (updateError) throw updateError;
            
            setPassages(prev => prev.map(p => 
                p.id === id ? { ...p, ...updates } : p
            ));
            return true;
        } catch (err) {
            console.error('[useSavedPassages] Update memory aids error:', err);
            return false;
        }
    }, []);

    // Get counts by status
    const counts = {
        total: passages.length,
        active: passages.filter(p => p.status === 'active').length,
        learned: passages.filter(p => p.status === 'learned').length,
    };

    return {
        passages,
        loading,
        error,
        counts,
        savePassage,
        deletePassage,
        updateStatus,
        updateMemoryAids,
        isPassageSaved,
        getPassageByText,
        refetch: fetchPassages,
    };
}
