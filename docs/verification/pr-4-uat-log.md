# PR-4 Interactive Text Selection - UAT Log

**Test Execution:** [TO BE COMPLETED BY USER]  
**Tester:** [USER NAME]  
**Environment:** Local dev server (http://localhost:5173)

---

## Instructions

For each breakpoint below, execute all three flows and record observations.

**Critical paths:**
1. ExerciseFeedback → Example sentences → Word clicks → WordDetailModal
2. MyPassagesView → Multi-sentence passage → Sentence click → SentenceDetailModal → Word click inside
3. Regression check: existing save flows still work

---

## Breakpoint: 375px (iPhone SE)

**Date/Time:** [FILL IN]  
**Browser:** [Chrome/Firefox/Safari + version]  
**Device/Simulator:** [iPhone SE / Chrome DevTools / etc.]

### Routes tested:
- [ ] ExerciseFeedback word click → WordDetailModal
- [ ] Passage sentence click → SentenceDetailModal
- [ ] Word click inside sentence modal → WordDetailModal
- [ ] Save flows (practice/archive) from both modals
- [ ] Regression: Normal exercise SaveDecisionPanel
- [ ] Regression: Lookup flow

### Observations:

**Tap accuracy:**
- Word buttons: [48×48px targets clickable? Any mis-taps?]
- Sentence buttons: [Easy to tap? Spacing adequate?]

**RTL correctness:**
- Arabic text direction: [rtl applied correctly?]
- Word boundaries: [Accurate splits? Diacritics preserved?]
- Punctuation positioning: [Correct placement?]

**Modal scroll:**
- WordDetailModal: [Content scrollable? Close button reachable?]
- SentenceDetailModal: [Sentence + word list scrollable?]

**Close behavior:**
- X button: [Works?]
- Outside click: [Closes modal?]
- ESC key (if supported): [Works?]

**Any layout issues:**
- [Text overflow? Button clipping? Spacing problems?]

**Screenshots:**
- [Optional: list filenames if captured]

---

## Breakpoint: 768px (iPad)

**Date/Time:** [FILL IN]  
**Browser:** [Chrome/Firefox/Safari + version]  
**Device/Simulator:** [iPad / Chrome DevTools / etc.]

### Routes tested:
- [ ] ExerciseFeedback word click → WordDetailModal
- [ ] Passage sentence click → SentenceDetailModal
- [ ] Word click inside sentence modal → WordDetailModal
- [ ] Save flows (practice/archive) from both modals
- [ ] Regression: Normal exercise SaveDecisionPanel
- [ ] Regression: Lookup flow

### Observations:

**Tap accuracy:**
- [Same checks as 375px]

**RTL correctness:**
- [Same checks as 375px]

**Modal scroll:**
- [Same checks as 375px]

**Close behavior:**
- [Same checks as 375px]

**Any layout issues:**
- Modal sizing: [Appropriate width? Not too narrow/wide?]
- Text wrapping: [Natural line breaks? No awkward wrapping?]

**Screenshots:**
- [Optional: list filenames]

---

## Breakpoint: 1024px (Desktop)

**Date/Time:** [FILL IN]  
**Browser:** [Chrome/Firefox/Safari + version]

### Routes tested:
- [ ] ExerciseFeedback word click → WordDetailModal
- [ ] Passage sentence click → SentenceDetailModal
- [ ] Word click inside sentence modal → WordDetailModal
- [ ] Save flows (practice/archive) from both modals
- [ ] Regression: Normal exercise SaveDecisionPanel
- [ ] Regression: Lookup flow

### Observations:

**Click accuracy:**
- Word buttons: [Hover states visible? Click precise?]
- Sentence buttons: [Hover feedback adequate?]

**RTL correctness:**
- [Same checks as previous breakpoints]

**Modal display:**
- Modal sizing: [Comfortable width? Not excessive?]
- Line length: [Readable? Not too long?]

**Close behavior:**
- [Same checks as previous breakpoints]

**Any layout issues:**
- [Any spacing/sizing problems at desktop width?]

**Screenshots:**
- [Optional: list filenames]

---

## Issues Found (if any)

**Issue 1:**
- Breakpoint: [375/768/1024]
- Flow: [ExerciseFeedback/Passages/Regression]
- Description: [What broke?]
- Severity: [Critical/Major/Minor]
- Fix applied: [Yes/No - describe fix]

**Issue 2:**
- [Repeat format]

---

## Sign-off

**All flows verified:** [ ] Yes [ ] No  
**Regressions detected:** [ ] Yes [ ] No  
**Issues requiring fix:** [ ] Yes [ ] No

**Tester notes:**
[Any additional observations, recommendations, or concerns]

**UAT Complete:** [Date/Time]
