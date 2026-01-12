# Language Learning App - Quick Reference

**Last Updated:** January 10, 2026 (Evening)  
**Status:** v1.2 UI Polish & Dialogs Support

---

## Overview

AI-powered Arabic learning app focused on Egyptian dialect. Built for 5-10 minute practice sessions.

**Tech Stack:** React 19 + TypeScript + Vite + TailwindCSS + Supabase + OpenAI

**For detailed documentation, see [ARCHITECTURE.md](./ARCHITECTURE.md)**

---

## Current State (v1.0)

### Main Features
- **Lessons** - AI-generated content with dual-input exercises
- **My Saved Vocabulary** - Unified view with Words/Sentences/Passages/Dialogs filtering
- **Lookup** - Translate any text with word-by-word breakdown
- **Memory Aids** - DALL-E images + notes
- **Explicit Save Control** - Practice/Archive/Skip buttons with loading feedback

### Navigation
- Main Menu → 3 tiles (Lessons, Lookup, My Saved Vocabulary)
- Routes: `/` `/lessons` `/exercise/:id` `/words` `/lookup`

### Key Components
- `WordDisplay` - Unified display (everywhere)
- `SaveDecisionPanel` - Save controls
- `useSavedWords` - Primary data hook

---

## File Structure

```
src/
├── features/        # Feature modules (home, lessons, exercises, vocabulary, lookup)
├── components/      # Shared UI (WordDisplay, SaveDecisionPanel, MemoryAidEditor)
├── hooks/          # Data hooks (useSavedWords, useLessons, useExercise)
├── lib/            # External services (supabase, openai)
├── utils/          # Utilities (egyptianDictionary, hebrewCognates, arabicLetters)
└── types/          # TypeScript definitions
```

**Archived:** `src/_archive/` - Deprecated files excluded from build

---

## Key Concepts

### Unified Vocabulary Model
All saved content in `saved_words` table, classified by word count:
- **Words**: 1 word
- **Sentences**: 2+ words, 1 sentence
- **Passages**: Multiple sentences
- **Dialogs**: Conversational exchanges (treated as multi-sentence content)

### Dialect Handling
1. `egyptianDictionary.ts` - Static mappings (150+)
2. `egyptianInference.ts` - Rule-based generation
3. API response - OpenAI fallback

### Save Flow
User chooses for each item:
- Save to Practice (status: 'active')
- Save to Archive (status: 'learned')
- Skip (don't save)

---

## Development Guidelines

**Mobile-First:** Test 375px → 768px → 1024px  
**TypeScript:** Strict mode, no `any`  
**Components:** One per file, feature-based folders  
**Testing:** Manual only (automated planned)

---

## Recent Changes

### January 10, 2026 (Evening)
- ✅ Lessons UI restructured with 4 content categories (Words/Phrases/Passages/Dialogs)
- ✅ Quick Topics integrated into LessonGenerator modal
- ✅ Compact saved lessons design (reduced spacing/padding)
- ✅ Example sentences now collapsible with teal color scheme
- ✅ Letter breakdown fixed for proper RTL layout
- ✅ Dialogs filter added to My Vocabulary view

### January 8, 2026
- Main menu reorganized (2x2 grid)
- Content type filtering implemented
- Loading/success feedback on save buttons
- Deprecated files archived
- Documentation consolidated

---

## Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Complete technical reference
- **[CLEANUP_ANALYSIS.md](./CLEANUP_ANALYSIS.md)** - File audit
- **[README.md](./README.md)** - User-facing overview
- **[README_OLD.md](./README_OLD.md)** - Historical reference
- **[agents_old.md](./agents_old.md)** - Previous version (archived)

---

## Quick Commands

```bash
# Development
npm run dev

# Build
npm run build

# Deploy (Vercel)
vercel --prod
```

---

**For comprehensive documentation, always refer to [ARCHITECTURE.md](./ARCHITECTURE.md)**
