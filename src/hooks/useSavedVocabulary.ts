import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { SavedWordWithContexts, VocabularyItem } from '../types/database';
import { generateArabicBreakdown } from '../utils/arabicLetters';

/**
 * Legacy interface for backward compatibility during transition.
 * Maps old vocabulary_items to new saved_words structure.
 */
interface LegacySavedItem {
    id: string;
    vocabulary_item_id: string;
    saved_at: string;
    notes: string | null;
    vocabulary_items: VocabularyItem;
}

interface UseSavedVocabularyReturn {
    savedItems: LegacySavedItem[];
    loading: boolean;
    error: string | null;
    savedItemIds: Set<string>;
    saveItem: (itemId: string, vocabItem?: VocabularyItem) => Promise<void>;
    removeItem: (itemId: string) => Promise<void>;
    isItemSaved: (itemId: string) => boolean;
    refreshSavedItems: () => Promise<void>;
}

/**
 * Hook for managing saved vocabulary items.
 * TRANSITIONAL: Uses new saved_words table but provides legacy interface.
 * Will be replaced by useSavedWords in Phase 12C.
 */
export function useSavedVocabulary(): UseSavedVocabularyReturn {
    const [savedWords, setSavedWords] = useState<SavedWordWithContexts[]>([]);
    const [savedItemIds, setSavedItemIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchSavedItems = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch from new saved_words table (all words - both active and learned)
            const { data: wordsData, error: fetchError } = await supabase
                .from('saved_words')
                .select('*')
                .order('created_at', { ascending: false });

            if (fetchError) {
                throw new Error(fetchError.message);
            }

            // Fetch contexts
            const wordIds = wordsData?.map(w => w.id) || [];
            let contextsData: Array<{ saved_word_id: string; vocabulary_item_id: string | null }> = [];
            
            if (wordIds.length > 0) {
                const { data } = await supabase
                    .from('word_contexts')
                    .select('saved_word_id, vocabulary_item_id')
                    .in('saved_word_id', wordIds);
                contextsData = data || [];
            }

            // Combine and track vocabulary_item_ids
            const words: SavedWordWithContexts[] = (wordsData || []).map(word => ({
                ...word,
                contexts: [],
            }));

            setSavedWords(words);
            
            // Build set of vocabulary_item_ids from contexts
            const itemIds = new Set<string>();
            contextsData.forEach(ctx => {
                if (ctx.vocabulary_item_id) {
                    itemIds.add(ctx.vocabulary_item_id);
                }
            });
            // Also add word IDs themselves for direct matching
            words.forEach(w => itemIds.add(w.id));
            
            setSavedItemIds(itemIds);
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

    // Save item - now saves to new saved_words table
    const saveItem = useCallback(async (itemId: string, vocabItem?: VocabularyItem) => {
        try {
            // Optimistically update UI
            setSavedItemIds(prev => new Set([...prev, itemId]));

            // If we have the vocab item, save it properly
            if (vocabItem) {
                // Check if word already exists
                const { data: existing } = await supabase
                    .from('saved_words')
                    .select('id')
                    .eq('word', vocabItem.word)
                    .single();

                let savedWordId: string;

                if (existing) {
                    savedWordId = existing.id;
                } else {
                    // Generate letter breakdown if Arabic
                    const letterBreakdown = vocabItem.language === 'arabic' 
                        ? (vocabItem.letter_breakdown || generateArabicBreakdown(vocabItem.word))
                        : null;

                    // Insert new word
                    const { data: newWord, error: insertError } = await supabase
                        .from('saved_words')
                        .insert({
                            word: vocabItem.word,
                            translation: vocabItem.translation,
                            language: 'arabic',
                            pronunciation_standard: vocabItem.transliteration || null,
                            pronunciation_egyptian: null,
                            letter_breakdown: letterBreakdown,
                            hebrew_cognate: vocabItem.hebrew_cognate || null,
                            topic: null,
                            tags: null,
                            status: 'active',
                            times_practiced: 0,
                            times_correct: 0,
                            last_practiced: null,
                            next_review: null,
                        })
                        .select('id')
                        .single();

                    if (insertError) throw insertError;
                    savedWordId = newWord.id;
                }

                // Add context linking to original vocabulary item
                await supabase
                    .from('word_contexts')
                    .insert({
                        saved_word_id: savedWordId,
                        content_type: vocabItem.content_type || 'word',
                        full_text: vocabItem.word,
                        full_transliteration: vocabItem.transliteration || null,
                        full_translation: vocabItem.translation,
                        speaker: vocabItem.speaker || null,
                        dialog_context: vocabItem.context || null,
                        lesson_id: null,
                        vocabulary_item_id: itemId,
                    });
            }

            await fetchSavedItems();
        } catch (err) {
            console.error('Error saving vocabulary item:', err);
            // Rollback on error
            setSavedItemIds(prev => {
                const next = new Set(prev);
                next.delete(itemId);
                return next;
            });
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

            // Find the saved word that has this vocabulary_item_id in its contexts
            const { data: contexts } = await supabase
                .from('word_contexts')
                .select('saved_word_id')
                .eq('vocabulary_item_id', itemId);

            if (contexts && contexts.length > 0) {
                // Set word to retired (soft delete)
                await supabase
                    .from('saved_words')
                    .update({ status: 'retired' })
                    .eq('id', contexts[0].saved_word_id);
            }

            await fetchSavedItems();
        } catch (err) {
            console.error('Error removing saved vocabulary item:', err);
            await fetchSavedItems(); // Refresh to restore state
        }
    }, [fetchSavedItems]);

    const isItemSaved = useCallback((itemId: string) => {
        return savedItemIds.has(itemId);
    }, [savedItemIds]);

    // Convert saved_words to legacy format for backward compatibility
    const savedItems: LegacySavedItem[] = savedWords.map(word => ({
        id: word.id,
        vocabulary_item_id: word.id, // Use word id as item id
        saved_at: word.created_at,
        notes: null,
        vocabulary_items: {
            id: word.id,
            word: word.word,
            translation: word.translation,
            language: 'arabic' as const,
            content_type: 'word' as const,
            transliteration: word.pronunciation_standard || undefined,
            hebrew_cognate: word.hebrew_cognate,
            letter_breakdown: word.letter_breakdown,
            mastery_level: 'new' as const,
            last_reviewed: word.last_practiced,
            times_practiced: word.times_practiced,
            next_review: word.next_review,
            created_at: word.created_at,
        },
    }));

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
