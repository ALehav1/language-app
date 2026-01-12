# agents.md - Language Learning App

## Project Overview

Language Learning App - AI-powered language learning that teaches how native speakers actually talk
Target: Non-technical adult learner learning Arabic (novice) and Spanish (intermediate)
Stack: React + TypeScript + Vite + Tailwind + Supabase + OpenAI

Last Updated: January 7, 2026 (UI Fixes & Memory Aid Persistence)

## What Makes This App Different

- Multiple content types: words, phrases, dialogs, paragraphs
- AI generates lessons appropriate to your level
- Semantic answer validation - accepts synonyms and typos
- Tracks what you know and struggle with using spaced repetition
- For Arabic: Hebrew cognates (static lookup table) + letter breakdown for character learning
- Save vocabulary items, sentences, and full passages for later review
- **Lookup any text** - paste Arabic OR English, get full translation + word-by-word breakdown
- Resume lessons from where you left off
- Desktop-optimized with 3-column layout
- NO gamification - no streaks, points, badges
- Designed for 5-10 minute sessions, often when you can't speak aloud

## Current Features

### Core Functionality
- **MainMenu home screen** - 5 clear navigation options
- **Lesson system** with AI generation, filters, and direct start
- **Exercise flow** with dual-input for Arabic (transliteration + translation)
- **My Words/Sentences/Passages** - saved content management
- **Lookup Mode** - translate anything with auto-detection
- **Resume lessons** - progress saved for 24 hours
- **Spaced repetition** mastery tracking

### Arabic-Specific Features
- **Hebrew cognates** - 150+ static mappings + sound-alike system
- **Letter breakdown** - RTL display with names and sounds
- **Dialect support** - Egyptian Arabic (primary) + MSA (reference)
- **Transliteration validation** - fuzzy matching with chat numbers
- **Egyptian inference** - automatic when API lacks Egyptian variant

### Recent Improvements (January 7, 2026)
- **Fixed WordDisplay Layout** - Egyptian Arabic now prominent, Hebrew cognate smaller
- **Letter Breakdown Display** - Fixed missing breakdown in Word Details modal
- **Memory Aid Persistence** - Memory aids now save and update properly across all instances
- **Image Display Fix** - Memory aid images no longer cut off (object-contain)
- **Modal Width** - Increased to max-w-2xl for better content display

### UI/UX Features
- Glassmorphism dark theme
- Touch-friendly design (48px+ targets)
- 3-column desktop layout
- Skeleton loading animations
- Progress bar with colored segments
- Modal dialogs for detailed views

### Save & Memory System
- **Explicit save control** - Practice/Archive/Skip for each word
- **Memory aids** - DALL-E visuals + personal notes
- **Status tracking** - active (practicing) vs learned (archived)
- **Context preservation** - tracks where words were learned

## Technical Architecture

### Frontend
- React 19 with TypeScript
- Vite build system
- Tailwind CSS for styling
- React Router for navigation

### Backend & Services
- Supabase for data persistence
- OpenAI API for lesson generation and validation
- DALL-E for memory aid images

### Key Components
- `WordDisplay` - unified word display component
- `SentenceDisplay` - sentence with word breakdown
- `SaveDecisionPanel` - explicit save control
- `MemoryAidEditor` - visual and note creation

### Data Model
```typescript
// Simplified core types
interface VocabularyItem {
  word: string
  translation: string
  language: 'arabic' | 'spanish'
  transliteration?: string
  hebrew_cognate?: HebrewCognate
}

interface SavedWord {
  arabic_word: string
  english_translation: string
  pronunciation_standard: string
  pronunciation_egyptian?: string
  status: 'active' | 'learned'
  memory_aid?: MemoryAid
}
```

## Development Phases Summary

1. **Foundation** - Basic lesson flow and UI
2. **Arabic Support** - Dual input, transliteration
3. **Data Persistence** - Supabase integration
4. **Vocabulary System** - My Words with status tracking
5. **Dialect Support** - Egyptian + MSA
6. **Memory Aids** - Visual learning tools
7. **Save Control** - Explicit user choice
8. **Latest** - Letter breakdown fix, enhanced memory aids

## Known Issues Fixed

- ✅ Letter breakdown not showing in modals
- ✅ Hebrew cognate display issues
- ✅ Memory aid images getting cut off
- ✅ Memory aids not persisting when saving words
- ✅ Font sizes and alignment issues

## Future Considerations

- Spanish language support expansion
- Offline mode with sync
- Audio pronunciation
- More content types (stories, conversations)
- Community features
