/**
 * UI Tokens - Shared Tailwind class strings for consistent styling
 * 
 * P2-F: Theme + Typography System
 * 
 * Use these tokens instead of ad-hoc Tailwind classes to ensure
 * visual consistency across all surfaces:
 * - Lookup tiles
 * - Word/Sentence detail modals
 * - Vocabulary views
 * - Exercise feedback
 * - Example sentence tiles
 * 
 * Usage:
 * import { tokens } from '../styles/uiTokens';
 * <div className={tokens.tile}>...</div>
 */

export const tokens = {
  // --- CONTAINERS ---
  
  /** Glass-effect card - primary container for content */
  tile: 'bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl',
  
  /** Glass card with padding */
  tileWithPadding: 'bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4',
  
  /** Elevated tile (more prominent) */
  tileElevated: 'bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-lg',
  
  /** Inner section within a tile */
  tileSection: 'bg-white/5 rounded-lg p-3',
  
  // --- TEXT STYLES ---
  
  /** Primary heading (page titles) */
  heading: 'text-xl font-bold text-white',
  
  /** Section heading (within tiles) */
  sectionHeading: 'text-xs font-bold uppercase tracking-wider',
  
  /** Primary body text */
  bodyText: 'text-white text-base',
  
  /** Secondary/muted body text */
  mutedText: 'text-white/60 text-sm',
  
  /** Hint/subtle text */
  hintText: 'text-white/40 text-xs',
  
  /** Arabic text styling */
  arabicText: 'font-arabic text-white',
  
  /** Spanish text styling */
  spanishText: 'text-white font-semibold',
  
  // --- ACCENT COLORS ---
  
  /** Teal accent (Arabic primary, MSA) */
  accentTeal: 'text-teal-400',
  accentTealBg: 'bg-teal-500/20 border-teal-500/30 text-teal-300',
  
  /** Amber accent (Egyptian, Spanish primary) */
  accentAmber: 'text-amber-400',
  accentAmberBg: 'bg-amber-500/20 border-amber-500/30 text-amber-300',
  
  /** Purple accent (memory aids, explanations) */
  accentPurple: 'text-purple-400',
  accentPurpleBg: 'bg-purple-500/20 border-purple-500/30 text-purple-300',
  
  /** Orange accent (context, usage notes) */
  accentOrange: 'text-orange-400',
  accentOrangeBg: 'bg-orange-500/20 border-orange-500/30 text-orange-300',
  
  /** Pink accent (memory aids) */
  accentPink: 'text-pink-400',
  accentPinkBg: 'bg-pink-500/20 border-pink-500/30 text-pink-300',
  
  /** Red accent (Spain Spanish) */
  accentRed: 'text-red-400',
  accentRedBg: 'bg-red-500/20 border-red-500/30 text-red-300',
  
  /** Green accent (success states) */
  accentGreen: 'text-green-400',
  accentGreenBg: 'bg-green-500/20 border-green-500/30 text-green-300',
  
  /** Blue accent (archive, secondary actions) */
  accentBlue: 'text-blue-400',
  accentBlueBg: 'bg-blue-500/20 border-blue-500/30 text-blue-300',
  
  // --- BUTTONS ---
  
  /** Primary action button */
  btnPrimary: 'py-3 px-4 rounded-xl font-medium transition-all bg-gradient-to-r from-teal-500 to-teal-600 text-white hover:from-teal-400 hover:to-teal-500 active:scale-95',
  
  /** Secondary/ghost button */
  btnSecondary: 'py-2 px-4 rounded-lg font-medium transition-colors bg-white/10 text-white/70 hover:bg-white/20 hover:text-white',
  
  /** Danger button */
  btnDanger: 'py-2 px-4 rounded-lg font-medium transition-colors bg-red-500/20 text-red-300 hover:bg-red-500/30',
  
  /** Save/Practice button */
  btnPractice: 'py-3 px-4 rounded-lg font-medium transition-colors bg-purple-500/20 text-purple-300 hover:bg-purple-500/30',
  
  /** Archive button */
  btnArchive: 'py-3 px-4 rounded-lg font-medium transition-colors bg-blue-500/20 text-blue-300 hover:bg-blue-500/30',
  
  // --- CHIPS ---
  
  /** Word chip (Spanish inline display) */
  chip: 'inline-flex flex-col items-center px-3 py-2 rounded-lg transition-colors bg-white/10 hover:bg-amber-500/20 border border-white/10 hover:border-amber-500/30',
  
  /** Chip primary text */
  chipPrimary: 'text-white font-semibold text-base',
  
  /** Chip secondary text (gloss) */
  chipSecondary: 'text-white/60 text-xs',
  
  /** Status chip/badge */
  badge: 'inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium',
  
  /** Active/Practice status badge */
  badgeActive: 'bg-teal-500/20 text-teal-300',
  
  /** Learned/Archive status badge */
  badgeLearned: 'bg-amber-500/20 text-amber-300',
  
  // --- INPUTS ---
  
  /** Text input field */
  input: 'w-full px-4 py-3 bg-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20',
  
  /** Textarea */
  textarea: 'w-full px-4 py-3 bg-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 resize-none',
  
  // --- LAYOUT ---
  
  /** Sticky header */
  header: 'sticky top-0 z-40 bg-surface-300/95 backdrop-blur-sm border-b border-white/10',
  
  /** Content container with standard padding */
  container: 'p-4',
  
  /** Flex row with gap */
  flexRow: 'flex items-center gap-2',
  
  /** Flex column with gap */
  flexCol: 'flex flex-col gap-2',
  
  /** Space between items vertically */
  spaceY: 'space-y-3',
  
  // --- INTERACTIVE ---
  
  /** Clickable/tappable area */
  touchTarget: 'touch-btn cursor-pointer transition-all active:scale-95',
  
  /** Icon button */
  iconBtn: 'w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 text-white/70 hover:bg-white/20 hover:text-white transition-colors',
};

/**
 * Combine multiple token classes
 */
export function combineTokens(...classes: string[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Conditional token helper
 */
export function conditionalToken(condition: boolean, trueToken: string, falseToken: string = ''): string {
  return condition ? trueToken : falseToken;
}
