# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [In Progress] - 2026-01-11

**Hebrew gating + Spanish defaults + Spanish listening exercise**

Baseline: 142/145 tests passing (3 WordDetailModal timing issues), 0 TypeScript errors

---

## [PR-4] - 2026-01-11

### Added

**Interactive Text Selection**

- **Clickable words:** Example sentences in ExerciseFeedback now clickable at word level
  - Opens WordDetailModal with full word breakdown
  - SaveDecisionPanel integration for immediate saving
- **Clickable sentences:** Multi-sentence passages support sentence-level clicking
  - Opens SentenceDetailModal with sentence view
  - Words inside sentences are also clickable (nested interaction)
- **New components:**
  - `ClickableText` - Dual-mode component (word/sentence rendering)
  - `WordDetailModal` - Word detail view + save flow
  - `SentenceDetailModal` - Sentence detail view + word clicks
- **New utilities:**
  - `tokenizeWords()` - Arabic/Spanish-safe word tokenization
  - `splitSentences()` - Sentence boundary detection
- **Selection context types:** `WordSelectionContext`, `SentenceSelectionContext`

### Changed

- ExerciseFeedback example sentences render with ClickableText (was static text)
- MyPassagesView multi-sentence passages render as clickable sentence list

### Technical

- 90 new tests (48 utilities, 42 components)
- RTL support verified for Arabic
- Touch targets: 48×48px minimum (mobile-friendly)
- Zero new database tables (uses existing `saved_words`)
- Language-parameterized for future Spanish expansion

**Verification:** [PR-4 Interactive Selection](/docs/verification/pr-4-interactive-selection.md)  
**UAT Log:** [PR-4 UAT Results](/docs/verification/pr-4-uat-log.md) (pending user completion)  
**Architecture:** ADR-004 Interactive Text Selection  
**Tests:** 145/145 passing | 0 TypeScript errors

---

## [PR-3] - 2025-01-11

### Changed

**Exercise Queue Semantics & Versioned Persistence**

- **Skip behavior:** Skip now rotates current item to end of queue instead of incrementing index
  - Fixes bug where skipping all items would complete exercise without answering
  - Items cycle until answered - skip alone cannot complete
- **Persistence timing:** Progress now saves immediately after `submitAnswer()` (was: only after `continueToNext()`)
- **Persistence format:** Upgraded to V2 queue-based schema with automatic V1→V2 migration
  - V1 saves automatically upgraded on first load
  - Queue state preserved across sessions for safe resume

### Added

- `isHydrated` flag in `useExercise` return for deterministic initialization
- V1→V2 migration with answered item preservation
- 9 new queue semantic tests (`useExercise.queue.test.ts`)

### Fixed

- Skip no longer completes exercise without answering all items
- Progress persistence after answer submission (was broken in V1)
- Flaky test timing via deterministic hydration

**Verification:** [PR-3 Exercise Queue](/docs/verification/pr-3-exercise-queue.md)  
**Tests:** 55/55 passing | 0 TypeScript errors

---

## [PR-2] - 2025-01-10

### Added

**PracticeItem Domain Abstraction**

- Introduced `PracticeItem` as canonical domain model for all exercise types
- Created adapter pattern: `fromVocabularyItems` and `fromSavedWords`
- Added golden equivalence test for adapter parity
- Created ADR-001 documenting domain seam

### Changed

- Normalized `null` to `undefined` in domain types
- Updated dependency map to reflect new domain layer

**Verification:** Domain tests passing, adapters verified equivalent  
**Documentation:** [ADR-001](/docs/architecture/adr/ADR-001-practice-item.md)

---

## [PR-1] - 2025-01-09

### Added

**Baseline Test Suite**

- 46 baseline tests for `useExercise` capturing current behavior
- Tests document bugs as "BUG:" for future fixes
- Tests serve as regression safety net for refactoring

**Verification:** 46/46 tests passing (documenting current state, including bugs)

---

## Initial Release

Basic vocabulary exercise functionality with localStorage persistence.
