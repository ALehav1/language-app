import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { VocabularyItem, DbVocabularyItem } from '../types';
import { fromVocabularyItems } from '../domain/practice/adapters/fromVocabularyItems';
import { fromSavedWords as adaptSavedWords } from '../domain/practice/adapters/fromSavedWords';

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

                // Use adapter to transform SavedWord → PracticeItem → VocabularyItem
                const practiceItems = adaptSavedWords(savedData || []);
                
                // Convert PracticeItem back to VocabularyItem for backward compatibility
                const items: VocabularyItem[] = practiceItems.map((item) => ({
                    id: item.id,
                    word: item.targetText,
                    translation: item.translation,
                    language: item.language as any,
                    content_type: item.contentType as any,
                    transliteration: item.transliteration,
                    hebrew_cognate: item.hebrewCognate as any,
                    letter_breakdown: item.letterBreakdown as any,
                    speaker: undefined,
                    context: undefined,
                    mastery_level: item.masteryLevelRaw as any,
                    last_reviewed: item.lastReviewed || null,
                    next_review: item.nextReview || null,
                    times_practiced: item.timesPracticed || 0,
                    created_at: item.createdAt || '',
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

            // Use adapter to transform DbVocabularyItem → PracticeItem → VocabularyItem
            const practiceItems = fromVocabularyItems(data || []);
            
            // Convert PracticeItem back to VocabularyItem for backward compatibility
            const items: VocabularyItem[] = practiceItems.map((item) => ({
                id: item.id,
                word: item.targetText,
                translation: item.translation,
                language: item.language as any,
                content_type: item.contentType as any,
                transliteration: item.transliteration,
                hebrew_cognate: item.hebrewCognate as any,
                letter_breakdown: item.letterBreakdown as any,
                speaker: undefined,
                context: undefined,
                mastery_level: item.masteryLevelRaw as any,
                last_reviewed: item.lastReviewed || null,
                next_review: item.nextReview || null,
                times_practiced: item.timesPracticed || 0,
                created_at: item.createdAt || '',
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
