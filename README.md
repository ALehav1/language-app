# Language Learning App

**AI-powered Arabic and Spanish language learning**

Production: https://language-m6q3yz1z4-alehav1s-projects.vercel.app

---

## What This App Does

Look up words, sentences, and passages in Arabic (Egyptian dialect) or Spanish and get AI-generated breakdowns with pronunciation, cultural context, and memory aids. Save vocabulary, create themed lessons, and practice through interactive exercises.

## Tech Stack

- **Frontend:** React 19.2.3, React Router 7.11.0, TypeScript 5.9.3 (strict mode)
- **Build:** Vite 7.3.0, ESM (`"type": "module"`)
- **Styling:** TailwindCSS 3.4.19, PostCSS 8.5.6
- **Backend:** Supabase 2.89.0 (database + auth)
- **AI:** OpenAI 6.15.0 (via serverless functions only)
- **Testing:** Vitest 4.0.16, Testing Library (React 16.3.1, User Event 14.6.1), Happy-DOM 20.1.0
- **Deployment:** Vercel with @vercel/node 5.6.3

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- Supabase project (for database)
- OpenAI API key

### Setup

```bash
git clone https://github.com/ALehav1/language-app.git
cd language-app
npm install
cp .env.example .env
# Fill in environment variables (see below)
npm run dev
```

Dev server runs at http://localhost:5173

### Environment Variables

| Variable | Where Used | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | Client (browser) | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Client (browser) | Supabase anonymous/public key |
| `OPENAI_API_KEY` | Server (API functions) | OpenAI API key — never exposed to browser |

## Architecture

### Architectural Invariants

1. **WordSurface is the ONLY word renderer** (`src/components/surfaces/WordSurface.tsx`) — delegates to `WordDisplay` (Arabic) and `SpanishWordBody` (Spanish) internally
2. **SentenceDisplay is the sentence renderer** (`src/components/SentenceDisplay.tsx`)
3. **Sentence = one tile, words = chips** — single words are compact, never full-width
4. **LanguageSwitcher controls language** — `LanguageBadge` is display-only
5. **LanguageContext is the single source of truth** for language and dialect preferences
6. **Spanish and Arabic SHOULD NOT share field names** — enforced across all paths. Word lookup, passage pipeline, and sentence save all use language-neutral or properly-mapped fields.
7. **All API calls go through serverless functions in `api/`** — never expose API keys client-side

### Project Structure

```
src/
  components/     # Shared UI components (WordSurface, SentenceDisplay, ConfirmDialog, etc.)
  contexts/       # React contexts (LanguageContext, ToastContext)
  features/       # Feature modules (lookup, vocabulary, lessons, exercises, etc.)
  hooks/          # Custom hooks (useSavedWords, useExercise, etc.)
  lib/            # Client libraries (supabase, openai client wrappers)
  domain/         # Domain logic (practice adapters, Hebrew cognates)
  types/          # TypeScript type definitions
  styles/         # UI tokens and shared styles
  _archive/       # Dead code (excluded from tsconfig compilation)
api/
  _lib/           # Shared serverless utilities (dictionary, cognates, tokenization)
  lookup.ts       # Word lookup with AI breakdown
  analyze-passage.ts  # Sentence/passage analysis
  chat.ts         # Chat completion
  evaluate-answer.ts  # Exercise answer evaluation
  generate-image.ts   # Memory aid image generation (DALL-E)
  generate-lesson.ts  # Lesson content generation
```

### Canonical Routes

| Route | Component | Notes |
|---|---|---|
| `/` | MainMenu | Home screen |
| `/lookup` | LookupView | Word/sentence/passage lookup |
| `/vocabulary` | VocabularyLanding | Vocabulary hub |
| `/vocabulary/word` | MyVocabularyView | Saved words list |
| `/vocabulary/sentence` | MySentencesView | Saved sentences |
| `/vocabulary/dialog` | MySentencesView | Dialog sentences |
| `/vocabulary/passage` | MyPassagesView | Saved passages |
| `/lessons` | LessonLibrary | Lesson list |
| `/exercise/:lessonId` | ExerciseView | Exercise session |

Legacy routes (`/words`, `/saved`, `/sentences`, `/passages`) redirect to their canonical equivalents via `<Navigate replace>`.

## Testing

```bash
npm test              # Watch mode
npm run test:run      # Single run
npm run lint          # TypeScript type checking
npm run build         # Production build
```

Current: 162/162 tests passing (11 test files)

## Development Notes

### Key Patterns

- Mobile-first (test 375px first, then 768px, then 1024px)
- TypeScript strict mode — no `any` types (aspirational; see known limitations)
- 48px minimum touch targets
- Loading states required for all async operations
- `ConfirmDialog` for destructive action confirmations, `useToast()` for feedback
- Native `alert()` and `confirm()` are banned
- ESM: all local imports in `api/` must use `.js` extensions

### Known Limitations

- **Single-user, no auth** — localStorage for preferences, no cross-device sync
- **~15 `as any` casts remain** — mostly in Supabase column mapping (`useVocabulary.ts`) and `MyVocabularyView.tsx`. Not adding new ones.
- **Exercise progress expires** — 24-hour limit on saved progress in localStorage
- **Regenerate lesson** — button is disabled (coming soon). Previously deleted content without regenerating.

## Recent Updates (February 2026)

- **PR #26:** Fixed cross-language DB collision — `saved_words` UNIQUE constraint and hook lookups scoped by language
- **PR #27:** Fixed passage pipeline field overloading — Spanish data stored in language-neutral fields
- **PR #28:** Fixed sentence save hook — mapping layer for language-neutral interface to DB columns
- **PR #29:** Added app-level error boundary + fixed `WordStatus` type to include `'retired'`
- **PR #33:** Route-level code splitting — initial bundle 609 kB → 239 kB (-61%)
- All original audit issues now resolved (see audit doc for full history)

## Documentation

- `CLAUDE.md` — Agent context (primary reference for AI-assisted development)
- `docs/CODEBASE_AUDIT_2026-02-13.md` — February 2026 comprehensive audit (all issues resolved)
- `docs/COMPREHENSIVE_ARCHITECTURE.md` — System architecture reference
- `docs/DATA_ARCHITECTURE.md` — Database schema and state management
- `docs/USER_FLOWS.md` — User journey maps
- `ARCHITECTURE.md` — Architecture overview (January 2026)

## License

MIT
