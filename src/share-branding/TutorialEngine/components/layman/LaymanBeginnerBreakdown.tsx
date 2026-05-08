import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';

interface Step {
  id: string;
  stepTitle: string;
  stepExplanation: string;
  microLearningChunk: string;
}

interface LaymanBeginnerBreakdownProps {
  title: string;
  steps: Step[];
}

/**
 * Layman Beginner Breakdown Component
 * Renderer: accordion
 * Layout Template: expandable_sections
 * Purpose: Step-by-step progressive beginner breakdown
 * 
 * Based on AllSectionTutorialPageUIUXDetailed.json specification
 */
export function LaymanBeginnerBreakdown({ title, steps }: LaymanBeginnerBreakdownProps) {
  const brand = useBrand();
  const [openStepId, setOpenStepId] = useState<string>(steps[0]?.id || '');

  const toggleStep = (id: string) => {
    setOpenStepId(openStepId === id ? '' : id);
  };

  return (
    <div className="w-full mb-8">
      {/* Title */}
      <h3 className="text-2xl font-bold text-slate-950 mb-6">{title}</h3>

      {/* Accordion */}
      <div className="space-y-3">
        {steps.map((step, index) => {
          const isOpen = openStepId === step.id;
          const stepNumber = index + 1;

          return (
            <div
              key={step.id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all duration-300"
            >
              <button
                onClick={() => toggleStep(step.id)}
                className="w-full flex items-center gap-4 p-5 text-left hover:bg-gray-50 transition-colors"
                aria-expanded={isOpen}
                aria-controls={`step-content-${step.id}`}
              >
                {/* Step Number Icon */}
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 font-bold text-white"
                  style={{ backgroundColor: brand.primaryColor }}
                >
                  {stepNumber}
                </div>

                {/* Step Title */}
                <h4 className="flex-1 text-base font-bold text-slate-950 pr-4">
                  {step.stepTitle}
                </h4>

                {/* Chevron */}
                <Icons.ChevronDown
                  size={20}
                  className={`shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                  style={{ color: brand.primaryColor }}
                  aria-hidden="true"
                />
              </button>

              {isOpen && (
                <div
                  id={`step-content-${step.id}`}
                  className="px-5 pb-5 pt-2 border-t border-gray-100 space-y-4"
                >
                  {/* Step Explanation */}
                  <p className="text-sm font-medium text-slate-700 leading-relaxed">
                    {step.stepExplanation}
                  </p>

                  {/* Micro Learning Chunk */}
                  <div
                    className="p-4 rounded-lg border-l-4"
                    style={{
                      backgroundColor: `${brand.primaryColor}08`,
                      borderLeftColor: brand.primaryColor
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <Icons.Lightbulb
                        size={18}
                        className="shrink-0 mt-0.5"
                        style={{ color: brand.primaryColorDark }}
                        aria-hidden="true"
                      />
                      <p className="text-sm font-bold text-slate-800">
                        {step.microLearningChunk}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
