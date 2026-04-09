'use client';

import { useState } from 'react';
import { CodeEditor } from './CodeEditor';
import { Check, ChevronDown, ChevronRight } from 'lucide-react';

interface AccordionCodeOptionProps {
  id: string;
  code: string;
  label?: string;
  primaryAccent: string;
  primaryTint: string;
  isSelected: boolean;
  isExpanded: boolean;
  multiSelect?: boolean;
  onSelect: (id: string) => void;
  onToggleExpand: (id: string) => void;
}

export function AccordionCodeOption({
  id,
  code,
  label,
  primaryAccent,
  primaryTint,
  isSelected,
  isExpanded,
  multiSelect = false,
  onSelect,
  onToggleExpand,
}: AccordionCodeOptionProps) {
  // Show preview (first 3 lines) when collapsed
  const lines = code.split('\n');
  const previewLines = lines.slice(0, 3).join('\n');
  const hasMore = lines.length > 3;

  return (
    <div
      className="rounded-lg border-2 transition-all duration-200 overflow-hidden"
      style={{
        borderColor: isSelected ? primaryAccent : '#e2e8f0',
        backgroundColor: isSelected ? primaryTint : '#ffffff',
      }}
    >
      {/* Header - Always visible, clickable for selection */}
      <div className="flex items-start gap-3 p-4">
        {/* Radio/Checkbox indicator */}
        <button
          onClick={() => onSelect(id)}
          className="flex-shrink-0 mt-1"
        >
          <div
            className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
            style={{
              borderColor: isSelected ? primaryAccent : '#cbd5e1',
              backgroundColor: isSelected ? primaryAccent : 'transparent',
            }}
          >
            {multiSelect && isSelected && <Check className="w-3 h-3 text-white" />}
            {!multiSelect && isSelected && <div className="w-2 h-2 rounded-full bg-white"></div>}
          </div>
        </button>

        {/* Content area */}
        <div className="flex-1 min-w-0">
          {label && (
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              {label}
            </div>
          )}

          {/* Code preview or full code */}
          <div className="relative">
            {isExpanded ? (
              <CodeEditor code={code} primaryAccent={primaryAccent} size="mini" />
            ) : (
              <div className="bg-slate-50 rounded-lg border-l-4 border border-slate-200 relative" style={{ borderLeftColor: primaryAccent }}>
                <pre className="p-4 text-sm font-mono text-slate-900 leading-relaxed opacity-60">
                  <code>{previewLines}</code>
                </pre>
                {hasMore && (
                  <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-slate-50 to-transparent"></div>
                )}
              </div>
            )}
          </div>

          {/* Expand/Collapse button */}
          <button
            onClick={() => onToggleExpand(id)}
            className="mt-3 flex items-center gap-2 text-sm font-medium hover:underline transition-colors"
            style={{ color: primaryAccent }}
          >
            {isExpanded ? (
              <>
                <ChevronDown className="w-4 h-4" />
                <span>Show Less</span>
              </>
            ) : (
              <>
                <ChevronRight className="w-4 h-4" />
                <span>View Full Code ({lines.length} lines)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
