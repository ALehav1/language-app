# PR-6: Spanish Dictation/Listening Exercise

**Status:** Planning (Post PR-4 Tightening)  
**Priority:** Next major feature after Hebrew gating + Spanish defaults  
**Target:** Audio-first comprehension practice for Spanish learners

---

## Overview

Implement audio-based listening comprehension and dictation exercises for Spanish. Users hear native LatAm Spanish at normal speed (with slowed fallback), then provide both:
1. Spanish transcription (what they heard)
2. English translation (what it means)

**Core Constraints:**
- LatAm neutral audio (primary), Spain reference (secondary)
- NO transliteration (Spanish uses Latin script)
- NO Hebrew cognates (Spanish is Romance, not Semitic)
- NO letter breakdown (not needed for Latin script)
- Focus on **comprehension**, not pronunciation scoring

---

## Requirements Summary

### Audio Playback
- **Primary speed:** Normal conversational speed (default)
- **Fallback speed:** Slowed (0.6-0.7x) for learner support
- **Provider:** Web Speech API (TTS) for MVP, with path to pre-recorded audio
- **Voice:** Spanish (LatAm neutral preferred: es-MX, es-AR, es-CO)

### User Input
- **Transcription:** Spanish text input (what user heard)
- **Translation:** English text input (what it means)
- **Future:** Voice input option (speak response instead of typing)

### Validation
- **Semantic matching** for both fields (not exact string match)
- **Pass criteria:** BOTH transcription + translation semantically correct
- **Tolerances:** Minor spelling errors, synonyms, paraphrasing allowed
- **Feedback:** Specific per-field (which part needs work)

---

## Type System Extensions

### New `promptType` Values

```typescript
type PromptType = 
  | 'text'           // Existing: show text
  | 'audio'          // NEW: play audio only (no visual text)
  | 'audio+text';    // NEW: audio + visual text (training wheels)
```

**Usage:**
- `'audio'` = listening comprehension challenge (audio stimulus only)
- `'audio+text'` = learning mode (see + hear simultaneously)

### New `answerType` Values

```typescript
type AnswerType = 
  | 'transliteration+translation'     // Existing: Arabic dual input
  | 'translation'                      // Existing: Spanish text-based
  | 'transcription+translation'        // NEW: Spanish listening (text input)
  | 'voice_transcription+translation'; // FUTURE: voice input variant
```

**Usage:**
- `'transcription+translation'` = type Spanish + type English
- `'voice_transcription+translation'` = speak Spanish + type/speak English

### PracticeItem Schema Changes

```typescript
interface PracticeItem {
  // ... existing fields ...
  promptType: PromptType;
  answerType: AnswerType;
  
  // NEW fields for audio exercises
  audioUrl?: string;              // TTS-generated or pre-recorded audio URL
  expectedTranscription?: string; // Spanish sentence for validation
  audioSpeedPreference?: 'normal' | 'slow'; // User preference (persisted)
}
```

**Migration:**
- Existing items default to `promptType: 'text'`
- No DB migration needed (optional fields)

---

## Component Architecture

### New Components

#### 1. `AudioPlayer.tsx`
**Purpose:** Play audio with speed control

**Props:**
```typescript
interface AudioPlayerProps {
  audioUrl?: string;           // TTS-generated or pre-recorded
  text: string;                // Spanish sentence (for TTS fallback)
  language: 'spanish';
  dialect?: 'latam' | 'spain';
  onPlaybackComplete?: () => void;
  defaultSpeed?: 'normal' | 'slow';
}
```

**Features:**
- ▶️ Play button (primary action)
- 🔄 Speed toggle (Normal ⇄ Slow)
- Visual playback indicator (progress bar or waveform)
- Replay counter (analytics)
- Auto-select best Spanish TTS voice

**State:**
```typescript
{
  isPlaying: boolean;
  speed: 'normal' | 'slow';
  playCount: number;
  error: string | null;
}
```

#### 2. `TranscriptionInput.tsx`
**Purpose:** Dual text input for Spanish + English

**Props:**
```typescript
interface TranscriptionInputProps {
  onSubmit: (transcription: string, translation: string) => void;
  disabled?: boolean;
  initialTranscription?: string;  // For edit/retry
  initialTranslation?: string;
}
```

**Layout:**
```
┌─────────────────────────────────────┐
│ Spanish (what you heard)            │
│ [________________________]         │
│                                     │
│ English (what it means)             │
│ [________________________]         │
│                                     │
│          [Submit Answer]            │
└─────────────────────────────────────┘
```

**Features:**
- Clear visual separation (Spanish top, English bottom)
- Real-time character count
- Submit validation (both fields required)
- Future: Voice input button per field

### Updated Components

#### 3. `ExercisePrompt.tsx`
**Changes:**
- Handle `promptType: 'audio'` → render `<AudioPlayer>` instead of text
- Handle `promptType: 'audio+text'` → render both `<AudioPlayer>` + text display
- Pass `item.audioUrl` or generate TTS on-the-fly

#### 4. `AnswerInput.tsx`
**Changes:**
- Handle `answerType: 'transcription+translation'` → render `<TranscriptionInput>`
- Pass callbacks for dual-field submission

#### 5. `ExerciseFeedback.tsx`
**Changes:**
- Display validation results for BOTH transcription + translation
- Specific feedback per field:
  - ✅ "Spanish transcription correct"
  - ❌ "Spanish transcription needs work: [hint]"
  - ✅ "English translation correct"
  - ❌ "English translation needs work: [hint]"

---

## Audio Infrastructure

### Web Speech API (MVP)

**Implementation:**
```typescript
// src/utils/audio/textToSpeech.ts

export function speak(text: string, options: {
  language: 'spanish';
  dialect?: 'latam' | 'spain';
  rate?: number; // 1.0 = normal, 0.6 = slow
}): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!window.speechSynthesis) {
      reject(new Error('Speech synthesis not supported'));
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = options.dialect === 'spain' ? 'es-ES' : 'es-MX';
    utterance.rate = options.rate ?? 1.0;
    
    // Select best Spanish voice
    const voices = window.speechSynthesis.getVoices();
    const spanishVoice = voices.find(v => 
      v.lang.startsWith('es-') && 
      (v.lang.includes('MX') || v.lang.includes('AR') || v.lang.includes('CO'))
    );
    if (spanishVoice) {
      utterance.voice = spanishVoice;
    }

    utterance.onend = () => resolve();
    utterance.onerror = (e) => reject(e);
    
    window.speechSynthesis.speak(utterance);
  });
}
```

**Browser Support:**
- Chrome: ✅ Excellent
- Safari: ✅ Good (some voice limitations)
- Firefox: ✅ Good
- Edge: ✅ Excellent

**Fallback Strategy:**
- If Web Speech API unavailable → show text-only exercise
- If no Spanish voice available → degrade to text-based

### Future: Pre-Recorded Audio

**Provider Options:**
- **ElevenLabs:** High-quality, expensive (~$0.30/1000 chars)
- **OpenAI TTS:** Good quality, affordable (~$0.015/1000 chars)
- **Google Cloud TTS:** Reliable, mid-tier pricing

**Storage:**
- Generate audio on first lesson create
- Store in Supabase Storage (public bucket)
- Reference via `PracticeItem.audioUrl`

---

## Validation Logic

### Transcription Validation

**Approach:** Semantic comparison using OpenAI

```typescript
// src/lib/openai.ts

export async function validateTranscription(
  expected: string,
  actual: string,
  language: 'spanish'
): Promise<{
  isCorrect: boolean;
  feedback: string;
  similarity: number;
}> {
  const prompt = `
Compare these two Spanish sentences semantically:

Expected: "${expected}"
Actual: "${actual}"

Rules:
- Minor spelling errors are OK
- Synonyms are acceptable
- Word order differences are OK if meaning preserved
- Ignore punctuation differences
- Case insensitive

Return JSON:
{
  "isCorrect": boolean,
  "feedback": "string explaining what's wrong or confirming correctness",
  "similarity": number (0-100)
}
`;

  // Call OpenAI, parse JSON response
  // Pass if similarity >= 85
}
```

### Translation Validation

**Reuse existing semantic validation:**
- Already implemented for Arabic→English
- Same logic applies to Spanish→English
- Accept paraphrases and synonyms

### Combined Scoring

```typescript
interface ExerciseResult {
  transcriptionCorrect: boolean;
  transcriptionFeedback: string;
  translationCorrect: boolean;
  translationFeedback: string;
  overallPass: boolean; // BOTH must be true
}
```

---

## Minimal Vertical Slice (MVP)

### Scope

**In Scope:**
1. ✅ `AudioPlayer` component with TTS playback
2. ✅ Speed control (normal/slow toggle)
3. ✅ `TranscriptionInput` dual-field form
4. ✅ `promptType: 'audio'` + `answerType: 'transcription+translation'`
5. ✅ Semantic validation for both fields
6. ✅ ExerciseFeedback dual-field display
7. ✅ Basic error handling (TTS failure → text fallback)

**Out of Scope (Future PRs):**
- Voice input (speak response)
- Pre-recorded audio files
- Waveform visualization
- Advanced playback controls (pause, seek)
- Multiple voice/accent options

### Test Plan

**Unit Tests:**
- `AudioPlayer.test.tsx` - playback, speed toggle, error handling
- `TranscriptionInput.test.tsx` - dual-field validation, submission
- `textToSpeech.test.ts` - TTS wrapper, voice selection, error states

**Integration Tests:**
- Full listening exercise flow:
  1. Hear audio
  2. Write transcription + translation
  3. Submit
  4. Receive dual validation feedback

**Manual Testing:**
- Browser compatibility (Chrome, Safari, Firefox)
- TTS voice quality across browsers
- Speed control naturalness (slow playback)
- Mobile audio playback (iOS/Android)

---

## Database Schema

**No migrations required** - use existing `vocabulary_items` table with optional fields:

```typescript
// Metadata JSONB field structure for listening exercises:
{
  audioUrl?: string;              // Pre-recorded audio (future)
  audioProvider?: 'tts' | 'openai' | 'elevenlabs';
  expectedTranscription?: string; // Spanish sentence
  exerciseType: 'listening';      // Marker for this exercise type
}
```

**Lesson Generation:**
- Mark lessons with `contentType: 'phrase'` for listening exercises
- Store Spanish sentence in `word` field (legacy compatibility)
- Store English translation in `translation` field

---

## Feature Flag

```typescript
// src/config/features.ts

export const FEATURES = {
  SPANISH_LISTENING: import.meta.env.VITE_ENABLE_SPANISH_LISTENING === 'true'
};
```

**Usage in UI:**
```typescript
// In LessonGenerator.tsx
{FEATURES.SPANISH_LISTENING && language === 'spanish' && (
  <ContentTypeOption value="listening">
    🎧 Listening Practice
  </ContentTypeOption>
)}
```

**Rollout:**
1. Dev environment (flag ON)
2. Internal testing (select users)
3. Beta (all Spanish learners)
4. GA (remove flag)

---

## Success Metrics

**Engagement:**
- % of Spanish users who try listening exercises
- Average exercises completed per session
- Retry rate (how often users replay audio)

**Performance:**
- Transcription accuracy > 80% on first attempt
- Translation accuracy > 90% on first attempt
- Audio playback success rate > 95% across browsers

**Quality:**
- User feedback on TTS voice quality (survey)
- Comparison: normal vs slow speed usage ratio
- Error rate (TTS failures, validation bugs)

---

## Implementation Checklist

### Phase 1: Audio Infrastructure (Week 1)
- [ ] Create `src/utils/audio/textToSpeech.ts`
- [ ] Implement Web Speech API wrapper
- [ ] Add voice selection logic (prefer LatAm)
- [ ] Create `AudioPlayer.tsx` component
- [ ] Add speed control (normal/slow)
- [ ] Write `AudioPlayer.test.tsx`

### Phase 2: Type System (Week 1)
- [ ] Add `promptType: 'audio'` to PracticeItem type
- [ ] Add `answerType: 'transcription+translation'` to PracticeItem type
- [ ] Add optional `audioUrl`, `expectedTranscription` fields
- [ ] Update PracticeItem adapters (fromVocabularyItems, etc.)
- [ ] Write adapter tests

### Phase 3: UI Components (Week 2)
- [ ] Create `TranscriptionInput.tsx`
- [ ] Write `TranscriptionInput.test.tsx`
- [ ] Update `ExercisePrompt.tsx` for audio prompts
- [ ] Update `AnswerInput.tsx` for dual-field input
- [ ] Update `ExerciseFeedback.tsx` for dual validation display
- [ ] Write integration tests

### Phase 4: Validation (Week 2)
- [ ] Implement `validateTranscription()` in openai.ts
- [ ] Reuse/adapt existing semantic translation validation
- [ ] Create combined validation logic (both fields)
- [ ] Write validation tests
- [ ] Test edge cases (empty input, special chars, etc.)

### Phase 5: Lesson Generation (Week 3)
- [ ] Update `generateLessonContent()` for listening exercises
- [ ] Add Spanish sentence generation (5-12 words, natural spoken)
- [ ] Mark listening exercises in metadata
- [ ] Add "listening" option to LessonGenerator UI (behind flag)
- [ ] Test full lesson create → practice flow

### Phase 6: Polish & Testing (Week 3-4)
- [ ] Browser compatibility testing
- [ ] Mobile audio testing (iOS/Android)
- [ ] TTS voice quality evaluation
- [ ] Error handling polish (graceful degradation)
- [ ] User feedback mechanisms
- [ ] Documentation updates (README, ARCHITECTURE)

---

## Future Enhancements

### Voice Input (PR-7)
- Use Web Speech API for recognition
- `answerType: 'voice_transcription+translation'`
- Pronunciation scoring (optional)

### Pre-Recorded Audio Library (PR-8)
- Professional native speaker recordings
- Multiple accents (Mexico, Argentina, Colombia, Spain)
- Higher quality than TTS

### Conversation Mode (PR-9)
- Multi-turn dialog exercises
- Question → User Response → Follow-up
- Contextual conversation practice

### Subtitle Toggle (Enhancement)
- Show/hide Spanish text while listening
- "Training wheels" mode (text visible)
- "Challenge" mode (audio only)

---

## Risk Mitigation

**Risk: Web Speech API voice quality poor**
- **Mitigation:** Test across browsers, document best browsers
- **Fallback:** OpenAI TTS API (~$0.015/1000 chars)
- **Decision point:** Week 1 testing

**Risk: Browser compatibility issues**
- **Mitigation:** Feature detection, graceful degradation
- **Fallback:** Show text-only exercise if audio unavailable
- **Coverage target:** 95% of users

**Risk: Validation too strict/lenient**
- **Mitigation:** Tunable similarity threshold (85% default)
- **User testing:** A/B test thresholds
- **Fallback:** Manual review option

**Risk: Mobile autoplay restrictions**
- **Mitigation:** Require user tap to start audio
- **iOS workaround:** Test `playsInline` attribute
- **Android:** Generally more permissive

---

## Notes

- **Spanish-only** for MVP (evaluate Arabic TTS quality separately)
- **LatAm primary** reflects user base demographics
- **No transliteration** - Spanish learners don't need it (Latin script)
- **No Hebrew** - irrelevant to Romance language family
- **Comprehension focus** - scoring based on understanding, not perfect pronunciation

---

**Created:** January 11, 2026  
**Author:** Cascade AI  
**Related:** PR-4 (Interactive Text Selection), PR-5 (Tightening), Spanish Defaults
