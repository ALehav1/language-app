import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Language, DbLesson, ContentType } from '../types';
import type { Lesson } from '../types/lesson';

interface UseLessonsOptions {
    language?: Language | 'all';
    contentType?: ContentType | 'all';
}

interface UseLessonsReturn {
    lessons: Lesson[];
    loading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

/**
 * Hook for fetching lessons from Supabase.
 * Optionally filters by language and/or content type.
 */
export function useLessons({ language = 'all', contentType = 'all' }: UseLessonsOptions = {}): UseLessonsReturn {
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLessons = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            let query = supabase
                .from('lessons')
                .select('*')
                .order('created_at', { ascending: false });

            if (language !== 'all') {
                query = query.eq('language', language);
            }

            if (contentType !== 'all') {
                query = query.eq('content_type', contentType);
            }

            const { data, error: fetchError } = await query.returns<DbLesson[]>();

            if (fetchError) {
                throw new Error(fetchError.message);
            }

            // Transform database rows to Lesson type
            const transformedLessons: Lesson[] = (data || []).map((row) => ({
                id: row.id,
                title: row.title,
                description: row.description,
                language: row.language,
                difficulty: row.difficulty,
                contentType: row.content_type || 'word',
                estimatedMinutes: row.estimated_minutes,
                vocabCount: row.vocab_count,
                createdAt: row.created_at,
            }));

            setLessons(transformedLessons);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch lessons';
            setError(message);
            console.error('Error fetching lessons:', err);
        } finally {
            setLoading(false);
        }
    }, [language, contentType]);

    useEffect(() => {
        fetchLessons();
    }, [fetchLessons]);

    return { lessons, loading, error, refetch: fetchLessons };
}
