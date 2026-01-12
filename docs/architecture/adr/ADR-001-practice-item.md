# ADR-001: PracticeItem Domain Abstraction

**Status:** Accepted  
**Date:** January 11, 2026  
**Deciders:** Language App Team  
**PR:** PR-2

---

## Context

The application currently has multiple sources of practice content flowing into exercise logic:

1. **`vocabulary_items`** table - lesson-generated content
2. **`saved_words`** table - user-saved vocabulary
3. **Lookup results** - on-demand translations (future persistence)
4. **Voice conversations** - planned expansion

Each source has different:
- Data shapes (VocabularyItem vs SavedWord)
- Mastery tracking systems (vocabulary_items.mastery_level vs saved_words.status)
- Metadata availability (some have letter breakdowns, some don't)
- Provenance semantics (lesson-driven vs user-curated)

**Current Pain Points:**
- `useExercise` must adapt multiple shapes into its internal format
- `useVocabulary` contains adapter logic mixed with data fetching (lines 41-69)
- Adding voice or Spanish multiplies these adaptation points
- No single abstraction for "something the user practices"

**Future Requirements (Voice + Spanish):**
- Multiple input modalities (typing, speech)
- Multiple prompt types (show target, show translation, audio playback)
- Multiple languages with different enrichment needs (cognates, script breakdowns)
- Multiple origins per practice item (saved from lesson, saved from voice, etc.)

---

## Decision

Introduce **`PracticeItem`** as a canonical domain-level abstraction representing any learnable content from any source.

**Core Principles:**

1. **Language-agnostic** - explicitly carries language, never assumes Arabic
2. **Modality-agnostic** - describes prompt/answer types independent of UI
3. **Source-agnostic** - tracks origin without coupling to specific tables
4. **Behavior-preserving** - carries raw state without translating mastery systems

**Implementation Strategy:**

Create `src/domain/practice/PracticeItem.ts` with:
- Pure domain types (no Supabase imports, no React)
- Explicit language field
- Prompt/answer framing for voice-readiness
- Raw mastery state preservation (no translation in PR-2)
- Robust provenance tracking (origin + linkage)

Create adapters in `src/domain/practice/adapters/`:
- `fromVocabularyItems.ts` - transforms VocabularyItem[] → PracticeItem[]
- `fromSavedWords.ts` - transforms SavedWord[] → PracticeItem[]
- Both reproduce **exact current behavior** including quirks

---

## Key Design Choices

### 1. Separate `origin` and `linkage`

**Problem:** A saved word can link to both its saved_word_id AND the vocabulary_item_id it came from.

**Solution:**
```typescript
origin: { type: 'saved_word', id: 'sw_123' }
linkage: { vocabularyItemId: 'vi_456', lessonId: 'lesson_789' }
```

This prevents "where did this come from?" pain later.

### 2. `masteryLevelRaw` instead of canonical mastery

**Problem:** Two incompatible mastery systems exist today:
- `vocabulary_items.mastery_level`: new | learning | practiced | mastered
- `saved_words.status`: active | learned | retired | needs_review

**Solution:** Carry both as raw strings in PR-2. ADR-002 (PR-4) will define canonical mapping.

**Why not translate now?** Translation = behavior change. PR-2 goal is zero behavior change.

### 3. `promptType` and `answerType` fields

**Problem:** Voice turns "show Arabic, type English" into:
- "hear Arabic, speak English"
- "see Arabic, speak Arabic"
- "hear English, speak Arabic"
- etc.

**Solution:** Explicit prompt/answer framing in domain object.

**Why add now?** Prevents voice from forcing a domain rewrite later. Current behavior maps to:
```typescript
promptType: 'show_target'
answerType: 'text_translation'
```

### 4. `targetText` instead of `word`

**Problem:** Field name `word` doesn't fit sentences, passages, or dialogs.

**Solution:** `targetText` - semantically correct for all content types.

### 5. Optional `createdAt`

**Problem:** Not all sources have creation timestamps:
- Lookup results: ephemeral
- Voice turns: session-based timestamps
- Saved items: have created_at

**Solution:** Make optional. Adapters provide it when available.

---

## Alternatives Rejected

### Alternative 1: Continue using VocabularyItem everywhere

**Rejected because:**
- VocabularyItem assumes vocabulary_items table schema
- Doesn't fit saved_words semantics
- Can't represent lookup results or voice turns
- No prompt/answer framing

### Alternative 2: Translate mastery systems in PR-2

**Rejected because:**
- Requires defining canonical mastery (ADR-002 scope)
- Creates behavior changes (violates PR-2 constraint)
- Risks breaking spaced repetition logic
- Should wait until PR-4 when all systems are unified

### Alternative 3: Separate domain objects per source

**Example:** LessonPracticeItem, SavedPracticeItem, VoicePracticeItem

**Rejected because:**
- Creates combinatorial complexity (N sources × M exercise types)
- Prevents mixing sources in single queue
- Duplicates exercise logic across types
- Voice needs to treat all sources uniformly

### Alternative 4: Use database types directly

**Rejected because:**
- Couples domain logic to Supabase schema
- Can't represent non-persisted sources (lookup, voice)
- Violates clean architecture (domain → infra dependency)
- Makes testing harder (requires DB mocks)

---

## Consequences

### Positive

✅ **Single abstraction for all practice content**
- Exercise logic works with PracticeItem regardless of source
- Adding voice = write new adapter, no exercise changes

✅ **Language explicit everywhere**
- Blocks Arabic-only assumptions
- Spanish expansion = add to Language type

✅ **Behavior preserved during refactor**
- Adapters reproduce current quirks exactly
- Tests lock invariants
- Zero risk to existing users

✅ **Voice-ready without voice code**
- Prompt/answer framing prevents future rewrites
- Domain object supports audio playback, speech input
- No premature voice implementation

✅ **Testable in isolation**
- Pure domain object (no React, no Supabase)
- Adapters testable with fixtures
- Contract tests ensure shape stability

### Negative

⚠️ **Temporary field redundancy**
- `masteryLevelRaw` + `timesPracticed` carry dual state
- Resolved in PR-4 when canonical mastery chosen

⚠️ **Enrichments typed as `unknown`**
- letterBreakdown, hebrewCognate, exampleSentences
- Avoided importing DB types
- Tightened in PR-4 after domain types extracted

⚠️ **Migration cost**
- useVocabulary, useExercise must adopt adapters
- But migration is incremental (one hook at a time)
- Tests validate no behavior change

### Risks & Mitigations

**Risk:** Adapters introduce subtle behavior changes

**Mitigation:**
- Adapter tests assert exact output shape
- useVocabulary tests pass unchanged
- Manual review of adapter code against original

**Risk:** PracticeItem schema becomes bloated

**Mitigation:**
- Keep enrichments optional
- Split into PracticeItemCore + PracticeItemEnrichments if needed (PR-4+)

**Risk:** Future sources don't fit PracticeItem

**Mitigation:**
- Schema designed for voice + Spanish (known future)
- Extensible via optional fields
- Can version PracticeItem if breaking change needed

---

## Implementation Notes

### PR-2 Scope (This ADR)

1. Create `src/domain/practice/PracticeItem.ts`
2. Create `src/domain/practice/adapters/fromVocabularyItems.ts`
3. Create `src/domain/practice/adapters/fromSavedWords.ts`
4. Write adapter tests in `src/domain/practice/__tests__/`
5. Refactor `useVocabulary` to use `fromVocabularyItems` adapter
6. **No UI changes, no new features**

### Out of Scope (Future PRs)

- ADR-002: Canonical mastery system (PR-4)
- ADR-003: Exercise queue semantics (PR-3)
- ADR-004: Memory unification (PR-4)
- Voice implementation (PR-5+)
- Spanish expansion (PR-5+)

---

## Addendum: Canonical Domain Model vs Adapter Pattern (Post-PR-2)

**Date:** January 11, 2026

### PracticeItem is Canonical

`PracticeItem` represents the **canonical domain model** for all learnable content. It is:
- **Language-explicit** - Never hardcoded
- **Modality-agnostic** - Ready for text + voice
- **Source-agnostic** - Works with vocabulary_items, saved_words, voice turns

### VocabularyItem is an Adapter

The existing `VocabularyItem` interface remains as a **temporary adapter** for the current exercise engine (`useExercise`). The flow is:

```
DB → PracticeItem (domain) → VocabularyItem (adapter) → Exercise Runtime
```

**Why keep VocabularyItem?**
- `useExercise` currently expects `VocabularyItem[]`
- Changing this requires touching exercise UI logic
- PR-2 scope: establish seam, not refactor runtime

**Future:** Once voice + Spanish introduce multi-modality, `useExercise` will migrate to consume `PracticeItem[]` directly, and `VocabularyItem` will be deprecated.

### Domain Typing Strategy

**Principle:** UI-centric types allowed, DB types excluded.

**Enrichments** (letterBreakdown, hebrewCognate, exampleSentences):
- Defined in `src/domain/practice/types.ts`
- Re-export stable UI-facing types from `types/database.ts`
- Avoid direct coupling to DB schemas

**Why this matters:** Voice + Spanish will introduce new enrichments (pronunciation metadata, STT confidence, dialect variations). These will be domain-first types, not DB exports.

**Normalization:** Adapters convert DB `null` → domain `undefined` for TypeScript best practices.

---

## Validation Criteria

PR-2 is complete when:
- [ ] All existing tests pass unchanged
- [ ] Adapter tests achieve 100% coverage
- [ ] `useVocabulary` refactored with no behavior change
- [ ] Dependency map updated (domain layer added)
- [ ] Zero UI changes
- [ ] Zero TypeScript errors
- [ ] Verification note written

---

## References

- PR-1 Dependency Map: `docs/architecture/dependency-map.md`
- PR-1 Verification: `docs/verification/pr-1-inventory-baseline.md`
- `.windsurfrules`: Architecture integrity rules
