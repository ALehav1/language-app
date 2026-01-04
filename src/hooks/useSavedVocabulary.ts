import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { SavedVocabularyWithItem } from '../types/database';

interface UseSavedVocabularyReturn {
    savedItems: SavedVocabularyWithItem[];
    loading: boolean;
    error: string | null;
    savedItemIds: Set<string>;
    saveItem: (itemId: string) => Promise<void>;
    removeItem: (itemId: string) => Promise<void>;
    isItemSaved: (itemId: string) => boolean;
    refreshSavedItems: () => Promise<void>;
}

/**
 * Hook for managing saved vocabulary items.
 */
export function useSavedVocabulary(): UseSavedVocabularyReturn {
    const [savedItems, setSavedItems] = useState<SavedVocabularyWithItem[]>([]);
    const [savedItemIds, setSavedItemIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSavedItems = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const { data, error: fetchError } = await supabase
                .from('saved_vocabulary')
                .select(`
                    *,
                    vocabulary_items (*)
                `)
                .order('saved_at', { ascending: false });

            if (fetchError) {
                throw new Error(fetchError.message);
            }

            const items = (data || []) as SavedVocabularyWithItem[];
            setSavedItems(items);
            setSavedItemIds(new Set(items.map(item => item.vocabulary_item_id)));
        } catch (err) {
            console.error('Error fetching saved vocabulary:', err);
            setError(err instanceof Error ? err.message : 'Failed to load saved items');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSavedItems();
    }, [fetchSavedItems]);

    const saveItem = useCallback(async (itemId: string) => {
        try {
            // Optimistically update UI
            setSavedItemIds(prev => new Set([...prev, itemId]));

            const { error: insertError } = await supabase
                .from('saved_vocabulary')
                .insert({ vocabulary_item_id: itemId });

            if (insertError) {
                // Rollback on error
                setSavedItemIds(prev => {
                    const next = new Set(prev);
                    next.delete(itemId);
                    return next;
                });
                throw new Error(insertError.message);
            }

            // Refresh to get full item data
            await fetchSavedItems();
        } catch (err) {
            console.error('Error saving vocabulary item:', err);
        }
    }, [fetchSavedItems]);

    const removeItem = useCallback(async (itemId: string) => {
        try {
            // Optimistically update UI
            setSavedItemIds(prev => {
                const next = new Set(prev);
                next.delete(itemId);
                return next;
            });
            setSavedItems(prev => prev.filter(item => item.vocabulary_item_id !== itemId));

            const { error: deleteError } = await supabase
                .from('saved_vocabulary')
                .delete()
                .eq('vocabulary_item_id', itemId);

            if (deleteError) {
                // Refresh to restore state on error
                await fetchSavedItems();
                throw new Error(deleteError.message);
            }
        } catch (err) {
            console.error('Error removing saved vocabulary item:', err);
        }
    }, [fetchSavedItems]);

    const isItemSaved = useCallback((itemId: string) => {
        return savedItemIds.has(itemId);
    }, [savedItemIds]);

    return {
        savedItems,
        loading,
        error,
        savedItemIds,
        saveItem,
        removeItem,
        isItemSaved,
        refreshSavedItems: fetchSavedItems,
    };
}
