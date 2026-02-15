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

6. **Spanish and Arabic NEVER share field names** — No `arabic_word` for Spanish data.

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
- TypeScript strict mode — no `any` types
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
The "no `any` types" constraint is aspirational. Current `as any` hotspots:
- `src/features/lookup/LookupView.tsx` — 15+ casts for Spanish result fields (lines 47, 149-151, 313-320, 342, 348-349, 412-413). Root cause: `result` is typed as the Arabic lookup response; Spanish response has different fields but shares the same state variable.
- `src/features/vocabulary/MyVocabularyView.tsx` — casts at lines 24, 170, 190, 247
- `src/hooks/useVocabulary.ts` — 10 casts (lines 59-66, 105-112) for Supabase column mapping
- `src/components/WordDisplay.tsx` — letter breakdown typing (lines 307, 309)
- `src/components/modals/WordDetailModal.tsx` — lines 57-58

### `_archive/` directory
Dead code lives in `src/_archive/`. It is excluded from `tsconfig.json` compilation (`"exclude": ["src/_archive"]`) but still on disk. Do not import from it.

### Console logging in LanguageSwitcher
`src/components/LanguageSwitcher.tsx:13-16` has debug console.log statements that ship to production.

## Hard-Won Patterns

### Dialog and Toast System (PR #12)
- **ConfirmDialog** (`src/components/ConfirmDialog.tsx`): Styled modal for destructive action confirmations. Props: isOpen, title, message, confirmLabel, cancelLabel, variant ('danger' | 'default'), onConfirm, onCancel.
- **Toast system** (`src/contexts/ToastContext.tsx`): App-wide toast notifications via `useToast()` hook. Usage: `showToast({ type: 'success' | 'error' | 'info', message: '...' })`. ToastProvider wraps the app in main.tsx.
- Native `alert()` and `confirm()` are banned. All 6 original calls have been replaced. Any new user feedback should use these components.

## Regression Traps

- **Native alert/confirm reintroduced** — Symptom: browser-native dialog appears instead of styled in-app component. Verify: `grep -rn "alert(\|confirm(" src/ --include="*.tsx" --include="*.ts" | grep -v "_archive" | grep -v ".test."` should return 0 results (except JSDoc comments in ConfirmDialog.tsx).


## Stable Files


## Running State
After each significant step, update docs/WORKING.md with:
- Current task and status
- What was just completed
- Next steps remaining
- Any blockers or open questions
This file is the first thing to read when resuming after a session break.

## After Feature Completion
- Clear or archive docs/WORKING.md
- Write learnings to docs/[feature].md
- If pattern is reusable across projects, note it at the top with: "CROSS-PROJECT: [what pattern, why it's reusable]"
- Run verification checklist
