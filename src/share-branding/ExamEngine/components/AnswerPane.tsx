'use client';

import { useState } from 'react';
import { AccordionCodeOption } from './AccordionCodeOption';
import { Check } from 'lucide-react';
import { MacOSDots } from './MacOSDots';

interface AnswerOption {
  id: string;
  text?: string;
  code?: string;
}

interface AnswerPaneProps {
  options: AnswerOption[];
  primaryAccent: string;
  primaryTint: string;
  multiSelect?: boolean;
}

export function AnswerPane({ options, primaryAccent, primaryTint, multiSelect = false }: AnswerPaneProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [expandedOption, setExpandedOption] = useState<string | null>(
    options.length > 0 && options.some(o => !!o.code) ? options[0].id : null
  );

  const handleSelect = (id: string) => {
    if (multiSelect) {
      setSelected(prev => 
        prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      );
    } else {
      setSelected([id]);
    }
  };

  const handleToggleExpand = (id: string) => {
    setExpandedOption(prev => prev === id ? null : id);
  };

  const useAccordionMode = options.some(opt => !!opt.code);

  return (
    <div className="flex flex-col h-full bg-white">
      <div 
        className="flex items-center justify-between px-4 py-3 shadow-md z-10"
        style={{ backgroundColor: primaryAccent }}
      >
        <MacOSDots />
        <div className="text-[10px] uppercase tracking-[0.2em] font-extrabold text-white">
          Decision Space
        </div>
      </div>

      {/* Pane Content */}
      <div className="flex-1 overflow-auto p-4 custom-scrollbar sm:p-6 lg:p-8">
        <div className="max-w-3xl">
          <div className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-600 sm:mb-6">
            {multiSelect ? 'SELECT ALL THAT APPLY' : 'SELECT THE BEST OPTION'}
          </div>

          {useAccordionMode ? (
            <div className="space-y-4">
              {options.map((option) => (
                <AccordionCodeOption
                  key={option.id}
                  id={option.id}
                  code={option.code || option.text || ''}
                  label={option.text && option.code ? option.text : undefined}
                  primaryAccent={primaryAccent}
                  primaryTint={primaryTint}
                  isExpanded={expandedOption === option.id}
                  onToggleExpand={() => handleToggleExpand(option.id)}
                  isSelected={selected.includes(option.id)}
                  onSelect={() => handleSelect(option.id)}
                />
              ))}
            </div>
          ) : (
            <div className="flex min-h-0 flex-col gap-3 py-2 sm:gap-4 sm:py-4">
              {options.map((option) => {
                const isSelected = selected.includes(option.id);
                return (
                  <button
                    key={option.id}
                    onClick={() => handleSelect(option.id)}
                    className={`group flex w-full items-start justify-between gap-3 rounded-xl border-2 p-4 text-left shadow-xl transition-all sm:p-5 lg:p-6 ${
                      isSelected 
                        ? 'border-transparent translate-x-1' 
                        : 'border-slate-100 hover:border-slate-300'
                    }`}
                    style={{ 
                      backgroundColor: isSelected ? primaryTint : 'white',
                      borderColor: isSelected ? primaryAccent : undefined 
                    }}
                  >
                    <span className={`min-w-0 flex-1 text-sm leading-6 transition-colors sm:text-base lg:text-lg ${isSelected ? 'font-bold' : 'text-slate-700'}`} style={{ color: isSelected ? primaryAccent : undefined }}>
                      {option.text}
                    </span>
                    <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                      isSelected ? 'bg-white border-transparent' : 'border-slate-200 group-hover:border-slate-300'
                    }`}>
                      {isSelected && <Check className="w-4 h-4" style={{ color: primaryAccent }} />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
