# Language Learning App

**AI-powered Arabic learning focused on Egyptian dialect**

Last Updated: January 13, 2026 (Night) - Spanish UX Contract v1 Implementation

**🚀 Current Production:** https://language-m6q3yz1z4-alehav1s-projects.vercel.app

---

## 🔒 Architectural Invariants (Do Not Violate)

**These rules prevent regressions. Follow them strictly:**

1. **WordSurface is the ONLY word renderer** - Never create parallel word display components
2. **SentenceSurface is the ONLY sentence renderer** - Sentences are tiles, words are chips inside them
3. **Sentence = one tile, words = chips** - Single words are compact, never full-width
4. **LanguageSwitcher controls language** - LanguageBadge is display-only, not interactive
5. **Spanish and Arabic NEVER share field names** - No `arabic_word` for Spanish data
6. **Canonical routes:**
   - Word detail: `/vocabulary/word`
   - Vocabulary list: `/words`
   - Lookup: `/lookup`
7. **Any new feature must plug into existing surfaces** - Do not create new renderers

⚠️ **Changes to these invariants require explicit intent and justification.**

---

## 📊 **NEW: Comprehensive Codebase Analysis (Jan 13, 2026)**

**[👉 View Complete Analysis](./docs/comprehensive-analysis-2026-01-13/)** - 271 KB of detailed documentation including:
- **[Executive Summary](./docs/comprehensive-analysis-2026-01-13/EXECUTIVE_SUMMARY.md)** - Critical issues, ROI analysis, roadmap
- **[48+ Issues Identified](./docs/comprehensive-analysis-2026-01-13/ISSUES_ANALYSIS.md)** - With fixes and priorities
- **[52 Recommendations](./docs/comprehensive-analysis-2026-01-13/RECOMMENDATIONS.md)** - Implementation guides with code examples
- **[Complete Architecture](./docs/comprehensive-analysis-2026-01-13/COMPREHENSIVE_ARCHITECTURE.md)** - System design and patterns
- **[All User Flows](./docs/comprehensive-analysis-2026-01-13/USER_FLOWS.md)** - Step-by-step journey maps
- **[Data Architecture](./docs/comprehensive-analysis-2026-01-13/DATA_ARCHITECTURE.md)** - Database and state management

**Quick Start:** Read [START_HERE.md](./docs/comprehensive-analysis-2026-01-13/START_HERE.md) for navigation guide.

---

## 🇲🇽 Spanish UX Contract v1 (Jan 13, 2026)

**Architecture Changes - Composition Pattern:**

| Component | Purpose |
|-----------|---------||
| `WordSurface.tsx` | **Canonical word renderer** - Composition shell for Arabic + Spanish |
| `WordDisplay.tsx` | Arabic-specific rendering (internal to WordSurface) |
| `SpanishWordBody.tsx` | Spanish-specific rendering (internal to WordSurface) |
| `uiTokens.ts` | Shared Tailwind class tokens for consistent styling |

**Data Types:**

| File | Types |
|------|-------|
| `src/types/word.ts` | `SpanishWordData`, `ArabicWordData`, `WordData` union, type guards |
| `src/contexts/LanguageContext.tsx` | `ArabicDialect`, `SpanishDialect`, `DialectPreferences` |

**UX Contract Implementation:**

1. **P2-A: Spanish inline chips** ✅ - `WordBreakdownList` renders Spanish as compact chips (not full-width rows)
2. **P2-B: Word click → canonical Word Surface** ✅ - Clicks navigate to `/vocabulary/word` with `location.state`
3. **P2-C: Spanish data parity** ✅ - `SpanishLookupResult` with proper Spanish fields (NO Arabic overloading)
4. **P2-D: Spanish dialect toggle** ✅ - `LanguageContext` has `setSpanishDialect('latam' | 'spain')`
5. **P2-E: Global language switcher** ✅ - `LanguageSwitcher` controls language; `LanguageBadge` is display-only
6. **P2-F: Theme tokens** ✅ - `src/styles/uiTokens.ts` for consistent styling
7. **P2-G: Double-click fix** ✅ - Translate button has `type="button"`, `touchAction: manipulation`
8. **P2-H: Supabase 400s** ✅ - Fixed in P1.4 (queries use `in('status', ['active', 'learned'])`)

**Spanish Data Contract (NO Arabic Field Overloading):**

| API Response Field | Type | Purpose |
|-------------------|------|---------||
| `spanish_latam` | string | Primary Spanish form (LatAm neutral) |
| `spanish_spain` | string | Spain variant (if different) |
| `translation_en` | string | English translation |
| `word_context.usage_notes` | string | Common usage contexts |
| `word_context.latam_notes` | string | LatAm-specific notes |
| `word_context.spain_notes` | string | Spain-specific notes |
| `example_sentences[].spanish_latam` | string | LatAm example sentence |
| `example_sentences[].spanish_spain` | string | Spain variant (if different) |
| `memory_aid.mnemonic` | string | Memory trick |
| `memory_aid.visual_cue` | string | Visual concept |

**Storage Keys:**

| Key | Value |
|-----|-------|
| `language-app-selected-language` | `'arabic'` \| `'spanish'` |
| `language-app-dialect-preferences` | `{ arabic: 'egyptian' \| 'standard', spanish: 'latam' \| 'spain' }` |

**User Flow - Spanish Word Drilldown:**
```
Lookup → Enter Spanish text → Translate
    ↓
Sentence tile with inline word chips (Spanish + English gloss)
    ↓
Click chip → navigate to /vocabulary/word?from=lookup
    ↓
Word Surface with: translation, usage notes, memory aid, examples, save controls
    ↓
Save → returns to Lookup
```

---

## Routes

**Canonical routes:**

| Path | Purpose |
|------|---------||
| `/` | Main menu |
| `/lessons` | Browse/create lessons |
| `/exercise/:id` | Practice flow |
| `/vocabulary/word` | Word detail page (from lookup/chips) |
| `/words` | Vocabulary list view |
| `/lookup` | Translation lookup |

**Legacy routes** (backward compatibility only):
- `/sentences` - Use `/words?type=sentences` instead
- `/passages` - Use `/words?type=passages` instead

---

## Testing

The project uses Vitest + React Testing Library for automated testing.

**Run tests:**
```bash
npm test              # Watch mode
npm run test:run      # Single run
npm run test:ui       # Visual UI
npm run test:coverage # Coverage report
npm run lint          # TypeScript type checking
```

**Current Coverage:** 177/177 tests passing
- Domain + hooks + critical UX flows: **automated** (Vitest + RTL)
- Full UX regression: **manual** at 375px viewport
- `useExercise` - 19 tests (exercise logic, persistence)
- `useCardStack` - 16 tests (undo window, card actions)
- **Domain Adapters** - 11 tests (transformations, golden equivalence)
- **LookupView** - 11 tests (content classification, language switching, translate reliability)
- Additional component + integration tests

**Test Philosophy:**
- Baseline tests document current behavior
- Tests lock in behavior before refactoring
- No test changes without intentional behavior changes

See `docs/verification/` for PR notes and verification details.

---

## Development

**Local dev server:** http://localhost:5173

**Mobile-First:** Test at 375px → 768px → 1024px

**TypeScript:** Strict mode, no `any` types

---

## Recent Updates

### January 10, 2026 (Evening) - UI Polish & Consistency

**Lessons UI Restructure:**
- ✅ **4 Content Type Categories** - Words, Phrases, Passages, Dialogs
  - Each category shows "View Saved" and "Create New" buttons
  - Saved lessons filtered by selected category
  - Back navigation from filtered view
- ✅ **Quick Topics Integration** - Moved into LessonGenerator modal
  - Topics appear below input field: Restaurant, Travel, Work, Family, Shopping
  - Clicking fills topic field (doesn't auto-generate)
- ✅ **Compact Saved Lessons** - Reduced spacing throughout
  - Smaller padding (p-3 → p-2)
  - Smaller fonts and icons
  - More lessons visible on screen

**UI Consistency Improvements:**
- ✅ **Example Sentences** - Now collapsible (default: collapsed)
  - Consistent teal color scheme matching Memory Aid, Context, Chat tiles
  - Larger font sizes: Egyptian 2xl, MSA xl, English/transliteration base
  - Applied across Lessons, Lookup, and My Vocabulary views
- ✅ **Letter Breakdown** - Fixed RTL layout
  - Letters now start from right side and wrap correctly
  - Proper right-to-left flow with `dir="rtl"` and `justify-start`
- ✅ **Dialogs Filter** - Added to My Vocabulary view
  - Now shows all 4 content types: Words, Sentences, Passages, Dialogs
  - Dialogs treated as multi-sentence content

### January 10, 2026 (Morning) - Enhanced Context Tiles & Interactive Learning

**Enhanced Learning Experience:**
- ✅ **Context Tile (💡)** - Comprehensive word/phrase analysis in both Lessons and Lookup
  - **Root Information** - Arabic trilateral root with meaning (e.g., ك-ت-ب = writing)
  - **Egyptian Usage** - How Egyptians use this in everyday conversation
  - **MSA Comparison** - How it differs from/relates to Modern Standard Arabic
  - **Cultural Notes** - Contextual and cultural information when relevant
  - Renamed from "Word Context" to just "Context" (applies to all content types)
  - Available in both ExerciseFeedback (Lessons) and LookupModal

- ✅ **Memory Aid Tile (🎨)** - Dedicated collapsible tile for learning aids
  - Extracted from inline display to standalone expandable component
  - Shows "(saved)" indicator when memory aid exists
  - Contains full MemoryAidEditor with DALL-E image generation + notes
  - Collapsible header to reduce visual clutter
  - Persists in component state during session
  - Available in both Lessons and Lookup

- ✅ **Chat Tile (💬)** - NEW interactive AI tutor feature
  - Ask questions about any word/phrase in real-time
  - Context-aware responses (knows the word, translation, and Egyptian usage)
  - Powered by GPT-4o-mini for fast, focused answers
  - Chat history persists during session (in component state)
  - Expandable/collapsible interface to save space
  - Suggestion prompts: "When do I use this?", "What's the difference from...?", "Can you give more examples?"
  - 2-3 sentence max responses for quick learning
  - Available in both Lessons and Lookup

**Feature Parity Achieved:**
- Both **Lessons** and **Lookup** now show identical rich context:
  - Word/phrase breakdown with pronunciations
  - Context tile (root, usage, MSA comparison, cultural notes)
  - Memory Aid tile (notes + AI images)
  - Chat tile (interactive Q&A)
  - Example sentences (MSA + Egyptian versions)
  - Letter breakdown (organized by word)
  - Hebrew cognates

**UX Improvements:**
- ✅ **Text dialect labels** - Replaced flag emojis (🇪🇬 📖) with clear text:
  - "Egyptian" for Egyptian Arabic pronunciation
  - "MSA" for Modern Standard Arabic pronunciation
  - Egyptian always shows first (primary), MSA as reference
  - More accessible and easier to understand

- ✅ **Letter breakdown improvements**:
  - Now organized by word (one word per line/row)
  - Shows full phrase as quizzed (no dropped words)
  - Uses `generateArabicBreakdownByWord()` for proper word-by-word splitting

**New Components:**
- `ChatTile.tsx` - Interactive Q&A component with OpenAI integration
- `MemoryAidTile.tsx` - Collapsible wrapper for memory aid editor
- `ContextTile.tsx` - Displays root/usage/cultural context information

**Technical Implementation:**
- Chat uses OpenAI's `gpt-4o-mini` model for cost-effective, fast responses
- System prompt provides context about the word/phrase being studied
- Chat history stored in component state (persists during session)
- All tiles use collapsible/expandable pattern to reduce visual clutter
- Memory aid state managed locally and synced with SaveDecisionPanel

### January 10, 2026 (Earlier) - Lesson Management & Smart Deduplication

**Lesson Management Features (Phase 1):**
- ✅ **Delete Lesson** - Remove unwanted lessons from library
  - Confirmation dialog before deletion
  - Preserves any words already saved to vocabulary
  - Automatically deletes associated vocabulary items from lesson
  - Refreshes lesson list after deletion
- ✅ **Edit Lesson** - Update lesson title and description
  - Modal dialog with editable fields
  - Title field (required), Description field (optional)
  - Updates lesson metadata in database
  - Refreshes lesson list after save
- ✅ **Regenerate Lesson** - Replace lesson vocabulary with new content
  - Confirmation dialog explaining regeneration
  - Clears existing vocabulary items
  - Preserves lesson metadata and practice progress
  - Note: Full AI regeneration coming in Phase 2
- ✅ **Action buttons** - Each lesson shows Edit/Regenerate/Delete buttons
  - Organized in a clean button row below lesson info
  - Color-coded (Delete is red, others neutral)
  - Icons for visual clarity

**Smart Lesson Deduplication:**

**Lesson Creation Flow (New):**
- ✅ **Duplicate detection** - System checks for similar existing lessons before creating
- ✅ **Smart matching** - Finds lessons with matching keywords in title (case-insensitive)
- ✅ **Resume existing lessons** - Click any similar lesson to resume practice
- ✅ **Auto-numbering** - New versions automatically numbered ("Room 2", "Room 3")
- ✅ **Success confirmation** - Clear feedback when lesson is created
- ✅ **Flexible actions** - Start exercise immediately or view all lessons

**How Lesson Creation Works:**
1. User enters topic (e.g., "Room")
2. System searches existing lessons with same language and content type
3. If similar lesson found → Show "Similar Lesson Found" dialog with:
   - List of existing lessons (clickable to resume)
   - "Create New Version (N)" button
   - Cancel option
4. If no similar lessons → Generate new lesson directly
5. AI generates vocabulary (excluding up to 100 already-saved words)
6. Lesson auto-saves to database with:
   - Title (with version number if duplicate)
   - Description, language, difficulty, content type
   - All vocabulary items linked to lesson
7. Success dialog shows:
   - Lesson title and item count
   - "Start Exercise" button
   - "View All Lessons" button

**Key Technical Details:**
- Similarity check: Case-insensitive keyword matching in titles
- Searches last 20 lessons of same language/content type
- Version numbering based on count of similar lessons
- Lessons save automatically (no manual save needed)
- Generated content stored for potential future features

**Database Operations:**
- Delete: `DELETE FROM lessons WHERE id = ?` (cascade deletes vocabulary_items)
- Edit: `UPDATE lessons SET title = ?, description = ? WHERE id = ?`
- Regenerate: `DELETE FROM vocabulary_items WHERE lesson_id = ?` (keeps lesson record)

**Component Changes:**
- `LessonLibrary.tsx`: Added lesson management state, handlers, and dialog UIs
- Each lesson card now shows action buttons instead of just click-to-start
- Three modal dialogs: Delete confirmation, Edit form, Regenerate confirmation

### January 9, 2026 - Lesson Library Redesign & UX Improvements

**Lesson Management:**
- ✅ **New Lesson Library page** - Complete redesign of lesson navigation
- ✅ Collapsible "Your Saved Lessons" section (default: collapsed)
- ✅ Fixed-height scrollable dropdown (max 320px) with internal scrolling
- ✅ Sticky header - can collapse from anywhere without scrolling back up
- ✅ Compact lesson list view (clickable titles instead of large cards)
- ✅ Chronological sorting (newest lessons first)
- ✅ Single-column content type selector (dropdown-style, not grid)
- ✅ Proper padding throughout (no edge-to-edge content)

**Lesson Creation:**
- ✅ **Egyptian dialect is now default** (was MSA)
- ✅ Dialect buttons reordered: Egyptian first, MSA second
- ✅ Dialect selector confirmed functional (passes to AI generation)

**Vocabulary Classification:**
- ✅ **Dynamic classification** based on actual text analysis
- ✅ Words: Single word only (wordCount === 1)
- ✅ Sentences: Multiple words, one sentence (wordCount > 1 && sentenceCount === 1)
- ✅ Passages: Multiple sentences (sentenceCount > 1)
- ✅ Classification uses word count (space-separated) and sentence detection (punctuation)
- ✅ Content saved from any lesson type is classified by its actual structure

**Word Context & Save UX:**
- ✅ **Word Context section** - Shows root, everyday Egyptian usage, and MSA comparison
- ✅ Root display with Arabic trilateral root and meaning
- ✅ Egyptian usage explanation (how word is used in daily conversation)
- ✅ MSA comparison (how MSA differs from Egyptian usage)
- ✅ Optional cultural notes for additional context
- ✅ Improved save experience for already-saved words
- ✅ Replaced toggle buttons with explicit "Save to Practice" and "Save to Archive"
- ✅ Users can now update image/note in place without moving between Practice/Archive
- ✅ Fixed loading spinner to only show on clicked save button (not both)
- ✅ Skip button in lookup now clears result and allows next lookup
- ✅ Removed non-functional Continue button from saved words view
- ✅ Translation consistency check to prevent mismatches with example sentences
- ✅ **Fixed word mismatch bug** - Exercise details now show same word as quiz prompt

### January 8, 2026 - Foundation Milestone
- ✅ Main menu reorganized (2x2 grid: Lessons + Lookup / My Saved Vocabulary)
- ✅ Content type filtering (Words/Sentences/Passages)
- ✅ Loading/success feedback on all save buttons
- ✅ Deprecated files archived to `src/_archive/`
- ✅ TypeScript config excludes archive from compilation
- ✅ Comprehensive ARCHITECTURE.md created

### January 7, 2026
- ✅ Egyptian Arabic display fixed (WordDisplay unified across app)
- ✅ Letter breakdown with vowels (generateArabicBreakdown)
- ✅ Memory aid persistence fixed
- ✅ Image display improved (object-contain)

---

## Known Limitations

- **No user auth** - Single-user app
- **No cross-device sync** - localStorage for preferences
- **Resume expires** - 24-hour limit on saved progress
- **Manual testing only** - No automated test suite yet

---

## Future Enhancements

- Spanish language expansion
- Audio pronunciation
- Offline mode with sync
- Automated testing
- Community features

---

## License

MIT

---

**For detailed technical documentation, see [ARCHITECTURE.md](./ARCHITECTURE.md)**
