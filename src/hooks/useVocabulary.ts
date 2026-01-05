import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { VocabularyItem, DbVocabularyItem } from '../types';

interface UseVocabularyOptions {
    lessonId?: string;
    itemIds?: string[];  // For fetching specific items (e.g., saved words practice)
}

interface UseVocabularyReturn {
    vocabulary: VocabularyItem[];
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

/**
 * Hook for fetching vocabulary items from Supabase.
 * Can fetch by lessonId OR by specific itemIds.
 */
export function useVocabulary({ lessonId, itemIds }: UseVocabularyOptions): UseVocabularyReturn {
    const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchVocabulary = useCallback(async () => {
        // Need either lessonId or itemIds
        if (!lessonId && (!itemIds || itemIds.length === 0)) {
            setVocabulary([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            let query = supabase
                .from('vocabulary_items')
                .select('*');

            // Fetch by specific IDs or by lesson
            if (itemIds && itemIds.length > 0) {
                query = query.in('id', itemIds);
            } else if (lessonId) {
                query = query.eq('lesson_id', lessonId);
            }

            const { data, error: fetchError } = await query
                .order('created_at', { ascending: true })
                .returns<DbVocabularyItem[]>();

            if (fetchError) {
                throw new Error(fetchError.message);
            }

            // Transform to VocabularyItem (remove lesson_id from public interface)
            const items: VocabularyItem[] = (data || []).map((row) => ({
                id: row.id,
                word: row.word,
                translation: row.translation,
                language: row.language,
                content_type: row.content_type || 'word',
                transliteration: row.transliteration,
                hebrew_cognate: row.hebrew_cognate,
                letter_breakdown: row.letter_breakdown,
                speaker: row.speaker,
                context: row.context,
                mastery_level: row.mastery_level,
                last_reviewed: row.last_reviewed,
                next_review: row.next_review,
                times_practiced: row.times_practiced,
                created_at: row.created_at,
            }));

            setVocabulary(items);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch vocabulary';
            setError(message);
            console.error('Error fetching vocabulary:', err);
        } finally {
            setLoading(false);
        }
    }, [lessonId, itemIds?.join(',')]);  // Join itemIds to create stable dependency

    useEffect(() => {
        fetchVocabulary();
    }, [fetchVocabulary]);

    return { vocabulary, loading, error, refetch: fetchVocabulary };
}
