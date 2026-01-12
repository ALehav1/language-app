# Current State - Language Learning App

**Last Updated:** January 10, 2026, 11:20 AM  
**Version:** 1.1 - Unified Component Architecture

---

## CRITICAL - Read This Before Making Changes

### Shared Component Architecture

**BOTH Lessons and Lookup views MUST use the EXACT SAME components:**

1. **WordDisplay** (`src/components/WordDisplay.tsx`)
   - Displays word/sentence with Egyptian first, MSA second
   - Shows pronunciations, letter breakdown, Hebrew cognate
   - Shows example sentences (INSIDE WordDisplay, not separate)
   - Used everywhere: Lessons, Lookup, My Saved Vocabulary

2. **Context Tiles** (always in this order):
   - **ContextTile** - Root, Egyptian usage, MSA comparison, cultural notes
   - **MemoryAidTile** - Collapsible dropdown with DALL-E + notes
   - **Example Sentences** - Rendered by WordDisplay component
   - **ChatTile** - Interactive AI Q&A

3. **SaveDecisionPanel** (`src/components/SaveDecisionPanel.tsx`)
   - Practice / Archive / Skip buttons
   - NO embedded memory aid UI (that's in MemoryAidTile)
   - Always at bottom after all tiles

### Content Classification

**Consistent across ALL features:**
- **Word:** 1 word only → use `lookupWord` API
- **Sentence:** 2+ words, 1 sentence → use `lookupWord` API  
- **Passage:** 2+ sentences (multiple periods) → use `analyzePassage` API

Detection logic: Split by sentence terminators (`[.؟!]+`), count non-empty sentences.

---

## Egyptian Dialect Requirements

### AI Generation Rules

**FORBIDDEN MSA Words** (DO NOT generate these):
- ممكن (mumkin) → Use يمكن (yemken) 
- مرآة (mir'a) → Use مراية (meraya)
- غرفة (ghurfa) → Use أوضة (oda)
- سيارة (sayyara) → Use عربية (3arabeyya)
- حقيبة (haqiba) → Use شنطة (shanTa)

**Always Generate:**
- Native Egyptian vocabulary (not MSA adapted to Egyptian pronunciation)
- Words WITH vowel marks (harakat): َ ُ ِ ْ ً ٌ ٍ ّ
- Letter breakdown WITH vowels (e.g., "مَ" not "م")

### Vowel Mark Requirement

**CRITICAL:** All Arabic text MUST include harakat (vowel diacritics).
- AI prompt explicitly requires: "WITH FULL VOWEL MARKS (harakat)"
- Example: شُكْرًا not شكرا
- Applies to: word field, letter breakdown, example sentences

---

## Active Components

### Display Components
- ✅ `WordDisplay.tsx` - Unified word/sentence display
- ✅ `ContextTile.tsx` - Linguistic context
- ✅ `MemoryAidTile.tsx` - Collapsible memory aid
- ✅ `ChatTile.tsx` - Interactive Q&A
- ✅ `SaveDecisionPanel.tsx` - Save controls
- ✅ `MemoryAidEditor.tsx` - Image + note UI (used by MemoryAidTile)

### Feature Views
- ✅ `features/lessons/` - Lesson browser, generator, exercise flow
- ✅ `features/lookup/` - Word/sentence/passage translation
- ✅ `features/vocabulary/` - Unified saved vocabulary (Words/Sentences/Passages)
- ✅ `features/exercises/` - Practice flow with ExerciseFeedback

### Data Hooks
- ✅ `useSavedWords` - Primary vocabulary hook
- ✅ `useLessons` - Lesson data
- ✅ `useExercise` - Exercise state management

---

## Deprecated/Archived

**DO NOT USE these files:**
- ❌ `WordDetailCard.tsx` → ARCHIVED (replaced by WordDisplay)
- ❌ `features/sentences/` → Legacy (use MyVocabularyView with filtering)
- ❌ `features/passages/` → Legacy (use MyVocabularyView with filtering)

**Archive Location:** `src/_archive/deprecated_components/`

---

## AI Generation Flow

### Lesson Generation (`generateLessonContent`)

1. **Dialect Selection:**
   - Egyptian (default) or MSA
   - Egyptian: Native vocabulary + colloquial pronunciation
   - MSA: Formal/classical vocabulary

2. **Content with Vowels:**
   - All Arabic words include harakat
   - Letter breakdown shows vowel-marked letters
   - Example sentences fully vocalized

3. **Exclusion List:**
   - Passes up to 50 already-practiced words to avoid duplicates
   - AI generates new vocabulary user hasn't seen

### Lookup Flow (`lookupWord`)

1. **Single Word/Sentence:**
   - Returns: arabic_word (with harakat), translation, pronunciations
   - Egyptian pronunciation (primary), MSA (reference)
   - word_context (root, Egyptian usage, MSA comparison)
   - letter_breakdown (with vowels), hebrew_cognate, example_sentences

2. **Passage (2+ sentences):**
   - Uses `analyzePassage` 
   - Sentence-by-sentence breakdown
   - Word-by-word analysis for each sentence

---

## Terminology - Use Consistently

**Everywhere in code, UI, and docs:**
- **Word** - single word
- **Sentence** - multiple words, one sentence
- **Passage** - multiple sentences

**DO NOT USE:**
- ❌ "phrase" (ambiguous - use "sentence")
- ❌ "dialog" (use "sentence" with context)
- ❌ "reading" (use "passage")

---

## Development Checklist

Before making changes:

1. ✅ Read this file
2. ✅ Check if component already exists (don't duplicate)
3. ✅ Use WordDisplay for word/sentence display (don't create new)
4. ✅ Maintain tile order: Context → MemoryAid → Examples → Chat → Save
5. ✅ Ensure Egyptian shows first everywhere
6. ✅ Include harakat in all Arabic text
7. ✅ Test both Lessons AND Lookup (should look identical)
8. ✅ Update this file if architecture changes

---

## Quick Reference

**Shared Components Pattern:**
```tsx
<WordDisplay word={data} showExampleSentences={false} />
<ContextTile context={data.word_context} />
<MemoryAidTile ... />
{/* Example sentences render here (WordDisplay with showExampleSentences={true}) */}
<ChatTile ... />
<SaveDecisionPanel ... />
```

**Content Classification:**
```typescript
const sentences = text.split(/[.؟!]+/).filter(s => s.trim().length > 0);
if (sentences.length > 1) {
  // Passage - use analyzePassage
} else {
  // Word or Sentence - use lookupWord
}
```

**Egyptian Vocabulary Check:**
```typescript
// ✅ CORRECT - Native Egyptian
أوضة، عربية، شنطة، فلوس، يمكن، مراية

// ❌ WRONG - MSA words
غرفة، سيارة، حقيبة، مال، ممكن، مرآة
```
