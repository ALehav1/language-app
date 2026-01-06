import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { VocabularyItem, DbVocabularyItem, SavedWord } from '../types';

interface UseVocabularyOptions {
    lessonId?: string;
    itemIds?: string[];  // For fetching specific items (e.g., saved words practice)
    fromSavedWords?: boolean;  // If true, fetch from saved_words table instead
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
 * If fromSavedWords is true, fetches from saved_words table instead.
 */
export function useVocabulary({ lessonId, itemIds, fromSavedWords }: UseVocabularyOptions): UseVocabularyReturn {
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
            // Fetch from saved_words table if specified
            if (fromSavedWords && itemIds && itemIds.length > 0) {
                const { data: savedData, error: savedError } = await supabase
                    .from('saved_words')
                    .select('*')
                    .in('id', itemIds);

                if (savedError) throw new Error(savedError.message);

                // Transform saved_words to VocabularyItem format for exercise compatibility
                const items: VocabularyItem[] = (savedData || []).map((row: SavedWord) => ({
                    id: row.id,
                    word: row.word,
                    translation: row.translation,
                    language: 'arabic' as const,
                    content_type: 'word' as const,
                    transliteration: row.pronunciation_standard || undefined,
                    hebrew_cognate: row.hebrew_cognate,
                    letter_breakdown: row.letter_breakdown,
                    speaker: undefined,
                    context: undefined,
                    mastery_level: row.status === 'learned' ? 'practiced' : 'learning',
                    last_reviewed: row.last_practiced,
                    next_review: row.next_review,
                    times_practiced: row.times_practiced,
                    created_at: row.created_at,
                }));

                setVocabulary(items);
                return;
            }

            // Standard fetch from vocabulary_items
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
    }, [lessonId, itemIds?.join(','), fromSavedWords]);  // Join itemIds to create stable dependency

    useEffect(() => {
        fetchVocabulary();
    }, [fetchVocabulary]);

    return { vocabulary, loading, error, refetch: fetchVocabulary };
}
