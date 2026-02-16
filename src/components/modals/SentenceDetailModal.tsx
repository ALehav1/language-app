/**
 * SentenceDetailModal - Shows detailed sentence view when user clicks a sentence
 * 
 * Triggered by:
 * - Clicking a sentence in passage/dialog content
 * - Clicking a sentence in multi-sentence displays
 * 
 * Features:
 * - Full sentence display with both dialects
 * - Words within sentence are clickable → opens WordDetailModal
 * - Save entire sentence to vocabulary
 * - RTL support for Arabic
 */

import { useState } from 'react';
import { useSavedWords } from '../../hooks/useSavedWords';
import type { SentenceSelectionContext, WordSelectionContext } from '../../types/selection';
import { ClickableText } from '../text/ClickableText';
import { WordDetailModal } from './WordDetailModal';
import { mapSelectionToContentType } from '../../types/selection';

interface SentenceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  selection: SentenceSelectionContext;
}

export function SentenceDetailModal({ isOpen, onClose, selection }: SentenceDetailModalProps) {
  const [saved, setSaved] = useState(false);
  const [wordSelection, setWordSelection] = useState<WordSelectionContext | null>(null);
  const [showWordModal, setShowWordModal] = useState(false);

  const { saveWord } = useSavedWords({ language: selection.language });

  const handleSaveSentence = async () => {
    try {
      // Save sentence as a word entry (sentences go into saved_words table)
      await saveWord(
        {
          word: selection.selectedSentence,
          translation: '', // Will be populated by lookup if needed
          language: selection.language,
          pronunciation_standard: '',
          pronunciation_egyptian: '',
        },
        {
          content_type: mapSelectionToContentType(selection.contentType),
          full_text: selection.selectedSentence,
          full_transliteration: '',
          full_translation: '',
        }
      );
      setSaved(true);
    } catch (err) {
      console.error('[SentenceDetailModal] Save error:', err);
    }
  };

  const handleWordClick = (context: WordSelectionContext) => {
    setWordSelection(context);
    setShowWordModal(true);
  };

  const handleClose = () => {
    setSaved(false);
    setWordSelection(null);
    setShowWordModal(false);
    onClose();
  };

  const handleWordModalClose = () => {
    setShowWordModal(false);
    setWordSelection(null);
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
        onClick={handleClose}
      >
        <div
          className="w-full max-w-2xl bg-surface-300 rounded-2xl max-h-[85vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h2 className="text-lg font-bold text-white">Sentence Details</h2>
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
              From {selection.sourceView} • {selection.contentType}
            </div>
            {selection.parentPassage && (
              <div className="text-xs text-white/50 italic">
                Part of larger passage
              </div>
            )}
          </div>

          {/* Sentence Display */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Main sentence card */}
            <div className="glass-card p-5">
              <div className="text-purple-400/70 text-xs font-bold uppercase tracking-wider mb-3">
                Selected Sentence
              </div>
              <div
                className={`text-2xl font-arabic text-white leading-relaxed mb-4 ${
                  selection.language === 'arabic' ? 'text-right' : 'text-left'
                }`}
                dir={selection.language === 'arabic' ? 'rtl' : 'ltr'}
              >
                {selection.selectedSentence}
              </div>

              {/* Tap words hint */}
              <div className="text-xs text-white/40 bg-white/5 rounded-lg p-3 flex items-center gap-2">
                <span className="text-lg">👆</span>
                <span>Tap any word below to see its details and save it</span>
              </div>
            </div>

            {/* Clickable words */}
            <div className="glass-card p-5">
              <div className="text-amber-400/70 text-xs font-bold uppercase tracking-wider mb-3">
                Word Breakdown
              </div>
              <div className="text-xl leading-loose">
                <ClickableText
                  text={selection.selectedSentence}
                  language={selection.language}
                  dir={selection.language === 'arabic' ? 'rtl' : 'ltr'}
                  mode="word"
                  sourceView={selection.sourceView}
                  dialect={selection.dialect}
                  contentType={selection.contentType}
                  onWordClick={handleWordClick}
                  className="font-arabic"
                />
              </div>
            </div>

            {/* Save sentence button */}
            <button
              onClick={handleSaveSentence}
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
                  Sentence Saved
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  Save This Sentence
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Nested Word Detail Modal */}
      {wordSelection && (
        <WordDetailModal
          isOpen={showWordModal}
          onClose={handleWordModalClose}
          selection={wordSelection}
        />
      )}
    </>
  );
}
