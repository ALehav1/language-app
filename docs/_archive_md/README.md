# Archived Markdown Files

**Archive Created:** January 11, 2026  
**Reason:** Consolidation - removing redundant and outdated documentation

---

## Archived Files

### Root Level Files (6 files)

**CHANGES_LOG.md**
- **Why Archived:** Superseded by `docs/verification/CHANGELOG.md` (PR-2)
- **Content:** January 10, 2026 UI restructure changes
- **Replacement:** CHANGELOG.md now tracks all PRs

**CURRENT_STATE.md**
- **Why Archived:** Redundant with README.md + ARCHITECTURE.md
- **Content:** Component architecture reminders (Jan 10)
- **Replacement:** Information merged into ARCHITECTURE.md

**DEPLOYMENT.md**
- **Why Archived:** Outdated deployment history
- **Content:** Vercel deployment URLs from January 10
- **Replacement:** Current production URL in README.md

**README_OLD.md**
- **Why Archived:** Legacy readme (32KB, already marked "old")
- **Content:** Previous version of README
- **Replacement:** Current README.md

**agents.md**
- **Why Archived:** Exact duplicate of content now in .windsurfrules
- **Content:** Quick reference guide
- **Replacement:** .windsurfrules file (used by Cascade)

**agents_old.md**
- **Why Archived:** Legacy agents file
- **Content:** Previous version of agents quick reference
- **Replacement:** Current .windsurfrules

### docs/ Level Files (4 files)

**COMPONENT_ARCHITECTURE.md**
- **Why Archived:** Information consolidated into ARCHITECTURE.md
- **Content:** Component usage patterns
- **Replacement:** ARCHITECTURE.md (comprehensive)

**PLAN-arabic-dual-input.md**
- **Why Archived:** Completed planning document
- **Content:** Original dual-input feature planning
- **Replacement:** Feature is now implemented

**contract.md**
- **Why Archived:** Old development contract
- **Content:** Brief development scope
- **Replacement:** No longer needed

**my-vocabulary-design.md**
- **Why Archived:** Completed design document (20KB)
- **Content:** Original My Vocabulary feature design
- **Replacement:** Feature is now implemented and documented in ARCHITECTURE.md

---

## Active Documentation (After Cleanup)

### Root Level
- `README.md` - User-facing overview
- `ARCHITECTURE.md` - Complete technical reference
- `CLEANUP_ANALYSIS.md` - File audit
- `SCRAP.md` - Code graveyard (still useful)

### docs/architecture/
- `dependency-map.md` - Complete hook dependency mapping
- `adr/README.md` - ADR index
- `adr/ADR-001-practice-item.md` - PracticeItem domain abstraction

### docs/verification/
- `CHANGELOG.md` - PR-based change tracking
- `pr-1-inventory-baseline.md` - PR-1 verification
- `pr-2-practice-item.md` - PR-2 verification

---

## Recovery

All archived files are preserved in `docs/_archive_md/`. To restore any file:

```bash
# Example: restore DEPLOYMENT.md to root
mv docs/_archive_md/DEPLOYMENT.md .
```

---

**Verification:** No active code references archived files (grep search confirmed)
