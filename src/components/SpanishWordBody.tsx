import { useState } from 'react';
import type { SpanishWordData } from '../types/word';
import { SaveDecisionPanel, type SaveDecision } from './SaveDecisionPanel';

/**
 * Spanish example sentence structure
 */
export interface SpanishExampleSentence {
  spanish_latam: string;
  spanish_spain?: string;
  english: string;
  explanation?: string;
}

/**
 * Memory aid structure
 */
export interface MemoryAid {
  note?: string;
  imageUrl?: string;
}

/**
 * Props for SpanishWordBody component
 */
interface SpanishWordBodyProps {
  word: SpanishWordData;
  size?: 'compact' | 'normal' | 'large';
  showExampleSentences?: boolean;
  showSaveOption?: boolean;
  dialectPreference?: 'latam' | 'spain';
  
  // State (for already-saved words)
  isSaved?: boolean;
  savedStatus?: 'active' | 'learned';
  savedMemoryAid?: MemoryAid;
  
  // Callbacks
  onSave?: (decision: SaveDecision, memoryAid?: MemoryAid) => void;
  onSaveSentence?: (sentence: SpanishExampleSentence) => void;
  isSentenceSaved?: (sentenceText: string) => boolean;
}

/**
 * Font size mappings for different display sizes
 */
const FONT_SIZES = {
  compact: {
    primary: 'text-2xl',
    translation: 'text-sm',
    secondary: 'text-sm',
  },
  normal: {
    primary: 'text-4xl',
    translation: 'text-lg',
    secondary: 'text-base',
  },
  large: {
    primary: 'text-5xl',
    translation: 'text-xl',
    secondary: 'text-lg',
  },
};

/**
 * SpanishWordBody - Spanish-specific word rendering
 * 
 * Handles:
 * - LatAm/Spain dialect variants
 * - Usage notes and register
 * - Memory aids (mnemonic + visual cue)
 * - Example sentences with dialect variants
 * - Save controls
 */
export function SpanishWordBody({
  word,
  size = 'normal',
  showExampleSentences = false,
  showSaveOption = false,
  dialectPreference = 'latam',
  onSave,
  onSaveSentence,
  isSentenceSaved,
  isSaved = false,
  savedStatus,
  savedMemoryAid,
}: SpanishWordBodyProps) {
  const fonts = FONT_SIZES[size];
  
  // State for expanded sections
  const [exampleSentencesExpanded, setExampleSentencesExpanded] = useState(false);
  
  // Determine primary form based on dialect preference
  const primarySpanish = dialectPreference === 'spain' && word.spanish_spain
    ? word.spanish_spain
    : word.spanish_latam;
  
  const secondarySpanish = dialectPreference === 'spain'
    ? word.spanish_latam
    : word.spanish_spain;

  return (
    <div className="space-y-3">
      {/* Main word display */}
      <div className="space-y-4">
        {/* Spanish word - LARGE and CENTERED */}
        <div className="text-center">
          <div className={`${fonts.primary} font-semibold text-white leading-tight`}>
            {primarySpanish}
          </div>
        </div>
        
        {/* Translation */}
        <div className="text-center space-y-2">
          <div className={`${fonts.translation} text-white/90 font-medium`}>
            {word.translation}
          </div>
          
          {/* Pronunciation (if available) */}
          {word.pronunciation && (
            <div className="text-amber-400/80">
              <span className="text-amber-400/60 text-xs font-semibold">Pronunciation</span>{' '}
              <span className={fonts.secondary}>/{word.pronunciation}/</span>
            </div>
          )}
          
          {/* Dialect variant */}
          {secondarySpanish && secondarySpanish !== primarySpanish && (
            <div className="text-white/40 text-sm">
              <span className="text-white/30 text-xs font-semibold">
                {dialectPreference === 'spain' ? '🌎 LatAm' : '🇪🇸 Spain'}
              </span>{' '}
              <span>{secondarySpanish}</span>
            </div>
          )}
        </div>
        
        {/* Part of speech badge */}
        {word.partOfSpeech && (
          <div className="text-center">
            <span className="inline-block px-3 py-1 bg-white/10 text-white/60 text-sm rounded-full">
              {word.partOfSpeech}
            </span>
          </div>
        )}
      </div>
      
      {/* Word Context - Usage, Register, Notes */}
      {word.wordContext && (
        <div className="glass-card p-3">
          <div className="text-orange-400/70 text-xs font-bold uppercase tracking-wider mb-3">
            💡 Usage & Context
          </div>
          <div className="space-y-3">
            {/* Usage notes */}
            {word.wordContext.usage_notes && (
              <div className="bg-white/5 rounded-lg p-2.5">
                <div className="text-orange-300/60 text-xs font-semibold mb-1">Common Usage</div>
                <div className="text-sm text-white/80 leading-relaxed">
                  {word.wordContext.usage_notes}
                </div>
              </div>
            )}
            
            {/* Register */}
            {word.wordContext.register && (
              <div className="bg-white/5 rounded-lg p-2.5">
                <div className="text-amber-300/60 text-xs font-semibold mb-1">Register</div>
                <div className="text-sm text-white/80">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                    word.wordContext.register === 'formal' ? 'bg-blue-500/20 text-blue-300' :
                    word.wordContext.register === 'informal' ? 'bg-green-500/20 text-green-300' :
                    word.wordContext.register === 'slang' ? 'bg-purple-500/20 text-purple-300' :
                    'bg-white/10 text-white/60'
                  }`}>
                    {word.wordContext.register}
                  </span>
                </div>
              </div>
            )}
            
            {/* LatAm notes */}
            {word.wordContext.latam_notes && (
              <div className="bg-white/5 rounded-lg p-2.5">
                <div className="text-teal-300/60 text-xs font-semibold mb-1">🌎 Latin America</div>
                <div className="text-sm text-white/80 leading-relaxed">
                  {word.wordContext.latam_notes}
                </div>
              </div>
            )}
            
            {/* Spain notes */}
            {word.wordContext.spain_notes && (
              <div className="bg-white/5 rounded-lg p-2.5">
                <div className="text-red-300/60 text-xs font-semibold mb-1">🇪🇸 Spain</div>
                <div className="text-sm text-white/80 leading-relaxed">
                  {word.wordContext.spain_notes}
                </div>
              </div>
            )}
            
            {/* Etymology */}
            {word.wordContext.etymology && (
              <div className="bg-purple-500/10 rounded-lg p-2.5 border border-purple-500/20">
                <div className="text-purple-300/60 text-xs font-semibold mb-1">📚 Etymology</div>
                <div className="text-sm text-purple-200/80 leading-relaxed italic">
                  {word.wordContext.etymology}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Memory Aid */}
      {word.memoryAid && (word.memoryAid.mnemonic || word.memoryAid.visual_cue) && (
        <div className="glass-card p-3">
          <div className="text-pink-400/70 text-xs font-bold uppercase tracking-wider mb-3">
            🎨 Memory Aid
          </div>
          <div className="space-y-2">
            {word.memoryAid.mnemonic && (
              <div className="bg-pink-500/10 rounded-lg p-2.5">
                <div className="text-pink-300/60 text-xs font-semibold mb-1">Mnemonic</div>
                <div className="text-sm text-white/80">{word.memoryAid.mnemonic}</div>
              </div>
            )}
            {word.memoryAid.visual_cue && (
              <div className="bg-pink-500/10 rounded-lg p-2.5">
                <div className="text-pink-300/60 text-xs font-semibold mb-1">Visual Cue</div>
                <div className="text-sm text-white/80 italic">{word.memoryAid.visual_cue}</div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Saved memory aid (user-created) */}
      {savedMemoryAid && (savedMemoryAid.note || savedMemoryAid.imageUrl) && (
        <div className="glass-card p-3">
          <div className="text-green-400/70 text-xs font-bold uppercase tracking-wider mb-3">
            📝 Your Memory Aid
          </div>
          {savedMemoryAid.imageUrl && (
            <img 
              src={savedMemoryAid.imageUrl} 
              alt="Memory aid" 
              className="w-full rounded-lg mb-2"
            />
          )}
          {savedMemoryAid.note && (
            <div className="text-sm text-white/80">{savedMemoryAid.note}</div>
          )}
        </div>
      )}
      
      {/* Example sentences - Collapsible */}
      {showExampleSentences && word.exampleSentences && word.exampleSentences.length > 0 && (
        <div className="glass-card p-3">
          <button
            onClick={() => setExampleSentencesExpanded(!exampleSentencesExpanded)}
            className="w-full flex items-center justify-between text-left"
          >
            <div className="text-teal-400/70 text-xs font-bold uppercase tracking-wider">
              Example Sentences ({word.exampleSentences.length})
            </div>
            <svg
              className={`w-4 h-4 text-teal-400/70 transition-transform ${exampleSentencesExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {exampleSentencesExpanded && (
            <div className="space-y-2 mt-2">
              {word.exampleSentences.map((sentence, idx) => {
                const isSaved = isSentenceSaved?.(sentence.spanish_latam) ?? false;
                const primarySentence = dialectPreference === 'spain' && sentence.spanish_spain
                  ? sentence.spanish_spain
                  : sentence.spanish_latam;
                
                return (
                  <div key={idx} className="bg-white/5 rounded-xl p-3">
                    {/* Primary dialect sentence */}
                    <div className="text-lg font-medium text-white mb-2">
                      {primarySentence}
                    </div>
                    
                    {/* English translation */}
                    <div className="text-white/80 text-base mb-1">
                      {sentence.english}
                    </div>
                    
                    {/* Explanation if present */}
                    {sentence.explanation && (
                      <div className="text-xs text-purple-300/70 italic mt-2">
                        💡 {sentence.explanation}
                      </div>
                    )}
                    
                    {/* Save button */}
                    {onSaveSentence && (
                      <button
                        onClick={() => onSaveSentence(sentence)}
                        disabled={isSaved}
                        className={`w-full mt-2 py-2 rounded-lg text-sm font-medium transition-all duration-100 ${
                          isSaved
                            ? 'bg-green-500/20 text-green-400 cursor-default'
                            : 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 active:scale-95'
                        }`}
                      >
                        {isSaved ? '✓ Saved' : '💾 Save Sentence'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      
      {/* Save decision panel */}
      {showSaveOption && onSave && (
        <SaveDecisionPanel
          primaryText={word.spanish_latam}
          translation={word.translation}
          onDecision={onSave}
          alreadySaved={isSaved}
          currentStatus={savedStatus}
          existingMemoryAid={savedMemoryAid}
        />
      )}
    </div>
  );
}
