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

/** Saved vocabulary item */
export interface SavedVocabulary {
  id: string;
  vocabulary_item_id: string;
  saved_at: string;
  notes: string | null;
}

/** Saved vocabulary with full item details (for display) */
export interface SavedVocabularyWithItem extends SavedVocabulary {
  vocabulary_items: VocabularyItem;
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
      saved_vocabulary: {
        Row: SavedVocabulary;
        Insert: Omit<SavedVocabulary, 'id' | 'saved_at'>;
        Update: Partial<Omit<SavedVocabulary, 'id' | 'saved_at'>>;
      };
    };
  };
}
