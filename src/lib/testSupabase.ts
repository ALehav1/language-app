import { supabase } from './supabase';
import type { DbVocabularyItem } from '../types';

/**
 * Test Supabase connection by querying the vocabulary_items table.
 * Run this from the browser console to verify everything works.
 */
export async function testSupabaseConnection() {
  console.log('Testing Supabase connection...');

  try {
    const { data, error } = await supabase
      .from('vocabulary_items')
      .select('*')
      .limit(1)
      .returns<DbVocabularyItem[]>();

    if (error) {
      console.error('Supabase connection failed:', error);
      return { success: false, error };
    }

    console.log('Supabase connection successful!');
    console.log('Data:', data);
    return { success: true, data };
  } catch (err) {
    console.error('Unexpected error:', err);
    return { success: false, error: err };
  }
}

/**
 * Insert a test vocabulary item to verify write access.
 */
export async function insertTestVocab() {
  console.log('Inserting test vocabulary item...');

  try {
    const { data, error } = await supabase
      .from('vocabulary_items')
      .insert({
        word: 'مرحبا',
        translation: 'hello',
        language: 'arabic',
        transliteration: 'marhaba',
        hebrew_cognate: {
          root: 'ברוך',
          meaning: 'blessing/welcome',
          notes: 'Similar greeting pattern'
        },
        mastery_level: 'new',
        times_practiced: 0,
        last_reviewed: new Date().toISOString(),
        next_review: null
      })
      .select();

    if (error) {
      console.error('Insert failed:', error);
      return { success: false, error };
    }

    console.log('Test item inserted successfully!');
    console.log('Data:', data);
    return { success: true, data };
  } catch (err) {
    console.error('Unexpected error:', err);
    return { success: false, error: err };
  }
}
