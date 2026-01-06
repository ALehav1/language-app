export type Language = 'arabic' | 'spanish';

export type ArabicDialect = 'standard' | 'egyptian';

export type MasteryLevel = 'new' | 'learning' | 'practiced' | 'mastered';

export type ContentType = 'word' | 'phrase' | 'dialog' | 'paragraph';

export interface HebrewCognate {
  root?: string;
  meaning?: string;
  notes?: string;
}

export interface LetterBreakdown {
  letter: string;
  name: string;
  sound: string;
}

/** Example sentence showing word in context - with both MSA and Egyptian versions */
export interface ExampleSentence {
  // MSA (formal) version
  arabic_msa: string;              // MSA sentence with harakat
  transliteration_msa: string;     // MSA pronunciation
  // Egyptian (spoken) version - PRIMARY for everyday use
  arabic_egyptian: string;         // Egyptian Arabic sentence
  transliteration_egyptian: string; // Egyptian pronunciation
  // Shared
  english: string;                 // English translation
  explanation?: string;            // Usage note - when to use Egyptian vs MSA
}

export interface VocabularyItem {
  id: string;
  word: string;
  translation: string;
  language: Language;
  content_type: ContentType;
  transliteration?: string;
  hebrew_cognate?: HebrewCognate | null;
  letter_breakdown?: LetterBreakdown[] | null;
  // Dialog-specific fields
  speaker?: string;
  context?: string;
  mastery_level: MasteryLevel;
  last_reviewed: string | null;
  times_practiced: number;
  next_review: string | null;
  created_at: string;
}

export interface LessonProgress {
  id: string;
  lesson_id: string;
  language: Language;
  completed_date: string;
  score: number | null;
  items_practiced: number;
  created_at: string;
}

/** Database lesson row (matches Supabase schema) */
export interface DbLesson {
  id: string;
  title: string;
  description: string;
  language: Language;
  difficulty: MasteryLevel;
  content_type: ContentType;
  estimated_minutes: number;
  vocab_count: number;
  created_at: string;
}

/** Database vocabulary item with lesson_id */
export interface DbVocabularyItem extends VocabularyItem {
  lesson_id: string;
}

/** 
 * Word status for saved vocabulary:
 * - 'active': Still practicing this word (default for saved/looked up words)
 * - 'learned': Archived - you know this word well, kept for reference
 */
export type WordStatus = 'active' | 'learned';

/** Saved Arabic word (Phase 12 - Arabic only) */
export interface SavedWord {
  id: string;
  word: string;                              // Arabic word
  translation: string;                       // English meaning
  language: 'arabic';                        // Phase 12 is Arabic-only
  
  // Dialect-specific pronunciations
  pronunciation_standard: string | null;     // MSA/Fusha transliteration
  pronunciation_egyptian: string | null;     // Egyptian Arabic transliteration
  
  // Learning metadata
  letter_breakdown: LetterBreakdown[] | null;
  hebrew_cognate: HebrewCognate | null;
  example_sentences: ExampleSentence[] | null;  // Example sentences showing usage
  
  // Organization
  topic: string | null;
  tags: string[] | null;
  
  // Review status
  status: WordStatus;
  times_practiced: number;
  times_correct: number;
  last_practiced: string | null;
  next_review: string | null;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

/** Source context for a saved word */
export interface WordContext {
  id: string;
  saved_word_id: string;
  
  // Context data
  content_type: ContentType | 'lookup';      // 'lookup' for manually added words
  full_text: string;                         // The complete phrase/sentence
  full_transliteration: string | null;
  full_translation: string;
  
  // Dialog-specific
  speaker: string | null;
  dialog_context: string | null;
  
  // Source reference
  lesson_id: string | null;
  vocabulary_item_id: string | null;
  
  created_at: string;
}

/** Saved word with its contexts (for display) */
export interface SavedWordWithContexts extends SavedWord {
  contexts: WordContext[];
}

export interface Database {
  public: {
    Tables: {
      lessons: {
        Row: DbLesson;
        Insert: Omit<DbLesson, 'id' | 'created_at'>;
        Update: Partial<Omit<DbLesson, 'id' | 'created_at'>>;
      };
      vocabulary_items: {
        Row: DbVocabularyItem;
        Insert: Omit<DbVocabularyItem, 'id' | 'created_at'>;
        Update: Partial<Omit<DbVocabularyItem, 'id' | 'created_at'>>;
      };
      lesson_progress: {
        Row: LessonProgress;
        Insert: Omit<LessonProgress, 'id' | 'created_at'>;
        Update: Partial<Omit<LessonProgress, 'id' | 'created_at'>>;
      };
      saved_words: {
        Row: SavedWord;
        Insert: Omit<SavedWord, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<SavedWord, 'id' | 'created_at'>>;
      };
      word_contexts: {
        Row: WordContext;
        Insert: Omit<WordContext, 'id' | 'created_at'>;
        Update: Partial<Omit<WordContext, 'id' | 'created_at'>>;
      };
    };
  };
}
