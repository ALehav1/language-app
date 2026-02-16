import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Language-neutral sentence data returned to consumers.
 * Maps from DB columns (arabic_text, arabic_egyptian) to neutral names.
 */
export interface SentenceData {
    id: string;
    primary_text: string;        // DB: arabic_text — Arabic MSA or Spanish LatAm
    alt_text?: string;           // DB: arabic_egyptian — Egyptian Arabic or Spain Spanish
    transliteration?: string;
    transliteration_alt?: string; // DB: transliteration_egyptian
    translation: string;
    explanation?: string;
    topic?: string;
    source?: string;
    language: 'arabic' | 'spanish';
    status: 'active' | 'learned';
    memory_note?: string | null;
    memory_image_url?: string | null;
    created_at: string;
    updated_at: string;
}

/**
 * Language-neutral input for saving a sentence.
 * The hook maps these to DB column names internally.
 */
export interface SaveSentenceInput {
    primary_text: string;        // → DB: arabic_text
    alt_text?: string;           // → DB: arabic_egyptian
    transliteration?: string;
    transliteration_alt?: string; // → DB: transliteration_egyptian
    translation: string;
    explanation?: string;
    topic?: string;
    source?: string;
    language: 'arabic' | 'spanish';
    status?: 'active' | 'learned';
    memory_note?: string;
    memory_image_url?: string;
}

// Raw DB row shape (internal — not exported)
interface DbSentenceRow {
    id: string;
    arabic_text: string;
    arabic_egyptian?: string;
    transliteration: string;
    transliteration_egyptian?: string;
    translation: string;
    explanation?: string;
    topic?: string;
    source?: string;
    language: 'arabic' | 'spanish';
    status: 'active' | 'learned';
    memory_note?: string | null;
    memory_image_url?: string | null;
    created_at: string;
    updated_at: string;
}

/** Map a DB row to the neutral SentenceData shape. */
function fromDbRow(row: DbSentenceRow): SentenceData {
    return {
        id: row.id,
        primary_text: row.arabic_text,
        alt_text: row.arabic_egyptian,
        transliteration: row.transliteration,
        transliteration_alt: row.transliteration_egyptian,
        translation: row.translation,
        explanation: row.explanation,
        topic: row.topic,
        source: row.source,
        language: row.language,
        status: row.status,
        memory_note: row.memory_note,
        memory_image_url: row.memory_image_url,
        created_at: row.created_at,
        updated_at: row.updated_at,
    };
}

/**
 * Hook for managing saved sentences.
 * Provides CRUD operations and filtering.
 * Maps between language-neutral TypeScript interfaces and Arabic-named DB columns.
 */
export function useSavedSentences(language?: 'arabic' | 'spanish') {
    const [sentences, setSentences] = useState<SentenceData[]>([]);
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

            if (language) {
                query = query.eq('language', language);
            }

            const { data, error: fetchError } = await query;

            if (fetchError) throw fetchError;
            setSentences((data || []).map((row: DbSentenceRow) => fromDbRow(row)));
        } catch (err) {
            console.error('[useSavedSentences] Fetch error:', err);
            setError('Failed to load sentences');
        } finally {
            setLoading(false);
        }
    }, [language]);

    useEffect(() => {
        fetchSentences();
    }, [fetchSentences]);

    // Save a new sentence
    const saveSentence = useCallback(async (input: SaveSentenceInput): Promise<SentenceData | null> => {
        try {
            // Check if sentence already exists (by primary text + language)
            const { data: existing } = await supabase
                .from('saved_sentences')
                .select('id')
                .eq('arabic_text', input.primary_text)
                .eq('language', input.language)
                .single();

            if (existing) {
                return null;
            }

            // Map neutral input → DB column names
            const { data, error: insertError } = await supabase
                .from('saved_sentences')
                .insert({
                    arabic_text: input.primary_text,
                    arabic_egyptian: input.alt_text || null,
                    transliteration: input.transliteration || '',
                    transliteration_egyptian: input.transliteration_alt || null,
                    translation: input.translation,
                    explanation: input.explanation || null,
                    topic: input.topic || null,
                    source: input.source || null,
                    language: input.language,
                    status: input.status || 'active',
                    memory_note: input.memory_note || null,
                    memory_image_url: input.memory_image_url || null,
                })
                .select()
                .single();

            if (insertError) throw insertError;

            const mapped = fromDbRow(data);
            setSentences(prev => [mapped, ...prev]);
            return mapped;
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

    // Update sentence status
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

    // Check if a sentence is already saved (by primary text)
    const isSentenceSaved = useCallback((primaryText: string): boolean => {
        return sentences.some(s => s.primary_text === primaryText);
    }, [sentences]);

    // Get saved sentence by primary text
    const getSentenceByText = useCallback((primaryText: string): SentenceData | null => {
        return sentences.find(s => s.primary_text === primaryText) || null;
    }, [sentences]);

    // Update memory aids
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
