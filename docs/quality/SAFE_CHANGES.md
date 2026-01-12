# Safe Changes Protocol

**Purpose:** Disciplined process for making code changes without breaking existing functionality.

**Audience:** AI agents (Cascade) and human developers

---

## Core Principle

**Never change behavior without explicit intention and test coverage.**

Every change should be:
1. **Locatable** - Find all usage before editing
2. **Testable** - Add/update tests before implementation
3. **Minimal** - Smallest diff that achieves the goal
4. **Verified** - TypeScript + tests + lint must pass
5. **Reversible** - Documented rollback available

---

## The Six-Step Process

### 1. Locate Usage

**Before touching any code:**

```bash
# Find all imports
grep -r "import.*ComponentName" src/

# Find all function calls
grep -r "functionName(" src/

# Find all type references
grep -r ": TypeName" src/
```

**Document:**
- All files that import the target
- All call sites
- All type dependencies

**Output:** List of files that will be affected

---

### 2. Understand Expected State

**Read existing tests:**
```bash
# Find test files
find src -name "*.test.ts" -o -name "*.test.tsx"

# Check test coverage for target
npm run test:run -- ComponentName
```

**If no tests exist:**
- Write baseline tests documenting current behavior
- Tests become your specification
- Label tests with "BASELINE" or "documents current behavior"

**Output:** Clear understanding of current behavior

---

### 3. Tests First

**Before changing production code:**

Write tests that:
1. **Document intended behavior** - Not current broken behavior
2. **Will fail initially** - Proving they test the right thing
3. **Cover edge cases** - Empty state, error state, boundary conditions

**Example:**
```typescript
// PR-3: Queue semantics tests BEFORE implementation
it('skip rotates item to end of queue', () => {
  // Test fails with current implementation
  // Will pass after queue refactor
});
```

**Run tests:**
```bash
npm run test:run
# Verify new tests FAIL as expected
```

**Output:** Failing tests that define success criteria

---

### 4. Smallest Diff

**Make the minimal change:**

**Good (focused):**
```typescript
// Change only the broken function
function skipQuestion() {
  rotateQueueItem();  // New behavior
}
```

**Bad (scope creep):**
```typescript
// Don't refactor unrelated code in same PR
function skipQuestion() {
  rotateQueueItem();
  // Also renamed variables
  // Also added logging
  // Also changed formatting
}
```

**Rules:**
- One behavior change per PR
- No "drive-by refactoring"
- No comment/whitespace changes mixed with logic
- Use focused tools: `edit()` not `write_to_file()`

**Output:** Minimal, targeted change

---

### 5. Verify Quality Gates

**Run all gates:**

```bash
# TypeScript type checking
npm run lint

# All tests
npm run test:run

# Check for regressions
npm run test:run -- --reporter=verbose
```

**All must pass:**
- ✅ TypeScript: 0 errors
- ✅ Tests: 100% passing (new tests now pass, old tests still pass)
- ✅ No new warnings introduced

**If gates fail:**
- Fix immediately
- Do NOT proceed with "will fix later"
- Gates failing = change is not ready

**Output:** Clean quality gate results

---

### 6. Document Rollback

**Every PR needs rollback instructions:**

**In CHANGELOG.md:**
```markdown
### Rollback Instructions
bash
# Restore previous state
git checkout <commit-before-pr> -- src/path/to/changed/files

# Clear any persisted state
localStorage.clear()  # if persistence changed

# Restart dev server
npm run dev
```

**In ADR (if architectural):**
```markdown
## Rollback Strategy
If this decision needs to be reversed:
1. Remove new files: src/domain/practice/*
2. Restore old hook: git checkout HEAD~1 src/hooks/useVocabulary.ts
3. Remove tests: rm src/domain/practice/__tests__/*
```

**Output:** Clear, tested rollback path

---

## Common Patterns

### Pattern: Refactoring Hook Logic

```bash
# 1. Locate
grep -r "useTargetHook" src/

# 2. Expected state
npm run test:run -- useTargetHook.test.ts

# 3. Tests first (if missing)
# Add baseline tests documenting current behavior

# 4. Minimal change
# Extract logic to separate function
# Update hook to call new function

# 5. Verify
npm run lint && npm run test:run

# 6. Document
# Add to CHANGELOG with rollback
```

---

### Pattern: Adding New Feature

```bash
# 1. Locate (N/A for new feature, but check for naming conflicts)
grep -r "NewFeatureName" src/

# 2. Expected state
# Write ADR if architectural
# Define behavior in tests

# 3. Tests first
# Write tests for happy path + edge cases
# Tests MUST fail initially

# 4. Minimal implementation
# Implement only what tests require
# No extra features

# 5. Verify
npm run lint && npm run test:run

# 6. Document
# Update README if user-facing
# Add to CHANGELOG
```

---

### Pattern: Fixing Bug

```bash
# 1. Locate
# Find where bug manifests
grep -r "buggyFunction" src/

# 2. Expected state
# Write test that REPRODUCES bug
it('should handle edge case correctly', () => {
  // This test currently FAILS
  expect(buggyFunction(edgeCase)).toBe(expected);
});

# 3. Test confirms bug
npm run test:run
# Test fails = bug confirmed

# 4. Fix bug
# Make minimal change to pass test

# 5. Verify fix
npm run test:run
# Test now passes, no regressions

# 6. Document
# Add to CHANGELOG
# Update ADR if bug reveals design flaw
```

---

## Anti-Patterns (What NOT to Do)

### ❌ Skip Testing
**Bad:**
> "I'll add tests later after I see if this works"

**Why bad:** No way to verify change is correct

**Correct:**
> "Tests first, then implementation"

---

### ❌ Change Multiple Things at Once
**Bad:**
> "While fixing skip, I also refactored the state management and renamed variables"

**Why bad:** Can't isolate failures, hard to rollback

**Correct:**
> "PR-3 fixes skip only. Refactoring is PR-4."

---

### ❌ Ignore Failing Gates
**Bad:**
> "TypeScript has 2 errors but they're in tests, not production code"

**Why bad:** Errors compound, repo becomes fragile

**Correct:**
> "Fix ALL errors before proceeding. Test errors = real errors."

---

### ❌ No Rollback Plan
**Bad:**
> "If this breaks, we'll figure it out"

**Why bad:** Emergency debugging under pressure

**Correct:**
> "Rollback documented in CHANGELOG before PR merges"

---

## Quality Checklist

Before considering a PR complete:

- [ ] All usage sites located and documented
- [ ] Existing tests reviewed and understood
- [ ] New tests written (if changing behavior)
- [ ] New tests initially failed (proving they test correctly)
- [ ] Minimal diff (no scope creep)
- [ ] TypeScript: 0 errors
- [ ] Tests: 100% passing
- [ ] No new warnings
- [ ] Rollback documented in CHANGELOG
- [ ] ADR written (if architectural change)
- [ ] Documentation updated (README, dependency-map)

---

## Emergency Rollback

If production breaks:

```bash
# 1. Identify breaking PR
git log --oneline -10

# 2. Follow documented rollback
# Check CHANGELOG.md for exact steps

# 3. Verify rollback
npm run lint && npm run test:run

# 4. Document incident
# Add post-mortem to docs/verification/incidents/
```

---

## References

- **ADR Index:** `docs/architecture/adr/README.md`
- **CHANGELOG:** `docs/verification/CHANGELOG.md`
- **Dependency Map:** `docs/architecture/dependency-map.md`
- **Test Commands:** See `README.md` Testing section
