import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { VocabularyItem, DbVocabularyItem } from '../types';

interface UseVocabularyOptions {
    lessonId: string;
}

interface UseVocabularyReturn {
    vocabulary: VocabularyItem[];
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

/**
 * Hook for fetching vocabulary items for a specific lesson from Supabase.
 */
export function useVocabulary({ lessonId }: UseVocabularyOptions): UseVocabularyReturn {
    const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchVocabulary = useCallback(async () => {
        if (!lessonId) {
            setVocabulary([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const { data, error: fetchError } = await supabase
                .from('vocabulary_items')
                .select('*')
                .eq('lesson_id', lessonId)
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
    }, [lessonId]);

    useEffect(() => {
        fetchVocabulary();
    }, [fetchVocabulary]);

    return { vocabulary, loading, error, refetch: fetchVocabulary };
}
