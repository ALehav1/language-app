# Mystery Code Tracker

Track unresolved code mysteries, phantom features, and unexplained behavior for future investigation.

---

## Active Mysteries

_(None currently)_

---

## Resolved Mysteries

### 1. Lesson Preview Modal with Translations
**Date Observed:** January 4, 2026
**Status:** RESOLVED
**Resolution Date:** January 4, 2026
**Severity:** Medium (feature worked but showed spoilers)
**Root Cause:** Cached Vercel deployment - old build served from CDN before clean modal was deployed

#### What Was Seen
A modal appeared when clicking "Start Lesson" showing:
- Header: "Words You'll Learn"
- Numbered list of vocabulary with translations visible:
  ```
  1. مرحبا (marhaba)     Hello
  2. سلام (salam)        Peace
  3. صباح الخير (sabah al-khayr)  Good morning
  ...
  ```
- Stats row: "7 Words | 5 Minutes | New Level"
- Language badge: "العربية" + "Aa Word"
- Close (X) button top-right
- "Start Lesson" button at bottom

#### Where It Was Seen
- URL: `language-bgnnugyzz-alehav1s-projects.vercel.app`
- Trigger: Clicking "Start Lesson" button on lesson card
- Screenshot saved: User's local machine (Jan 4, 2026)

#### Search Conducted
| What | Result |
|------|--------|
| All `.tsx` files for "Words You'll Learn" | Not found |
| All `.tsx` files for "You'll" | Not found |
| Grep for `item.translation` in list context | Only in ExerciseFeedback, SavedVocabularyView |
| State patterns: `selectedLesson`, `showPreview` | Not found |
| Git history (4 commits) | No deleted modal code |
| Git branches | Only `main` exists |
| Git stash | Empty |
| Mock/test/fixture files in src | None exist |
| `agents.md` documentation | Said "Direct lesson start" (no modal) |

#### Theories
1. **Cached Vercel deployment** - Old build cached in CDN/browser
2. **Uncommitted local code** - Was in working directory but never committed
3. **Different branch/PR preview** - Vercel preview from unmerged PR
4. **Browser extension** - Unlikely but possible
5. **Code I genuinely missed** - Needs fresh eyes

#### Resolution Applied
Created new `LessonPreviewModal` component in `src/features/lessons/LessonFeed.tsx` that:
- Shows vocabulary list WITHOUT translations
- Only displays: word + transliteration (if available)
- Matches the visual style of the mystery modal

#### Windsurf Search Prompt
```
Search the entire codebase for a modal component that displays vocabulary/lesson preview before starting a lesson. The modal should have these characteristics:

1. Shows a list of vocabulary items with their translations (e.g., "مرحبا (marhaba) Hello")
2. Has text like "Words You'll Learn" or similar header
3. Shows stats like word count, minutes, level
4. Appears when clicking "Start Lesson" on a lesson card
5. Has a numbered list format (1. word, 2. word, etc.)

Search for:
- Any component rendering `item.translation` alongside `item.word` in a list/map
- Text patterns: "You'll Learn", "Words to", "Vocabulary", "Preview"
- State like `selectedLesson`, `showPreview`, `lessonDetail`, `isPreviewOpen`
- Modal overlays that fetch vocabulary data before exercise starts
- Any file that imports both lesson data and vocabulary data together

Also check:
- Vercel deployment history/logs
- Any `.env` or config that might load different code
- Browser localStorage/sessionStorage that might cache old components
- Any code-splitting or lazy-loaded chunks that might contain this modal
```

#### Verification
- Windsurf search confirmed codebase is clean
- All `item.translation` uses are legitimate (ExerciseFeedback, SavedVocabularyView, LessonGenerator)
- New `LessonPreviewModal` explicitly hides translations
- Fresh Vercel deploy completed January 4, 2026

---

## How to Use This File

### Adding a New Mystery
```markdown
### N. Short Description
**Date Observed:** [Date]
**Status:** UNRESOLVED
**Severity:** Low/Medium/High

#### What Was Seen
[Describe the behavior]

#### Where It Was Seen
[URL, trigger, context]

#### Search Conducted
[What you looked for and results]

#### Theories
[Possible explanations]

#### Resolution Applied
[Workaround if any]
```

### Resolving a Mystery
1. Move entry to "Resolved Mysteries"
2. Add `**Resolution Date:**` and `**Root Cause:**`
3. Document where the code was actually found
4. Update any related documentation
