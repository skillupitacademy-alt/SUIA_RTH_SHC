import { useState } from 'react';
import { CodeEditor } from './CodeEditor';
import { AccordionCodeOption } from './AccordionCodeOption';
import { Check } from 'lucide-react';

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
  const [expandedOption, setExpandedOption] = useState<string | null>(null);

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
    // Only one can be expanded at a time
    setExpandedOption(prev => prev === id ? null : id);
  };

  // Check if we should use accordion mode
  // Use accordion if: options have code AND at least one code block has > 7 lines
  const useAccordionMode = options.some(opt => {
    if (!opt.code) return false;
    const lineCount = opt.code.split('\n').length;
    return lineCount > 7;
  });

  // If using accordion mode for code-heavy options
  if (useAccordionMode) {
    return (
      <div className="bg-[#fdfdfe] p-8 h-full overflow-auto">
        <div className="max-w-3xl">
          <div className="text-xs uppercase tracking-wider text-slate-400 mb-6 font-semibold">
            {multiSelect ? 'SELECT ALL THAT APPLY' : 'DECISION SPACE'}
          </div>
          <div className="space-y-4">
            {options.map((option) => (
              <AccordionCodeOption
                key={option.id}
                id={option.id}
                code={option.code || option.text || ''}
                label={option.text && option.code ? option.text : undefined}
                primaryAccent={primaryAccent}
                primaryTint={primaryTint}
                isSelected={selected.includes(option.id)}
                isExpanded={expandedOption === option.id}
                multiSelect={multiSelect}
                onSelect={handleSelect}
                onToggleExpand={handleToggleExpand}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Original mode for simple text or short code options
  return (
    <div className="bg-[#fdfdfe] p-8 h-full overflow-auto">
      <div className="max-w-3xl">
        <div className="text-xs uppercase tracking-wider text-slate-400 mb-6 font-semibold">
          {multiSelect ? 'SELECT ALL THAT APPLY' : 'DECISION SPACE'}
        </div>
        <div className="space-y-4">
          {options.map((option) => {
            const isSelected = selected.includes(option.id);
            return (
              <button
                key={option.id}
                onClick={() => handleSelect(option.id)}
                className="w-full text-left p-5 rounded-lg border-2 transition-all duration-200 hover:shadow-md"
                style={{
                  borderColor: isSelected ? primaryAccent : '#e2e8f0',
                  backgroundColor: isSelected ? primaryTint : '#ffffff',
                }}
              >
                <div className="flex items-start gap-4">
                  {/* Radio/Checkbox indicator */}
                  <div 
                    className="flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center mt-1"
                    style={{
                      borderColor: isSelected ? primaryAccent : '#cbd5e1',
                      backgroundColor: isSelected ? primaryAccent : 'transparent',
                    }}
                  >
                    {multiSelect && isSelected && (
                      <Check className="w-3 h-3 text-white" />
                    )}
                    {!multiSelect && isSelected && (
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {option.text && (
                      <p className="text-base text-slate-800">{option.text}</p>
                    )}
                    {option.code && (
                      <div className="mt-2">
                        <CodeEditor code={option.code} primaryAccent={primaryAccent} size="mini" />
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}