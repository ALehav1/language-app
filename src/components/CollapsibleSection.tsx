import { useState } from 'react';

/**
 * CollapsibleSection - Reusable expand/collapse UI
 * 
 * Used for:
 * - Example sentences
 * - Sentence lists in passages
 * - Word breakdown blocks
 * 
 * Default: collapsed
 */

interface CollapsibleSectionProps {
  title: string;
  count?: number;
  defaultExpanded?: boolean;
  children: React.ReactNode;
  titleClassName?: string;
  contentClassName?: string;
}

export function CollapsibleSection({
  title,
  count,
  defaultExpanded = false,
  children,
  titleClassName = 'text-teal-400/70 text-xs font-bold uppercase tracking-wider',
  contentClassName = 'space-y-3 mt-3',
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="glass-card p-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className={titleClassName}>
          {title}
          {count !== undefined && ` (${count})`}
        </div>
        <svg
          className={`w-4 h-4 text-teal-400/70 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isExpanded && (
        <div className={contentClassName}>
          {children}
        </div>
      )}
    </div>
  );
}
