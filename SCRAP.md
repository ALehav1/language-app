# Code Graveyard

## Instructions
Before deleting 10+ lines of code, paste it here with a date and note.
This saves you when you realize you need that old code back.

---

## January 6, 2026 - REFACTORING TO SHARED COMPONENTS

### Goal
Replace bespoke word/sentence/passage displays with unified shared components:
- `WordDisplay` - for all word displays
- `SentenceDisplay` - for all sentence displays

### Files to Refactor

| File | Status | Notes |
|------|--------|-------|
| `LookupView.tsx` (passage words) | ✅ DONE | Replaced with SentenceDisplay |
| `LookupView.tsx` (single word) | ✅ DONE | Replaced with WordDisplay |
| `ExerciseFeedback.tsx` | ✅ DONE | Replaced with WordDisplay |
| `MyVocabularyView.tsx` | ✅ DONE | Replaced with WordDisplay |
| `MySentencesView.tsx` | ✅ DONE | Replaced with SentenceDisplay |
| `MyPassagesView.tsx` | ⬜ TODO | Replace passage display |
| `WordDetailCard.tsx` | ⬜ DEPRECATE | Replace with WordDisplay |

### Shared Component Interfaces

```typescript
// WordDisplay expects:
interface ArabicWordData {
  arabic: string;
  translation: string;
  arabicEgyptian?: string;
  transliteration?: string;
  transliterationEgyptian?: string;
  hebrewCognate?: HebrewCognate | null;
  letterBreakdown?: WordBreakdown[];
  exampleSentences?: ExampleSentence[];
  partOfSpeech?: string;
}

// SentenceDisplay expects:
interface ArabicSentenceData {
  arabicMsa: string;
  arabicEgyptian: string;
  transliterationMsa: string;
  transliterationEgyptian: string;
  english: string;
  explanation?: string;
  words?: ArabicWordData[];
}
```

### Data Mapping Notes

**From PassageResult.sentences[].words (API) → ArabicWordData:**
```typescript
// API returns:
{ arabic, arabic_egyptian, transliteration, transliteration_egyptian, translation, part_of_speech }

// Map to:
{ arabic, arabicEgyptian, transliteration, transliterationEgyptian, translation, partOfSpeech }
```

**From ExampleSentence (API) → ArabicSentenceData:**
```typescript
// API returns:
{ arabic_msa, arabic_egyptian, transliteration_msa, transliteration_egyptian, english, explanation }

// Map to:
{ arabicMsa, arabicEgyptian, transliterationMsa, transliterationEgyptian, english, explanation }
```

---

## January 6, 2026 - Old ExerciseFeedback Word Details + Example Sentences

Replaced with WordDisplay and SentenceDisplay components.

```tsx
{/* 1. The Word itself with translation + both dialect pronunciations */}
<div className="glass-card p-4">
    <div className="flex items-center justify-between mb-3">
        <span className={`text-3xl font-bold text-white ${isArabic ? 'font-arabic' : ''}`}>
            {arabicWordWithHarakat}
        </span>
        <span className="text-white/60 text-lg">{item.translation}</span>
    </div>
    {/* Pronunciations - 25+ lines of inline JSX */}
</div>

{/* 2. Hebrew Cognate - 25+ lines */}
{/* 3. Example Sentences - 60+ lines with inline modal */}
{/* 4. Letter Breakdown - 25+ lines */}
```

---

## January 6, 2026 - Old LookupView Passage Sentence Display

Replaced with SentenceDisplay component for consistency.

```tsx
{/* Sentence by sentence breakdown */}
{passageResult.sentences?.map((sentence, sentenceIdx) => (
    <div key={sentenceIdx} className="glass-card p-4 space-y-4">
        {/* Sentence header */}
        <div className="flex items-center justify-between">
            <span className="text-xs text-white/40">Sentence {sentenceIdx + 1}</span>
            <button
                onClick={() => handleSaveSentence({...})}
                disabled={isSentenceAlreadySaved(sentence.arabic_msa)}
                className={...}
            >
                {isSentenceAlreadySaved(sentence.arabic_msa) ? '✓ Saved' : '💬 Save'}
            </button>
        </div>

        {/* Primary dialect (based on preference) - 70+ lines of inline JSX */}
        {dialectPreference === 'egyptian' ? (...) : (...)}

        {/* Translation */}
        <div className="text-white">{sentence.translation}</div>

        {/* Explanation */}
        {sentence.explanation && (...)}

        {/* Word-by-word breakdown - 60+ lines of inline JSX */}
        <div>
            <div className="text-purple-400/70 text-xs font-bold uppercase tracking-wider mb-3">Word Breakdown</div>
            <div className="space-y-2">
                {sentence.words?.map((word, wordIdx) => {
                    // ... inline word display with Hebrew cognate
                })}
            </div>
        </div>
    </div>
))}
```

---

## January 4, 2026 - Floating Create Button

Removed from `LessonGenerator.tsx`. The floating "+" button was causing issues - users clicking in the menu area were accidentally hitting this button and opening the generator. Now the generator only opens from the menu's "Create Lesson" button.

```tsx
if (!isOpen) {
    return (
        <button
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 w-14 h-14 bg-white text-surface-300 rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
            aria-label="Create AI Lesson"
        >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
        </button>
    );
}
```

---

## January 4, 2026 - Old Vertical Letter Breakdown

Removed from `ExerciseFeedback.tsx`. Changed to horizontal right-to-left layout to match Arabic reading order.

```tsx
{/* 3. Arabic Letter Breakdown */}
{isArabic && letterBreakdown.length > 0 && (
    <div className="glass-card p-4">
        <div className="text-teal-400/70 text-xs font-bold uppercase tracking-wider mb-3">Letter Breakdown</div>
        <div className="space-y-3">
            {letterBreakdown.map((l, idx) => (
                <div key={idx} className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0 last:pb-0">
                    <div className="flex items-center gap-4">
                        <span className="text-2xl font-arabic text-white w-8 text-center">{l.letter}</span>
                        <span className="text-white/80">{l.name}</span>
                    </div>
                    <span className="text-white/50 font-mono text-sm">/{l.sound}/</span>
                </div>
            ))}
        </div>
    </div>
)}
```

---

## January 4, 2026 - Old Transliteration Validation

Removed from `transliteration.ts`. Made validation more generous with Arabic chat numbers and higher tolerance.

```typescript
function normalizeTransliteration(s: string): string {
    return s
        .toLowerCase()
        .trim()
        .replace(/['`ʼ'']/g, "'")
        .replace(/aa/g, 'a')
        .replace(/ee/g, 'i')
        .replace(/oo/g, 'u')
        .replace(/ou/g, 'u')
        .replace(/kh/g, 'x')
        .replace(/gh/g, 'g')
        .replace(/th/g, 't')
        .replace(/dh/g, 'd')
        .replace(/sh/g, 'š')
        .replace(/-/g, ' ')
        .replace(/\s+/g, ' ');
}

// Old tolerance was too strict:
const maxDistance = correctNorm.length <= 5 ? 1
    : correctNorm.length <= 10 ? 2
    : 3;
```

---

## January 4, 2026 - Old Menu Styling

Removed from `LessonFeed.tsx`. Replaced with polished bottom sheet menu with colored buttons and gradient styling.

```tsx
{/* Menu Overlay */}
{menuOpen && (
    <div
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
        onClick={() => setMenuOpen(false)}
    >
        <div
            className="absolute bottom-0 left-0 right-0 bg-surface-300 rounded-t-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Menu</h3>
                <button
                    onClick={() => setMenuOpen(false)}
                    className="w-10 h-10 text-white/50 hover:text-white flex items-center justify-center"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Language Selection */}
            <div>
                <div className="text-white/50 text-sm mb-2">Language</div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setLanguageFilter('arabic')}
                        className={`flex-1 py-3 rounded-xl text-sm font-medium ${
                            languageFilter === 'arabic'
                                ? 'bg-white text-surface-300'
                                : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                    >
                        العربية Arabic
                    </button>
                    <button
                        onClick={() => setLanguageFilter('spanish')}
                        className={`flex-1 py-3 rounded-xl text-sm font-medium ${
                            languageFilter === 'spanish'
                                ? 'bg-white text-surface-300'
                                : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                    >
                        Español Spanish
                    </button>
                </div>
            </div>

            {/* Lesson Type Selection */}
            <div>
                <div className="text-white/50 text-sm mb-2">Lesson Type</div>
                <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(CONTENT_TYPE_INFO) as ContentType[]).map(type => (
                        <button
                            key={type}
                            onClick={() => { setContentFilter(type); setMenuOpen(false); }}
                            className={`py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 ${
                                contentFilter === type
                                    ? 'bg-white text-surface-300'
                                    : 'bg-white/10 text-white hover:bg-white/20'
                            }`}
                        >
                            <span>{CONTENT_TYPE_INFO[type].icon}</span>
                            <span>{CONTENT_TYPE_INFO[type].label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="h-px bg-white/10" />

            {/* Create Lesson - Always visible */}
            <button
                onClick={() => { setGeneratorOpen(true); setMenuOpen(false); }}
                className="w-full py-4 bg-white text-surface-300 font-bold rounded-xl text-lg"
            >
                + Create New Lesson
            </button>

            {/* Saved Words */}
            <button
                onClick={() => { navigate('/saved'); setMenuOpen(false); }}
                className="w-full py-4 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 flex items-center justify-center gap-2"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                Saved Words
            </button>
        </div>
    </div>
)}
```
