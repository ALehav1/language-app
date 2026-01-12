# PR-5: Spanish Listening/Dictation Exercise

**Status:** Planning  
**Priority:** Next PR after PR-4 Hebrew gating  
**Target:** Listening comprehension + dictation practice for Spanish

---

## Overview

Add a new exercise type for Spanish that focuses on listening comprehension and dictation. Users listen to native LatAm Spanish audio at normal speed, with option to replay at slower speed, and respond by writing or speaking their transcription and translation.

**Key Requirements:**
- Audio playback (normal speed by default, slowed speed on request)
- Native LatAm speaker quality
- Write OR speak response capability
- No transliteration (Spanish is Latin script)
- No Hebrew cognates
- Focus on comprehension

---

## Design Goals

1. **Listening-first approach** - Audio is the primary stimulus, not text
2. **Speed control** - Normal speed default, but slowed replay available
3. **Dual response modes** - Write (keyboard) OR speak (voice input)
4. **Dual validation** - Check both Spanish transcription AND English translation
5. **Language-specific** - Only for Spanish (not Arabic)

---

## Technical Implementation Plan

### Phase 1: Audio Infrastructure

**Web Speech API Integration:**
- Use browser TTS (Text-to-Speech) for MVP
- `window.speechSynthesis.speak()` with Spanish voice
- Rate control: `1.0` (normal) vs `0.6` (slow)
- Voice selection: prefer `es-MX` or `es-AR` for LatAm

**Alternative TTS Providers (if Web Speech insufficient):**
- OpenAI TTS API (`tts-1` model, `nova` voice)
- ElevenLabs API (higher quality, more expensive)
- Google Cloud TTS

**Audio State Management:**
- Track playback speed (normal/slow)
- Track play count (analytics)
- Provide visual feedback during playback

### Phase 2: PracticeItem Extension

**New `promptType` values:**
```typescript
type PromptType = 
  | 'text'           // existing: show text
  | 'audio'          // NEW: play audio only
  | 'audio+text';    // NEW: audio + visual text

type AnswerType = 
  | 'transliteration+translation'  // existing: Arabic dual input
  | 'translation'                   // existing: Spanish text-based
  | 'transcription+translation'     // NEW: Spanish listening
  | 'voice+translation';            // FUTURE: voice input
```

**PracticeItem changes:**
```typescript
interface PracticeItem {
  // ... existing fields ...
  promptType: PromptType;
  answerType: AnswerType;
  audioUrl?: string;           // TTS-generated or stored audio URL
  expectedTranscription?: string;  // Spanish sentence for validation
}
```

### Phase 3: UI Components

**New Components:**
- `AudioPlayer.tsx` - Audio playback with speed control
  - Play button (▶️)
  - Speed toggle (Normal ⇄ Slow)
  - Visual waveform or progress indicator
  - Replay counter display
  
- `TranscriptionInput.tsx` - Dual text input for Spanish + English
  - Spanish transcription field (what they heard)
  - English translation field (what it means)
  - Voice input button (future enhancement)
  - Clear visual separation between fields

**Updated Components:**
- `ExercisePrompt.tsx` - Handle `audio` and `audio+text` prompt types
- `AnswerInput.tsx` - Handle `transcription+translation` answer type
- `ExerciseFeedback.tsx` - Show both transcription and translation validation

### Phase 4: Exercise Generation

**Lesson Generation:**
- Add `listening` content type to `ContentType`
- Generate sentences optimized for audio comprehension
- Ensure natural spoken Spanish (not literary)
- Length: 5-12 words per sentence (2-4 seconds spoken)
- Include everyday contexts (restaurant, travel, work, etc.)

**OpenAI Prompt Updates:**
```typescript
// In generateLessonContent()
const listeningInstructions = `
Generate SPOKEN Spanish sentences for listening practice.
- Use natural, everyday LatAm Spanish (not formal/literary)
- Length: 5-12 words per sentence
- Clear pronunciation-friendly sentences
- Common vocabulary for intermediate learners
- Include context clues for meaning
`;
```

**Database Schema:**
```sql
-- No schema changes needed initially
-- Use existing vocabulary_items table
-- Set content_type = 'phrase' for listening exercises
-- Store audio URLs in metadata JSONB field if needed
```

### Phase 5: Validation Logic

**Transcription Validation:**
- Semantic comparison (not exact match)
- Allow minor spelling errors
- Case insensitive
- Ignore punctuation differences
- OpenAI-based validation similar to translation validation

**Translation Validation:**
- Existing semantic validation logic
- Accept synonyms and paraphrases
- Allow typos/minor errors

**Scoring:**
- Pass if BOTH transcription + translation are semantically correct
- Show specific feedback for each field
- Highlight which part needs improvement

---

## Minimal Vertical Slice (MVP)

**Scope:**
1. ✅ New `promptType: 'audio'` and `answerType: 'transcription+translation'`
2. ✅ Web Speech API integration for TTS playback
3. ✅ Speed control (normal/slow toggle)
4. ✅ Dual input fields (Spanish transcription + English translation)
5. ✅ Semantic validation for both fields
6. ✅ Basic AudioPlayer component
7. ✅ Updated ExercisePrompt/AnswerInput to handle new types

**Out of Scope for MVP:**
- Voice input (speak response)
- Stored audio files (use TTS only)
- Advanced audio controls (pause, seek)
- Waveform visualization
- Multiple voice options

---

## Testing Strategy

**Unit Tests:**
- `AudioPlayer.test.tsx` - Playback, speed control, state management
- `TranscriptionInput.test.tsx` - Field validation, input handling
- `PracticeItem` adapter tests - Handle new promptType/answerType

**Integration Tests:**
- Full listening exercise flow (hear → write → validate → feedback)
- Speed toggle functionality
- Dual validation (transcription + translation)
- Error handling (TTS failure, network issues)

**Manual Testing:**
- Audio quality across browsers (Chrome, Safari, Firefox)
- LatAm Spanish voice availability
- Speed control naturalness (slow playback quality)
- Mobile audio playback (iOS/Android)

---

## Feature Flag

**Implementation:**
```typescript
// In feature flags config
export const FEATURES = {
  SPANISH_LISTENING: process.env.VITE_ENABLE_SPANISH_LISTENING === 'true'
};

// In lesson generator
{FEATURES.SPANISH_LISTENING && language === 'spanish' && (
  <ContentTypeOption value="listening">
    🎧 Listening Practice
  </ContentTypeOption>
)}
```

**Rollout Plan:**
1. Dev environment testing (flag ON)
2. Internal alpha testing (select users)
3. Beta release (all Spanish users)
4. GA release (remove flag, make default)

---

## Success Metrics

- Users complete listening exercises without errors
- Transcription accuracy > 80% on first attempt
- Translation accuracy > 90% on first attempt
- Audio playback works across browsers (95%+ success rate)
- Speed control used by 30%+ of users
- User feedback positive on audio quality

---

## Future Enhancements (Post-MVP)

1. **Voice Input** - Speak response instead of typing
   - Use Web Speech API for recognition
   - Pronunciation scoring
   - Accent detection

2. **Audio Library** - Pre-recorded native speaker audio
   - Higher quality than TTS
   - Regional accent variety
   - Professional recordings

3. **Conversation Mode** - Multi-turn dialog practice
   - Listen to question → speak/write answer
   - Back-and-forth conversation flow

4. **Advanced Controls** - Pause, seek, replay segment
   - Sentence-level replay
   - Loop difficult sections

5. **Subtitles Toggle** - Show/hide text while listening
   - Learning mode (text visible)
   - Challenge mode (audio only)

---

## Dependencies

- Web Speech API browser support (check `window.speechSynthesis`)
- OpenAI API for semantic validation
- Existing validation infrastructure (reusable)
- PracticeItem domain abstraction (PR-2)

---

## Risk Mitigation

**Risk: Web Speech API voice quality poor**
- Mitigation: Fallback to OpenAI TTS API
- Cost: ~$0.015 per 1000 characters

**Risk: Browser compatibility issues**
- Mitigation: Feature detection + graceful fallback
- Show text-based exercise if audio fails

**Risk: Mobile audio playback restrictions**
- Mitigation: Require user interaction to start playback
- Test on iOS (strict autoplay policies)

**Risk: Slow playback sounds unnatural**
- Mitigation: Test multiple rate values (0.5-0.7)
- Allow users to adjust speed slider

---

## Implementation Checklist

### Phase 1: Foundation
- [ ] Add `promptType: 'audio'` to PracticeItem type
- [ ] Add `answerType: 'transcription+translation'` to PracticeItem type
- [ ] Create `AudioPlayer` component with speed control
- [ ] Integrate Web Speech API for TTS playback
- [ ] Add feature flag `VITE_ENABLE_SPANISH_LISTENING`

### Phase 2: UI Components
- [ ] Create `TranscriptionInput` component (dual fields)
- [ ] Update `ExercisePrompt` to handle audio prompts
- [ ] Update `AnswerInput` to handle transcription+translation
- [ ] Add speed toggle UI (Normal ⇄ Slow)

### Phase 3: Validation
- [ ] Extend semantic validation to handle transcription
- [ ] Implement dual validation (both fields must pass)
- [ ] Add specific error messages per field
- [ ] Update `ExerciseFeedback` to show both results

### Phase 4: Exercise Generation
- [ ] Add listening prompt to lesson generator
- [ ] Update OpenAI prompts for audio-optimized sentences
- [ ] Test sentence generation (5-12 words, natural spoken Spanish)

### Phase 5: Testing
- [ ] Unit tests for AudioPlayer component
- [ ] Unit tests for TranscriptionInput component
- [ ] Integration tests for listening exercise flow
- [ ] Manual testing across browsers (Chrome, Safari, Firefox)
- [ ] Mobile testing (iOS, Android)

### Phase 6: Documentation
- [ ] Update README with listening exercise feature
- [ ] Update ARCHITECTURE with audio system design
- [ ] Add user guide for listening exercises
- [ ] Document TTS provider comparison

---

## Notes

- Keep listening exercises **Spanish-only** initially (Arabic voice TTS quality needs evaluation)
- Prioritize **LatAm Spanish** (es-MX, es-AR) over Spain Spanish
- **No transliteration** for Spanish (Latin script doesn't need it)
- **No Hebrew cognates** (Spanish is Romance, not Semitic)
- Focus on **comprehension** over pronunciation (scoring based on understanding, not accent)

---

**Created:** January 11, 2026  
**Author:** Cascade AI  
**Related:** PR-4 (Interactive Text Selection), PR-2 (PracticeItem Domain)
