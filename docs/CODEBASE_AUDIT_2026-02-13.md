# Codebase Audit - February 13, 2026

## Scope

Requested review goals:
- Verify current app health and setup readiness
- Check documentation accuracy against code
- Identify issues to fix
- Suggest UI/UX improvements
- Identify dead/unused code
- Recommend documentation to archive

Constraints respected:
- No application code changes made
- Documentation-only updates

## Verification Run (Current State)

Commands run:
- `npm run test:run`
- `npm run lint`
- `npm run build`

Results (at time of audit):
- Tests: **177/177 passing** (12 test files)
- Type check: **pass**
- Build: **pass**

Current state (February 15, 2026, post-PR #24):
- Tests: **166/166 passing** (11 test files — 16 tests removed with dead code in PR #9, 4 added in PRs #24, #32, #36)
- Type check: **pass**
- Build: **pass**

Notable warnings observed:
- React test `act(...)` warnings in `WordDetailModal` tests
- Node experimental CJS/ESM warnings in test/build output
- Bundle size warning: main chunk ~745 KB minified (`vite` warning threshold exceeded)

## Resolution Status (Updated February 15, 2026, post-PR #24)

All 12 original findings fully resolved. Sentence save hook also fixed (PR #28). Bundle size resolved by code splitting (PR #33). See deferred items at bottom (endpoint auth only).

| # | Issue | Priority | Status |
|---|-------|----------|--------|
| 1 | Spanish save flow inconsistency | P0 | ✅ RESOLVED (PR #1, #18, #19, #24) — Schema rebuilt, save path fixed for lookup + exercises |
| 2 | Migration/schema mismatch | P0 | ✅ RESOLVED (PR #1) — Full migration rewrite, all runtime tables now have matching migrations |
| 3 | Client-side OpenAI key exposure | P0 | ✅ RESOLVED (PRs #3–#7) — All OpenAI calls moved to Vercel serverless functions, browser client removed, all 6 endpoints verified on production |
| 4 | Passage counts wrong | P1 | ✅ RESOLVED (PR #1) — Field name aligned to match schema |
| 5 | SentenceSurface vs SentenceDisplay contract drift | P1 | ✅ RESOLVED (PR #1, #9) — Invariant updated, SentenceSurface archived as dead code |
| 6 | Spanish/Arabic field sharing | P1 | ✅ RESOLVED (PRs #1, #17–#19, #27, #28) — Word lookup fixed, passage pipeline fixed (PR #27), sentence save hook fixed (PR #28) |
| 7 | Dialect preference key inconsistency | P1 | ✅ RESOLVED (PR #1) — All views now use LanguageContext, no local storage keys |
| 8 | README test coverage contradictions | P2 | ✅ RESOLVED (PR #1, #8) — Contradictions removed, counts updated |
| 9 | Route documentation mismatch | P2 | ✅ RESOLVED (PR #1, #10) — Routes documented to match actual main.tsx |
| 10 | Missing setup instructions | P2 | ✅ RESOLVED (PR #1) — Setup section added to README |
| 11 | Documentation link integrity | P2 | ✅ RESOLVED (PR #1) — Broken links fixed or archived |
| 12 | Docs understate schema/quality | P2 | ✅ RESOLVED (PR #1) — Table counts and any-type claims corrected |

### P0 #3 Resolution Details (PRs #3–#7)
- **PR #3**: Moved all OpenAI calls to 6 Vercel serverless functions (`api/lookup`, `api/analyze-passage`, `api/generate-lesson`, `api/evaluate-answer`, `api/generate-image`, `api/chat`)
- **PR #4**: Removed browser-side OpenAI client (`dangerouslyAllowBrowser`, `VITE_OPENAI_API_KEY`), bundle reduced from ~745 KB to ~602 KB
- **PR #5**: Inlined OpenAI client + `withRetry` into each function (removed `api/_shared/`)
- **PR #6**: Created `api/_lib/` with self-contained utility modules, eliminated runtime `../src/` imports
- **PR #7**: Added `.js` extensions for ESM resolution under `"type": "module"`
- All 6 endpoints returning HTTP 200 on Vercel production (verified February 15, 2026)

### Dead Code Cleanup (PR #9)
- 16 files archived to `src/_archive/` preserving directory structure (2 of original 17 were already archived)
- `useCardStack.test.ts` also archived (tested dead code only)
- Test count: 177 → 161 (16 removed tests were for archived `useCardStack` hook)
- Build, lint, and all 161 tests passing after cleanup

## Priority Findings (Fix List)

### P0 - Critical

1. Spanish save flow is internally inconsistent and can save incorrect data
- Evidence:
  - `src/features/lookup/LookupView.tsx:154` saves `word: result.arabic_word` and `translation: result.translation` for all languages.
  - `src/lib/openai.ts:559` returns Spanish payload as `spanish_latam` / `translation_en` (not guaranteed `arabic_word` / `translation`).
  - `src/hooks/useSavedWords.ts:165` hardcodes inserted `language: 'arabic'`.
  - `src/hooks/useSavedWords.ts:127` deduplicates by `word` only (no language scoping).
  - `supabase/migrations/20260105_saved_words.sql:41` has `UNIQUE(word)` (cross-language collision risk).
- Impact:
  - Spanish saves can fail silently, save empty/wrong fields, or be stored under Arabic language.

2. Migration set does not match runtime tables/enum usage
- Evidence:
  - Runtime queries use `saved_sentences`, `saved_passages`, and `saved_dialogs`:
    - `src/hooks/useSavedSentences.ts:57`
    - `src/hooks/useSavedPassages.ts:54`
    - `src/features/vocabulary/VocabularyLanding.tsx:62`
  - Migrations create only `saved_words` and `word_contexts`:
    - `supabase/migrations/20260105_saved_words.sql:8`
    - `supabase/migrations/20260105_saved_words.sql:45`
  - Migration alters missing tables:
    - `supabase/migrations/007_memory_aids.sql:10`
    - `supabase/migrations/007_memory_aids.sql:14`
  - Status enum mismatch:
    - migration `needs_review|solid|retired` at `supabase/migrations/20260105_saved_words.sql:29`
    - app queries `active|learned` at `src/hooks/useSavedWords.ts:37`
- Impact:
  - Fresh environment setup can fail or produce schema/runtime drift.

3. Client-side OpenAI key exposure remains in active path
- Evidence:
  - `src/lib/openai.ts:7` initializes client with `dangerouslyAllowBrowser: true`
  - `src/lib/openai.ts:9` uses `VITE_OPENAI_API_KEY` in frontend
  - `src/components/ChatTile.tsx:34` directly calls OpenAI from browser
- Impact:
  - Key leakage and uncontrolled API cost risk.

### P1 - High

4. Passage counts in vocabulary landing are wrong for active schema
- Evidence:
  - `src/features/vocabulary/VocabularyLanding.tsx:77` filters `saved_passages` on `language`
  - Passage model uses `source_language`: `src/hooks/useSavedPassages.ts:10`, `src/hooks/useSavedPassages.ts:60`
- Impact:
  - Inaccurate counts and UX confusion in Vocabulary Landing.

5. Architectural invariant says `SentenceSurface` is canonical, but app renders `SentenceDisplay`
- Evidence:
  - Invariant docs:
    - `README.md:16`
    - `src/components/surfaces/SentenceSurface.tsx:2`
  - Actual rendering uses `SentenceDisplay`:
    - `src/features/sentences/MySentencesView.tsx:6`
    - `src/features/sentences/MySentencesView.tsx:182`
    - `src/features/sentences/MySentencesView.tsx:247`
  - No active imports of `SentenceSurface` outside barrel/export.
- Impact:
  - Contract drift and duplicate renderer maintenance risk.

6. Spanish contract still relies on Arabic fallback fields in multiple paths
- Evidence:
  - Invariant says no Arabic field sharing for Spanish: `README.md:19`
  - Fallback/overload in code:
    - `src/lib/openai.ts:380` comment explicitly overloads `arabic_word` for Spanish
    - `src/features/lookup/LookupView.tsx:186` comment: Spanish stored in `.arabic` temporarily
    - `src/features/lookup/LookupView.tsx:317` Spanish UI falls back to `result.arabic_word`
- Impact:
  - Higher chance of regressions and type confusion bugs.

7. Dialect preference storage keys are inconsistent
- Evidence:
  - Canonical context key: `src/contexts/LanguageContext.tsx:44` (`language-app-dialect-preferences`)
  - Separate key in feature views:
    - `src/features/lookup/LookupView.tsx:18`
    - `src/features/sentences/MySentencesView.tsx:9`
    - `src/features/passages/MyPassagesView.tsx:12`
- Impact:
  - Split state, non-deterministic dialect behavior across screens.

### P2 - Medium

8. README and docs contain conflicting statements about test coverage and readiness
- Evidence:
  - README claims test suite exists: `README.md:150`
  - README also claims no automated test suite: `README.md:399`
  - README future enhancement says "Automated testing": `README.md:408`
  - Docs still report 46 tests:
    - `docs/START_HERE.md:61`
    - `docs/comprehensive-analysis-2026-01-13/START_HERE.md:61`
- Impact:
  - New contributor confusion and low confidence in docs.

9. Route documentation is not aligned with actual routing
- Evidence:
  - README route guidance says `/words` is canonical and `/words?type=...`: `README.md:128`, `README.md:132`
  - Actual routes:
    - `src/main.tsx:28` (`/vocabulary` landing)
    - `src/main.tsx:29` (`/vocabulary/word`)
    - `src/main.tsx:30` (`/vocabulary/sentence`)
    - `src/main.tsx:32` (`/vocabulary/passage`)
    - `src/main.tsx:33` (`/words` marked legacy)
- Impact:
  - Documentation-led navigation errors.

10. Missing essential setup instructions in README
- Evidence:
  - No install/env/bootstrap section in `README.md`
  - Environment requirements exist in code and `.env.example`:
    - `src/lib/supabase.ts:3`
    - `src/lib/openai.ts:9`
    - `.env.example`
- Impact:
  - Harder onboarding and setup mistakes.

11. Documentation link integrity issues
- Evidence:
  - `docs/DOCUMENTATION_INDEX.md:25` references missing `architecture/ADR-001-domain-layer.md`
  - `docs/comprehensive-analysis-2026-01-13/DOCUMENTATION_INDEX.md:17` broken relative link to README
- Impact:
  - Broken navigation in docs.

12. Documentation understates current data model and code quality constraints
- Evidence:
  - Docs claim 5 active tables: `docs/DOCUMENTATION_INDEX.md:102`
  - Active code queries additional tables (`saved_sentences`, `saved_passages`, `saved_dialogs`):
    - `src/hooks/useSavedSentences.ts:57`
    - `src/hooks/useSavedPassages.ts:54`
    - `src/features/vocabulary/VocabularyLanding.tsx:62`
  - README says no `any` usage: `README.md:174`
  - Active code still uses many `any` types (example: `src/features/lookup/LookupView.tsx:40`, `src/lib/openai.ts:582`)
- Impact:
  - Documentation gives an inaccurate picture of real schema/runtime behavior and typing standards.

## Dead/Unused Code Candidates — ✅ RESOLVED (PR #9)

Method used:
- Static import-graph walk from `src/main.tsx`
- Follow-up grep verification per file

All 16 files archived to `src/_archive/` (preserving directory structure):
- `src/_archive/components/ActionButtons.tsx`
- `src/_archive/components/BottomNav.tsx`
- `src/_archive/components/Card.tsx`
- `src/_archive/components/CardStack.tsx`
- `src/_archive/components/LessonCard.tsx`
- `src/_archive/components/SwipeIndicator.tsx`
- `src/_archive/components/modals/SentenceDetailModal.test.tsx.backup`
- `src/_archive/features/lessons/LessonFeed.tsx`
- `src/_archive/hooks/useCardStack.ts`
- `src/_archive/hooks/useCardStack.test.ts`
- `src/_archive/hooks/useSavedVocabulary.ts`
- `src/_archive/lib/testSupabase.ts`
- `src/_archive/styles/uiTokens.ts`
- `src/_archive/utils/arabicBreakdown.ts`
- `src/_archive/utils/egyptianInference.ts`
- `src/_archive/utils/soundAlikeWords.ts`

Previously archived (not found at original paths during cleanup):
- `src/components/surfaces/SentenceSurface.tsx`
- `src/components/surfaces/index.ts`

## UI/UX Improvement Suggestions

1. Simplify navigation IA
- Consolidate route intent (`/vocabulary`, `/words`, `/saved`) to one canonical path family.

2. Replace native `alert/confirm` with in-app dialogs/toasts
- Current usage in lesson/sentence/passage flows is visually inconsistent and blocks interaction.

3. Improve error messaging
- `LookupView` currently surfaces internal error strings (e.g., "See console for details"), which is developer-oriented.

4. Remove emoji-only language signaling in critical controls
- Keep textual labels primary for accessibility and clarity.

5. Fix passage/sentence count reliability before further UX polish
- Incorrect counts undermine user trust in saved-content views.

6. Add explicit "Saved" feedback for Spanish word flow after schema/save fixes
- Current feedback can appear successful while data path is inconsistent.

## Documentation To Archive or Consolidate

1. Consolidate duplicate comprehensive docs
- Exact duplicates exist in both:
  - `docs/*.md`
  - `docs/comprehensive-analysis-2026-01-13/*.md`
- Keep one canonical set; archive the other.

2. Move one-off milestone notes into archive
- Example candidates: `docs/P0-1_COMPLETE.md`, `docs/PHASE_C_IMPLEMENTATION_SUMMARY.md`, older validation snapshots.
- Keep them, but relocate under `docs/_archive_md/` to reduce top-level noise.

3. Repair or archive docs with broken links
- Fix broken links or archive docs not maintained (especially stale index files).

## Recommended Execution Order

1. ~~Schema + save-path correctness (P0)~~ ✅ Done (PR #1)
2. ~~Security hardening (P0)~~ ✅ Done (PRs #3–#7)
3. ~~Route and renderer contract alignment (P1)~~ ✅ Done (PR #1)
4. ~~Documentation normalization (P2)~~ ✅ Done (PR #1, #2)
5. ~~Dead code cleanup (P2/P3)~~ ✅ Done (PR #9)

## Notes

- Original audit performed February 13, 2026 (documentation only, no code changes).
- Resolution work began February 13, 2026. PR #1 merged with 4 commits resolving 11 of 12 issues.
- Security hardening completed February 15, 2026. PRs #3–#7 moved OpenAI to serverless, removed browser client, fixed ESM resolution. All 6 API endpoints verified working on Vercel production.
- Dead code cleanup completed February 15, 2026. PR #9 archived 16 files to `src/_archive/`. Tests: 161/161 passing.
- Type system migration completed February 15, 2026. PRs #17–#22 introduced `LookupWordResult` union type, type guards, narrow-once pattern across LookupView, WordDetailModal, LookupModal, ExerciseFeedback. Tests: 162/162 passing.
- Spanish exercise save completed February 15, 2026. PR #24 enabled save controls and language-branched payloads in ExerciseFeedback + ExerciseView. Tests: 162/162 passing.
- Cross-language DB collision fix completed February 15, 2026. PR #26 scoped UNIQUE constraint and hook lookups by language.
- Passage pipeline field overloading fix completed February 15, 2026. PR #27 stores Spanish passage data in language-neutral fields.
- Sentence save hook fix completed February 15, 2026. PR #28 added mapping layer to useSavedSentences: language-neutral interface → DB column mapping.
- Error boundary + status drift fix completed February 15, 2026. PR #29 added ErrorBoundary component and added 'retired' to WordStatus type. Tests: 162/162 passing.
- Exercise resume fix completed February 15, 2026. PR #36 persists exercise phase in progress data; reload during feedback resumes correctly. Tests: 166/166 passing.
- Passage filtering fix completed February 15, 2026. PR #37 added `language` column to `saved_passages`; filters use target language instead of source language.
- All audit issues fully resolved as of February 15, 2026.
- MainMenu unified layout completed February 16, 2026. PR #39 removed phase gate, exported LANGUAGE_STORAGE_KEY, added consistent error handling. PR #40 added row spacing.

## Remediation Progress (Updated: February 15, 2026)

### Resolved Issues

| Issue | PR | What Changed |
|-------|-----|-------------|
| P0-1: Spanish save flow inconsistent | #18, #19 | SpanishLookupResult type created, LookupView migrated to LookupWordResult union, all saves pass language explicitly |
| P0-3: Client-side OpenAI key | #14 | API calls moved to serverless functions |
| P1-1: Spanish type safety (as any casts) | #19 | All 17 as-any casts eliminated from LookupView |
| P1-4: Sentence/passage save errors | #14, #18 | Toast feedback added, language parameter added to hooks |
| P1-5 (new): Word deletion no confirmation | #20 | ConfirmDialog added to MyVocabularyView |
| P1-6 (new): RouteGuard redirects deep links | #20 | Redirect logic removed, deep links work |
| P1-7 (new): No 404 route | #20 | NotFound component + catch-all route |
| P1-8 (new): Dialect toggle shows in Spanish | #20 | Conditional on language === 'arabic' |
| P1-9: LanguageBadge/LanguageSwitcher overlap | #21 | LanguageBadge hides on routes with LanguageSwitcher |
| P1-12: English-source passages wrong language | #21 | Fallback changed from 'arabic' to context language |
| P1-14 (new): Lesson library custom dialogs | #20 | Delete dialog migrated to ConfirmDialog |
| P1-15: Console.log in production | #21 | 42 debug console.log removed from 9 files |
| P1-16: Modal close buttons < 48px | #21 | 5 modals updated to min-w/h-[48px] |
| New-1: useSavedWords defaults to Arabic | #18 | Hook accepts language parameter |
| New-3: WordDetailModal spanish_word bug | #22 | Migrated to LookupWordResult with type guards |
| Deferred: lookupWord return type | #22 | Changed to LookupWordResult, all consumers updated |
| P2-8: README contradictions | #14 | README updated |
| Dead code cleanup | #15 | 16 files removed |
| CLAUDE.md inaccuracies | #17 | 3 claims corrected |
| LookupModal Arabic-only | #22 | Full Spanish support added |
| WordDetailModal Arabic-only | #22 | Full Spanish support with type guards |
| P1-3: Spanish exercise save | #24 | ExerciseFeedback + ExerciseView: save panel and payload for both Arabic and Spanish |
| Cross-language DB collision | #26 | `saved_words` UNIQUE constraint scoped by language, hook lookups scoped by language |
| Passage pipeline field overloading | #27 | `api/analyze-passage.ts` stores Spanish in language-neutral fields, not Arabic-named |
| Sentence save hook field overloading | #28 | `useSavedSentences` mapping layer: neutral interface → DB columns |
| Error boundary | #29 | `ErrorBoundary` class component wraps app in `main.tsx` |
| WordStatus type drift | #29 | `WordStatus` type includes `'retired'` matching DB CHECK constraint |
| Bundle size / code splitting | #33 | Route-level React.lazy splitting. Initial chunk 609 kB → 239 kB (-61%) |
| Exercise resume feedback duplication | #36 | Phase persisted in exercise progress; reload during feedback resumes correctly |
| Passage source language filtering | #37 | Added `language` column to `saved_passages`; filters use target language |

### Deferred Items (Not Fixing)

| Issue | Priority | Notes |
|-------|----------|-------|
| Serverless endpoints unauthenticated | Deferred | Single-user app, accepted risk |
