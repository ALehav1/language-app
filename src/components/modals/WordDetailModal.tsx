/**
 * WordDetailModal - Shows detailed word information when user clicks a word
 * 
 * Triggered by:
 * - Clicking a word in example sentences (ExerciseFeedback)
 * - Clicking a word in passage/dialog text
 * - Clicking a word inside a sentence detail modal
 * 
 * Features:
 * - Full word breakdown (pronunciations, letter breakdown, cognates)
 * - Example sentences
 * - Save to vocabulary with SaveDecisionPanel
 * - Reuses existing lookup/save infrastructure
 */

import { useState, useEffect } from 'react';
import { lookupWord, type LookupWordResult, isSpanishLookupResult, isArabicLookupResult } from '../../lib/openai';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSavedWords } from '../../hooks/useSavedWords';
import type { WordSelectionContext } from '../../types/selection';
import { mapSelectionToContentType } from '../../types/selection';
import { shouldShowHebrewCognate } from '../../domain/practice/hebrew/shouldShowHebrewCognate';

interface WordDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selection: WordSelectionContext;
}

export function WordDetailModal({ isOpen, onClose, selection }: WordDetailModalProps) {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LookupWordResult | null>(null);
  const [saved, setSaved] = useState(false);

  const { saveWord, isWordSaved } = useSavedWords({ language });

  // Narrow-once: derive typed views from result
  const spanish = result && isSpanishLookupResult(result) ? result : null;
  const arabic = result && isArabicLookupResult(result) ? result : null;

  useEffect(() => {
    if (!isOpen) return;

    const fetchWordDetails = async () => {
      setLoading(true);
      setError(null);
      setResult(null);
      setSaved(false);

      try {
        const wordData = await lookupWord(selection.selectedText, {
          language,
          dialect: selection.dialect,
        });
        setResult(wordData);

        // Check if already saved
        const primaryWord = isSpanishLookupResult(wordData)
          ? wordData.spanish_latam
          : wordData.arabic_word;
        if (isWordSaved(primaryWord)) {
          setSaved(true);
        }
      } catch (err) {
        console.error('[WordDetailModal] Lookup error:', err);
        setError(err instanceof Error ? err.message : 'Failed to look up word');
      } finally {
        setLoading(false);
      }
    };

    fetchWordDetails();
  }, [isOpen, selection.selectedText, isWordSaved]);

  const handleSave = async () => {
    if (!result) return;

    try {
      if (spanish) {
        await saveWord({
          word: spanish.spanish_latam,
          translation: spanish.translation_en,
          language: 'spanish',
          pronunciation_standard: spanish.pronunciation,
        });
      } else if (arabic) {
        await saveWord(
          {
            word: arabic.arabic_word,
            translation: arabic.translation,
            language: 'arabic',
            pronunciation_standard: arabic.pronunciation_standard,
            pronunciation_egyptian: arabic.pronunciation_egyptian,
            letter_breakdown: arabic.letter_breakdown,
            hebrew_cognate: arabic.hebrew_cognate,
            example_sentences: arabic.example_sentences,
          },
          {
            content_type: mapSelectionToContentType(selection.contentType),
            full_text: selection.parentSentence,
            full_transliteration: arabic.pronunciation_standard,
            full_translation: arabic.translation,
          }
        );
      }
      setSaved(true);
    } catch (err) {
      console.error('[WordDetailModal] Save error:', err);
    }
  };

  const handleClose = () => {
    setResult(null);
    setError(null);
    setSaved(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-md bg-surface-300 rounded-2xl max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h2 className="text-lg font-bold text-white">Word Details</h2>
          <button
            onClick={handleClose}
            className="text-white/50 hover:text-white min-w-[48px] min-h-[48px] flex items-center justify-center"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Context info */}
        <div className="px-4 pt-3 pb-2 bg-white/5 border-b border-white/10">
          <div className="text-xs text-white/40 uppercase tracking-wider mb-1">
            From {selection.sourceView}
          </div>
          <div className="text-sm text-white/60 italic" dir={selection.language === 'arabic' ? 'rtl' : 'ltr'}>
            "{selection.parentSentence}"
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <svg className="animate-spin h-8 w-8 text-white/40 mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
              </svg>
              <div className="text-white/60">Loading word details...</div>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="p-4 bg-red-500/20 text-red-300 text-center">
            {error}
          </div>
        )}

        {/* Result */}
        {result && !loading && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Word + Translation */}
            <div className="glass-card p-4 text-center">
              {spanish ? (
                <>
                  <div className="text-4xl font-bold text-white mb-2">
                    {spanish.spanish_latam}
                  </div>
                  {spanish.spanish_spain && spanish.spanish_spain !== spanish.spanish_latam && (
                    <div className="text-lg text-white/50 mb-1">
                      Spain: {spanish.spanish_spain}
                    </div>
                  )}
                  <div className="text-xl text-white/80 mb-2">
                    {spanish.translation_en}
                  </div>
                  {spanish.pronunciation && (
                    <div className="text-sm text-white/60 font-mono">
                      /{spanish.pronunciation}/
                    </div>
                  )}
                  {spanish.part_of_speech && (
                    <div className="text-xs text-white/40 mt-1">
                      {spanish.part_of_speech}
                    </div>
                  )}
                </>
              ) : arabic ? (
                <>
                  <div className="text-4xl font-bold text-white font-arabic mb-2" dir="rtl">
                    {arabic.arabic_word}
                  </div>
                  <div className="text-xl text-white/80 mb-4">
                    {arabic.translation}
                  </div>
                  {/* Pronunciations */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="text-white/40 text-xs mb-1">Standard (MSA)</div>
                      <div className="text-white font-medium">{arabic.pronunciation_standard}</div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="text-white/40 text-xs mb-1">Egyptian</div>
                      <div className="text-white font-medium">{arabic.pronunciation_egyptian}</div>
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            {/* Hebrew Cognate — Arabic only */}
            {arabic && shouldShowHebrewCognate({
              language: selection.language,
              contentType: selection.contentType,
              hebrewCandidate: arabic.hebrew_cognate,
              selectedText: selection.selectedText
            }) && arabic.hebrew_cognate && (
              <div className="glass-card p-4 border-l-4 border-l-blue-500/50">
                <div className="text-blue-300 text-xs font-bold uppercase tracking-wider mb-2">
                  Hebrew Connection
                </div>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-2xl font-hebrew text-white mb-1">
                      {arabic.hebrew_cognate.root}
                    </div>
                    <div className="text-sm text-white/60">
                      {arabic.hebrew_cognate.meaning}
                    </div>
                  </div>
                  {arabic.hebrew_cognate.notes && (
                    <div className="text-xs text-white/40 max-w-[150px] text-right italic">
                      "{arabic.hebrew_cognate.notes}"
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Example Sentences — Spanish */}
            {spanish?.example_sentences && spanish.example_sentences.length > 0 && (
              <div className="glass-card p-4">
                <div className="text-purple-400/70 text-xs font-bold uppercase tracking-wider mb-3">
                  Example Sentences
                </div>
                <div className="space-y-3">
                  {spanish.example_sentences.map((sentence, idx) => (
                    <div key={idx} className="bg-white/5 rounded-xl p-3 space-y-1">
                      <div className="text-xl text-white">
                        {sentence.spanish_latam}
                      </div>
                      {sentence.spanish_spain && (
                        <div className="text-sm text-white/50">
                          Spain: {sentence.spanish_spain}
                        </div>
                      )}
                      <div className="text-white/80">
                        {sentence.english}
                      </div>
                      {sentence.explanation && (
                        <div className="text-xs text-white/40 border-t border-white/10 pt-2 mt-1">
                          {sentence.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Letter Breakdown — Arabic only */}
            {arabic?.letter_breakdown && arabic.letter_breakdown.length > 0 && (
              <div className="glass-card p-4">
                <div className="text-teal-400/70 text-xs font-bold uppercase tracking-wider mb-3">
                  Letter Breakdown
                </div>
                <div className="flex flex-wrap justify-center gap-2" dir="rtl">
                  {arabic.letter_breakdown.map((l, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-1 p-2 bg-white/5 rounded-xl min-w-[55px]">
                      <span className="text-2xl font-arabic text-white">{l.letter}</span>
                      <span className="text-[9px] text-white/50 text-center leading-tight">{l.name}</span>
                      <span className="text-xs text-teal-400/80 font-mono">/{l.sound}/</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saved}
              className={`w-full py-4 min-h-[48px] font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors ${
                saved
                  ? 'bg-green-500/20 text-green-300 cursor-default'
                  : 'btn-primary'
              }`}
            >
              {saved ? (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                  </svg>
                  Saved to My Vocabulary
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  Save to My Vocabulary
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
