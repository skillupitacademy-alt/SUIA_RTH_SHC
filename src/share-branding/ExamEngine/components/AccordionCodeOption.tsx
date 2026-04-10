'use client';

import { useState } from 'react';
import { CodeEditor } from './CodeEditor';
import { Check, ChevronDown, ChevronRight } from 'lucide-react';
import { ExamCardTheme } from './cardThemes';

interface AccordionCodeOptionProps {
  id: string;
  code: string;
  label?: string;
  primaryAccent: string;
  primaryTint: string;
  cardTheme: ExamCardTheme;
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
  cardTheme,
  isSelected,
  isExpanded,
  multiSelect = false,
  onSelect,
  onToggleExpand,
}: AccordionCodeOptionProps) {
  return (
    <div
      className="flex flex-col overflow-hidden rounded-xl border-2 shadow-xl transition-all duration-300 -translate-y-1"
      style={{
        borderColor: isSelected ? primaryAccent : cardTheme.answerOptionBorder,
        backgroundColor: cardTheme.answerOptionSurface,
      }}
    >
      {/* Accordion Header Bar */}
      <div 
        className="flex cursor-pointer items-center justify-between p-4 transition-colors"
        style={{
          backgroundColor: isSelected ? primaryTint : cardTheme.answerOptionSurface,
        }}
        onClick={() => onToggleExpand(id)}
        onMouseEnter={(e) => {
          if (!isSelected) e.currentTarget.style.backgroundColor = cardTheme.answerOptionHoverSurface;
        }}
        onMouseLeave={(e) => {
          if (!isSelected) e.currentTarget.style.backgroundColor = cardTheme.answerOptionSurface;
        }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(id);
            }}
            className="flex-shrink-0"
            aria-label="Select Option"
          >
            <div
              className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all"
              style={{
                borderColor: isSelected ? primaryAccent : cardTheme.answerIndicatorBorder,
                backgroundColor: isSelected ? primaryAccent : 'transparent',
              }}
            >
              {multiSelect && isSelected && <Check className="w-3 h-3 text-white" />}
              {!multiSelect && isSelected && <div className="w-2 h-2 rounded-full bg-white"></div>}
            </div>
          </button>
          <div className="text-sm font-semibold tracking-wide" style={{ color: cardTheme.answerOptionText }}>
            {label ? label : `Option ${id.toUpperCase()}`}
          </div>
        </div>

        <div 
          className="flex items-center gap-2 text-xs font-bold transition-transform hover:scale-105"
          style={{ color: primaryAccent }}
        >
          {isExpanded ? 'Hide Code' : 'View Code'}
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </div>
      </div>

      {/* Accordion Dropdown Body */}
      {isExpanded && (
        <div 
          className="relative animate-in border-t fade-in slide-in-from-top-2 duration-200"
          style={{ borderColor: cardTheme.codeBorder, backgroundColor: cardTheme.questionSurface }}
        >
          <CodeEditor code={code} primaryAccent={primaryAccent} size="mini" cardTheme={cardTheme} />
        </div>
      )}
    </div>
  );
}
