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
  return (
    <div
      className="flex flex-col rounded-xl border-2 transition-all duration-300 overflow-hidden bg-white shadow-xl -translate-y-1"
      style={{
        borderColor: isSelected ? primaryAccent : '#f1f5f9',
      }}
    >
      {/* Accordion Header Bar */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
        style={{
          backgroundColor: isSelected ? primaryTint : '#ffffff',
        }}
        onClick={() => onToggleExpand(id)}
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
                borderColor: isSelected ? primaryAccent : '#cbd5e1',
                backgroundColor: isSelected ? primaryAccent : 'transparent',
              }}
            >
              {multiSelect && isSelected && <Check className="w-3 h-3 text-white" />}
              {!multiSelect && isSelected && <div className="w-2 h-2 rounded-full bg-white"></div>}
            </div>
          </button>
          <div className="font-semibold tracking-wide text-slate-800 text-sm">
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
          className="border-t border-slate-200 bg-slate-50 relative animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <CodeEditor code={code} primaryAccent={primaryAccent} size="mini" />
        </div>
      )}
    </div>
  );
}
