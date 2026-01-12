# Code Cleanup Analysis
Date: January 8, 2026

## Purpose
Documenting which files are deprecated/unused vs. actively used before archiving.

## Analysis Results

### ACTIVE FILES (In Use)

#### Core Routes & Views
- ✅ `src/main.tsx` - App entry point with routing
- ✅ `src/features/home/MainMenu.tsx` - Home screen
- ✅ `src/features/lessons/LessonFeed.tsx` - Lesson browser
- ✅ `src/features/lessons/LessonGenerator.tsx` - AI lesson creation
- ✅ `src/features/exercises/ExerciseView.tsx` - Practice mode
- ✅ `src/features/vocabulary/MyVocabularyView.tsx` - Unified vocabulary view
- ✅ `src/features/sentences/MySentencesView.tsx` - Sentence collection (route: /sentences)
- ✅ `src/features/passages/MyPassagesView.tsx` - Passage collection (route: /passages)
- ✅ `src/features/lookup/LookupView.tsx` - Translation lookup

#### Core Components
- ✅ `src/components/WordDisplay.tsx` - Primary word display (unified)
- ✅ `src/components/SaveDecisionPanel.tsx` - Save controls
- ✅ `src/components/MemoryAidEditor.tsx` - Memory aid creation
- ✅ `src/components/SentenceDisplay.tsx` - Sentence rendering
- ✅ `src/components/LessonCard.tsx` - Used in LessonFeed
- ✅ `src/components/CardStack.tsx` - Used in LessonFeed
- ❓ `src/components/WordDetailCard.tsx` - Need to check if still used

#### Swipe/Navigation Components (LessonFeed only)
- ✅ `src/components/Card.tsx` - Used by CardStack
- ✅ `src/components/SwipeIndicator.tsx` - Used in LessonFeed
- ✅ `src/components/ActionButtons.tsx` - Used in LessonFeed
- ✅ `src/components/BottomNav.tsx` - Used in LessonFeed

#### Exercise Components
- ✅ `src/features/exercises/AnswerInput.tsx`
- ✅ `src/features/exercises/ExerciseFeedback.tsx`
- ✅ `src/features/exercises/ExercisePrompt.tsx`

#### Active Hooks
- ✅ `src/hooks/useSavedWords.ts` - Primary vocabulary hook
- ✅ `src/hooks/useSavedSentences.ts` - Sentence management
- ✅ `src/hooks/useSavedPassages.ts` - Passage management
- ✅ `src/hooks/useLessons.ts` - Lesson data
- ✅ `src/hooks/useLessonProgress.ts` - Progress tracking
- ✅ `src/hooks/useExercise.ts` - Exercise logic
- ✅ `src/hooks/useCardStack.ts` - Used in LessonFeed

#### Utilities (All Active)
- ✅ `src/utils/arabicLetters.ts` - Letter breakdown logic
- ✅ `src/utils/egyptianDictionary.ts` - MSA→Egyptian mappings
- ✅ `src/utils/egyptianInference.ts` - Auto-generate Egyptian
- ✅ `src/utils/hebrewCognates.ts` - Hebrew word connections
- ✅ `src/utils/soundAlikeWords.ts` - Sound-alike matching
- ✅ `src/utils/transliteration.ts` - Chat number support

#### Libraries
- ✅ `src/lib/openai.ts` - AI integration
- ✅ `src/lib/supabase.ts` - Database client

### DEPRECATED FILES (To Archive)

#### Components
- ❌ `src/features/vocabulary/SavedVocabularyView.tsx` - No imports found, replaced by MyVocabularyView
- ❌ `src/features/vocabulary/LookupModal.tsx` - Need to verify if used

#### Hooks
- ❌ `src/hooks/useSavedVocabulary.ts` - Old hook, check if replaced
- ❌ `src/hooks/useVocabulary.ts` - Old hook, check if replaced

#### Utilities
- ❌ `src/utils/testConnection.ts` - Test utility, not imported
- ❌ `src/utils/testSupabase.ts` - Test utility, not imported
- ❌ `src/utils/arabicBreakdown.ts` - Check if superseded by arabicLetters.ts

### TO INVESTIGATE
- `src/components/WordDetailCard.tsx` - Check MyVocabularyView usage
- `src/features/vocabulary/LookupModal.tsx` - Check if still used

## Next Steps
1. Verify deprecated files
2. Archive to `src/_archive/`
3. Update documentation
4. Test build
