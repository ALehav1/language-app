# Language Learning App — Agent Context

## What This Project Does
AI-powered language learning app focused on Egyptian Arabic dialect, with Spanish language support. Users can look up words/phrases, get AI-generated breakdowns with pronunciation and cultural context, save vocabulary, and practice through exercises. Deployed on Vercel with serverless API functions.

## Document Priority
When instructions conflict, resolve in this order:
1. This CLAUDE.md (project-specific rules)
2. Inline code comments
Higher-priority documents override lower ones. If you encounter a conflict, follow the higher-priority source and note the conflict in the verification transcript.

## Tech Stack
- **Frontend:** React 19.2.3, React Router 7.11.0, TypeScript 5.9.3 (strict mode)
- **Build:** Vite 7.3.0, ESM (`"type": "module"`)
- **Styling:** TailwindCSS 3.4.19, PostCSS 8.5.6
- **Backend:** Supabase 2.89.0 (database + auth)
- **AI:** OpenAI 6.15.0 (via serverless functions only)
- **Testing:** Vitest 4.0.16, Testing Library (React 16.3.1, User Event 14.6.1), Happy-DOM 20.1.0
- **Deployment:** Vercel with @vercel/node 5.6.3

## Architectural Invariants (Do Not Violate)

1. **WordSurface is the ONLY word renderer** (`src/components/surfaces/WordSurface.tsx`)
   - Delegates internally to `WordDisplay` (Arabic) and `SpanishWordBody` (Spanish)
   - All call sites import `WordSurface`. Never import `WordDisplay` or `SpanishWordBody` directly for rendering.

2. **SentenceDisplay is the sentence renderer** (`src/components/SentenceDisplay.tsx`)
   - `SentenceSurface` was archived as dead code — it does not exist in active code.

3. **Sentence = one tile, words = chips** — Single words are compact, never full-width.

4. **LanguageSwitcher controls language** (`src/components/LanguageSwitcher.tsx`)
   - Used on first-level screens (Lookup, Vocabulary Landing, Lesson Library)
   - **LanguageBadge** (`src/components/LanguageBadge.tsx`) is display-only (`pointer-events-none`), shown globally via `main.tsx`

5. **LanguageContext is the single source of truth** (`src/contexts/LanguageContext.tsx`) for language and dialect preferences.

6. **Spanish and Arabic SHOULD NOT share field names** — enforced across all paths. Word lookup (PR #19), passage pipeline (PR #27), and sentence save hook (PR #28) all use language-neutral or properly-mapped fields. `openai.ts` LookupResult interface still uses Arabic field names internally but consumers access via typed union (`LookupWordResult`). Do not add new shared field usage.

7. **All API calls go through serverless functions in `api/`** — Never expose API keys client-side.

## Canonical Routes

Defined in `src/main.tsx:25-37`:

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

**Legacy routes** (`/words`, `/saved`, `/sentences`, `/passages`) redirect to their canonical equivalents. Do not create new legacy routes.

## Forced Reading Rules
IMPORTANT: Prefer retrieval-led reasoning over pre-training-led reasoning.
- Before working on lookup features: read `src/features/lookup/LookupView.tsx`
- Before working on vocabulary: read `src/features/vocabulary/VocabularyLanding.tsx`
- Before working on exercises: read `src/features/lessons/` and `src/features/exercises/`
- Before working on word display: read `src/components/surfaces/WordSurface.tsx`
- Before working on sentence display: read `src/components/SentenceDisplay.tsx`
- Before working on saved words: read `src/hooks/useSavedWords.ts`
- Before working on API functions: read the relevant `api/*.ts` file and `api/_lib/`
- Before replacing any alert/confirm: use `ConfirmDialog` from `src/components/ConfirmDialog.tsx` or `useToast()` from `src/contexts/ToastContext.tsx`

## Constraints
- Mobile-first (test 375px first, then 768px, then 1024px)
- TypeScript strict mode enabled. Goal: no `any` types. Current reality: ~15 `as any` casts remain, mostly in Supabase column mapping (useVocabulary.ts) and MyVocabularyView.tsx. Do not add new `any` casts. When touching files with existing casts, prefer fixing them if scope allows.
- 48px minimum touch targets
- Loading states required for all async operations
- All API calls go through serverless functions in api/ — never expose API keys client-side

## Dev Tools Policy
Single-user project: `if (import.meta.env.DEV)` is sufficient for dev-only UI.

## Serverless API Functions

All in `api/`, each self-contained with its own OpenAI client:

| Function | Purpose |
|---|---|
| `api/lookup.ts` | Word lookup with AI breakdown |
| `api/analyze-passage.ts` | Sentence/passage analysis |
| `api/chat.ts` | Chat completion |
| `api/evaluate-answer.ts` | Exercise answer evaluation |
| `api/generate-image.ts` | Memory aid image generation |
| `api/generate-lesson.ts` | Lesson content generation |

Shared utilities in `api/_lib/`:
- `egyptianDictionary.ts` — Egyptian Arabic dictionary data
- `hebrewCognates.ts` — Hebrew cognate matching
- `shouldShowHebrewCognate.ts` — Cognate display logic
- `tokenizeWords.ts` — Word tokenization

**ESM gotcha:** All local imports in `api/` must use `.js` extensions (e.g., `import { foo } from './_lib/bar.js'`). See memory note on Vercel serverless ESM.

## Common Gotchas

### `as any` type casts throughout the codebase
The "no `any` types" constraint is aspirational. Remaining `as any` hotspots:
- `src/features/vocabulary/MyVocabularyView.tsx` — casts at lines 170–171 for Spanish lookup data
- `src/hooks/useVocabulary.ts` — 10 casts (lines 59-66, 105-112) for Supabase column mapping
- `src/components/WordDisplay.tsx` — letter breakdown typing (lines 307, 309)

Eliminated hotspots: LookupView.tsx (PR #19), WordDetailModal.tsx (PR #22), LookupModal.tsx (PR #22).

### `_archive/` directory
Dead code lives in `src/_archive/`. It is excluded from `tsconfig.json` compilation (`"exclude": ["src/_archive"]`) but still on disk. Do not import from it.

## Hard-Won Patterns

### Dialog and Toast System (PR #12)
- **ConfirmDialog** (`src/components/ConfirmDialog.tsx`): Styled modal for destructive action confirmations. Props: isOpen, title, message, confirmLabel, cancelLabel, variant ('danger' | 'default'), onConfirm, onCancel.
- **Toast system** (`src/contexts/ToastContext.tsx`): App-wide toast notifications via `useToast()` hook. Usage: `showToast({ type: 'success' | 'error' | 'info', message: '...' })`. ToastProvider wraps the app in main.tsx.
- Native `alert()` and `confirm()` are banned. All 6 original calls have been replaced. Any new user feedback should use these components.

### DB Column Mapping Layer (PR #28)
- When DB columns have legacy names (e.g., `arabic_text` storing Spanish data), use a mapping layer in the hook rather than renaming the DB column.
- Hook exports a clean interface (`SentenceData`, `SaveSentenceInput`) with neutral field names (`primary_text`, `alt_text`).
- Internal `DbSentenceRow` type (not exported) represents raw DB shape. `fromDbRow()` maps DB → clean type on reads. Write path maps clean → DB column names.
- Consumers never see DB column names. This avoids schema migration while giving callers a clean API.

### Union Type Narrowing (PR #19, #20)
- **Narrow-once pattern**: Derive `const spanish = result && isSpanish(result) ? result : null` at top of component, use throughout. Avoids scattered type guards.
- **Prefer optional chaining with fallbacks** (`arabic?.field ?? ''`) over non-null assertions (`arabic!.field`). Non-null assertions crash if the value is unexpectedly null; optional chaining degrades gracefully.

### Route-Level Code Splitting (PR #33)
- All route components in `main.tsx` use `React.lazy` with `Suspense`. Named exports need the `.then(m => ({ default: m.ComponentName }))` pattern.
- `Suspense` sits inside `ErrorBoundary` so chunk load failures are caught. Dark-themed fallback prevents white flash.
- Initial chunk: 239 kB (down from 609 kB). Vite auto-splits shared deps (supabase, WordSurface, etc.) into separate chunks.
- When adding new routes, use the same `lazy(() => import(...).then(...))` pattern. Keep providers, ErrorBoundary, RouteGuard, and LanguageBadge as static imports.

### Comprehensive Audit Findings (PR #14 audit, all resolved as of PR #29)
- 2 P0, 16 P1, 18 P2 issues identified. Full report in `docs/CODEBASE_AUDIT_2026-02-13.md`.
- All 12 original findings fully resolved. Sentence save hook also fixed (PR #28).
- Deferred items (not fixing): serverless endpoints unauthenticated (single-user app).

### vi.mock and Type Guards (PR #22)
- `vi.mock('../../lib/openai')` auto-mocks ALL exports, including type guard functions like `isArabicLookupResult`. Tests must provide explicit mock implementations that replicate the guard logic:
  ```ts
  vi.mocked(openai.isArabicLookupResult).mockImplementation(
    (r: openai.LookupWordResult) => 'arabic_word' in r
  );
  ```

## Regression Traps

- **Native alert/confirm reintroduced** — Symptom: browser-native dialog appears instead of styled in-app component. Verify: `grep -rn "alert(\|confirm(" src/ --include="*.tsx" --include="*.ts" | grep -v "_archive" | grep -v ".test."` should return 0 results (except JSDoc comments in ConfirmDialog.tsx).
- **Regenerate button re-enabled without implementation** — Symptom: clicking Regenerate deletes lesson vocabulary but produces no new content. Verify: check that regenerate is disabled or that the full generate→save→navigate flow is implemented before enabling.
- **Legacy route references in app code** — Symptom: app navigates to /words, /saved, /sentences, or /passages instead of canonical /vocabulary/* routes. Verify: `grep -rn '"/words"\|"/saved"\|"/sentences"\|"/passages"' src/ --include="*.tsx" --include="*.ts" | grep -v "_archive" | grep -v ".test." | grep -v "main.tsx"` should return 0 results.
- **Word deletion confirmation** — MyVocabularyView must use ConfirmDialog for all delete paths. Do not add direct `deleteWord()` calls without confirmation.
- **RouteGuard deep links** — RouteGuard must not redirect valid routes to home on fresh load. Deep links (bookmarked URLs) must work directly.
- **LanguageBadge route hiding** — LanguageBadge returns `null` on `/lookup`, `/lessons`, `/vocabulary` where LanguageSwitcher is present. If adding LanguageSwitcher to new routes, add the route to `ROUTES_WITH_SWITCHER` in `LanguageBadge.tsx`.
- **Console.log cleanup** — No debug `console.log` in production `src/`. `console.warn` and `console.error` are fine. When removing `console.log` inside `useEffect`, check if the `useEffect` import becomes unused.
- **WordDetailModal type guards in tests** — `vi.mock` auto-mocks type guard functions. Tests must provide explicit mock implementations for `isArabicLookupResult` and `isSpanishLookupResult`.
- **lookupWord return type** — `lookupWord` returns `LookupWordResult` (union), not `LookupResult`. All consumers must handle both Spanish and Arabic shapes via narrow-once pattern.
- **Spanish exercise save** — ExerciseFeedback and ExerciseView must show save controls and handle save payloads for both Arabic and Spanish. Do not gate save functionality to a single language.
- **Sentence save language parameter** — `useSavedSentences.saveSentence()` requires `language` in its input. The hook maps neutral field names (`primary_text`, `alt_text`) to DB columns (`arabic_text`, `arabic_egyptian`). Do not pass Arabic-named fields to the hook's public interface.
- **Word save language scoping** — `useSavedWords` duplicate checks and lookups must include `.eq('language', ...)`. Cross-language collision was a real bug (PR #26).
- **WordStatus type completeness** — `WordStatus` must include `'retired'` to match the DB CHECK constraint. Any `Record<WordStatus, ...>` must handle all three values.
- **Saved-word language scoping (all paths)** — All `useSavedWords()` callers must pass `language`. All `saveWord` callers must include `language` in the payload. All `isWordSaved`/`getSavedWord` callers must pass `language`. The hook's fallback to `'arabic'` exists for backward compatibility but produces wrong data for Spanish. PR #26 fixed write-path, PR #31 fixed read-path, PR #32 fixed SentenceDetailModal. No unscoped callers should remain.
- **Exercise phase must be persisted in progress** — `saveProgress()` must include `phase`. Reload during feedback must resume in feedback, not prompting. Duplicate submit is blocked by the existing `phase !== 'prompting'` guard in `submitAnswer`. Old saved progress without `phase` defaults to `'prompting'` (backward compat).
- **Passage listing filters by target language, not source language** — `saved_passages` has both `source_language` (what language the input text was) and `language` (what mode the user was learning in). Listing and counting must filter on `language`. English-source passages analyzed in Spanish mode must appear in Spanish view. PR #37 added the `language` column.


## Stable Files

- `src/lib/openai.ts` — verified (PR #22, types and guards)
- `src/lib/api.ts` — verified (PR #22, return type)
- `src/features/lookup/LookupView.tsx` — verified (PR #19, Spanish type migration)
- `src/components/modals/WordDetailModal.tsx` — verified (PR #22, Spanish support)
- `src/features/vocabulary/LookupModal.tsx` — verified (PR #22, Spanish support)
- `src/components/RouteGuard.tsx` — verified (PR #20, passthrough)
- `src/components/LanguageBadge.tsx` — verified (PR #21, route-aware hiding)
- `src/features/exercises/ExerciseFeedback.tsx` — verified (PR #24, Spanish exercise save)
- `src/features/exercises/ExerciseView.tsx` — verified (PR #24, language-branched save)
- `src/components/ErrorBoundary.tsx` — verified (PR #29, app-level error boundary)
- `src/hooks/useSavedSentences.ts` — verified (PR #28, mapping layer for language-neutral interface)
- `src/hooks/useSavedWords.ts` — verified (PR #26, language-scoped lookups)
- `src/components/WordBreakdownList.tsx` — verified (PR #27, extracted from passage pipeline)

## Running State
`docs/WORKING.md` does not exist by default. Create it when starting multi-session work, and clean it up when done. When active, it should contain:
- Current task and status
- What was just completed
- Next steps remaining
- Any blockers or open questions
This file is the first thing to read when resuming after a session break.

## After Feature Completion
- Clear or archive docs/WORKING.md (if it was created)
- Write learnings to docs/[feature].md
- If pattern is reusable across projects, note it at the top with: "CROSS-PROJECT: [what pattern, why it's reusable]"
- Run verification checklist
