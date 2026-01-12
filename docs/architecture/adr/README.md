# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records documenting significant architectural choices for the language learning app.

## What is an ADR?

An ADR captures a single architectural decision along with its context and consequences. Each ADR is immutable once decided - new decisions supersede old ones rather than editing them.

## Format

Each ADR follows this structure:
- **Status:** Proposed | Accepted | Deprecated | Superseded
- **Context:** What forces are at play? What problem needs solving?
- **Decision:** What did we decide to do?
- **Consequences:** What becomes easier/harder as a result?
- **Alternatives Considered:** What other options were rejected and why?

## Index

### ADR-001: PracticeItem Domain Abstraction
**File:** [ADR-001-practice-item.md](./ADR-001-practice-item.md)  
**Status:** Accepted (PR-2)  
**Date:** January 11, 2026

**Decision:** Introduce `PracticeItem` as the canonical domain-level representation of learnable content, decoupling domain logic from database schemas.

**Key Points:**
- Language-agnostic design (never hardcoded)
- Modality-agnostic (voice-ready via promptType/answerType)
- Source-agnostic (adapters from vocabulary_items, saved_words, future voice)
- Raw mastery state preservation (no premature unification)

**Implemented In:** PR-2
- `src/domain/practice/PracticeItem.ts`
- `src/domain/practice/adapters/`
- Refactored `useVocabulary` to use adapters

---

## Planned ADRs

### ADR-002: Canonical Mastery System
**Target:** PR-4  
**Problem:** Dual mastery tracking (vocabulary_items.mastery_level vs saved_words.status) creates synchronization issues

**Proposal:** Establish saved_words as single source of truth for learner progress

---

### ADR-003: Exercise Queue Semantics
**Target:** PR-3  
**Problem:** Skip behavior is broken (just increments index, doesn't move to end)

**Proposal:** Define proper queue operations for exercise flow

---

### ADR-004: Memory Unification
**Target:** PR-4  
**Problem:** Fragmented memory (saved_words, saved_sentences, saved_passages) prevents unified queries

**Proposal:** Consolidate to saved_words with content_type classification

---

## Guidelines for New ADRs

1. **Write ADR before code** - Especially for behavior-changing PRs
2. **One decision per ADR** - Keep scope focused
3. **Document rejected alternatives** - Explain why other options didn't work
4. **Link to implementation** - Reference PRs, files, line numbers
5. **Update index** - Add new ADRs to this README

---

## References

- [Michael Nygard's ADR template](https://github.com/joelparkerhenderson/architecture-decision-record)
- [When to write an ADR](https://adr.github.io/)
