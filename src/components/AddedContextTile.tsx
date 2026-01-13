/**
 * AddedContextTile - Canonical component for displaying enrichment context
 * 
 * Works for: word, sentence, passage
 * 
 * Arabic:
 * - Root + meaning
 * - Morphology
 * - Dialect vs MSA usage
 * - Cultural notes
 * 
 * Spanish:
 * - Lemma / base form
 * - Conjugation (if verb)
 * - LatAm vs Spain usage
 * - Regional notes
 * 
 * Degrades gracefully when fields missing
 */

interface AddedContextTileProps {
  language: 'arabic' | 'spanish';
  context?: {
    // Arabic fields
    root?: string;
    root_meaning?: string;
    morphology?: string;
    egyptian_usage?: string;
    msa_comparison?: string;
    cultural_notes?: string;
    
    // Spanish fields
    lemma?: string;
    conjugation?: string;
    latin_america_usage?: string;
    spain_usage?: string;
    regional_notes?: string;
  };
}

export function AddedContextTile({ language, context }: AddedContextTileProps) {
  if (!context) return null;

  // Check if we have any content to display
  const hasArabicContent = context.root || context.egyptian_usage || context.msa_comparison || context.cultural_notes;
  const hasSpanishContent = context.lemma || context.conjugation || context.latin_america_usage || context.spain_usage || context.regional_notes;
  
  if (!hasArabicContent && !hasSpanishContent) return null;

  return (
    <div className="glass-card p-4 space-y-3">
      <div className="text-xs font-bold text-purple-400/70 uppercase tracking-wider">
        💡 Added Context
      </div>

      {language === 'arabic' && (
        <>
          {/* Root information */}
          {context.root && (
            <div>
              <div className="text-xs text-white/40 mb-1">Root</div>
              <div className="text-white font-arabic text-lg" dir="rtl">
                {context.root}
                {context.root_meaning && (
                  <span className="text-white/60 text-sm font-sans mr-2">
                    ({context.root_meaning})
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Morphology */}
          {context.morphology && (
            <div>
              <div className="text-xs text-white/40 mb-1">Morphology</div>
              <div className="text-white/80 text-sm">{context.morphology}</div>
            </div>
          )}

          {/* Dialect usage */}
          {context.egyptian_usage && (
            <div>
              <div className="text-xs text-amber-400/60 mb-1">🇪🇬 Egyptian Usage</div>
              <div className="text-white/80 text-sm">{context.egyptian_usage}</div>
            </div>
          )}

          {/* MSA comparison */}
          {context.msa_comparison && (
            <div>
              <div className="text-xs text-teal-400/60 mb-1">📖 MSA Comparison</div>
              <div className="text-white/80 text-sm">{context.msa_comparison}</div>
            </div>
          )}

          {/* Cultural notes */}
          {context.cultural_notes && (
            <div>
              <div className="text-xs text-purple-400/60 mb-1">🌍 Cultural Context</div>
              <div className="text-white/80 text-sm italic">{context.cultural_notes}</div>
            </div>
          )}
        </>
      )}

      {language === 'spanish' && (
        <>
          {/* Base form / lemma */}
          {context.lemma && (
            <div>
              <div className="text-xs text-white/40 mb-1">Base Form</div>
              <div className="text-white text-lg font-semibold">{context.lemma}</div>
            </div>
          )}

          {/* Conjugation */}
          {context.conjugation && (
            <div>
              <div className="text-xs text-white/40 mb-1">Conjugation</div>
              <div className="text-white/80 text-sm">{context.conjugation}</div>
            </div>
          )}

          {/* Latin America usage */}
          {context.latin_america_usage && (
            <div>
              <div className="text-xs text-amber-400/60 mb-1">🌎 Latin America</div>
              <div className="text-white/80 text-sm">{context.latin_america_usage}</div>
            </div>
          )}

          {/* Spain usage */}
          {context.spain_usage && (
            <div>
              <div className="text-xs text-teal-400/60 mb-1">🇪🇸 Spain</div>
              <div className="text-white/80 text-sm">{context.spain_usage}</div>
            </div>
          )}

          {/* Regional notes */}
          {context.regional_notes && (
            <div>
              <div className="text-xs text-purple-400/60 mb-1">🗺️ Regional Notes</div>
              <div className="text-white/80 text-sm italic">{context.regional_notes}</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
