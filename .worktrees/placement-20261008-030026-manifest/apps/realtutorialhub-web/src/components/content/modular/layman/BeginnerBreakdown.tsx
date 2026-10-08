'use client';

import React, { useMemo, useState } from 'react';
import { ChevronRight, Lightbulb } from 'lucide-react';

interface BeginnerBreakdownProps {
  data: {
    title: string;
    steps: Array<{
      id: string;
      stepTitle: string;
      stepExplanation: string;
      microLearningChunk: string;
    }>;
  };
  themeColor: string;
  sectionNumber?: number;
}

export function BeginnerBreakdown({ data, themeColor, sectionNumber = 5 }: BeginnerBreakdownProps) {
  const [activeStepId, setActiveStepId] = useState<string>(data.steps[0]?.id ?? '');

  const activeStep = useMemo(
    () => data.steps.find((step) => step.id === activeStepId) ?? data.steps[0],
    [activeStepId, data.steps]
  );

  if (!activeStep) return null;

  return (
    <section className="rounded-[28px] border border-blue-200 bg-white p-7 shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-500 text-lg font-black text-white">
          {sectionNumber}
        </div>
        <h3 className="text-3xl font-black tracking-tight text-slate-950">{data.title}</h3>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px,minmax(0,1fr)] lg:items-start">
        <div className="space-y-3">
          {data.steps.map((step) => {
            const isActive = step.id === activeStep.id;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => setActiveStepId(step.id)}
                className={`flex w-full items-center justify-between rounded-2xl border px-4 py-4 text-left transition ${
                  isActive ? 'border-blue-200 bg-blue-50 shadow-sm' : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
                aria-pressed={isActive}
              >
                <span className="text-sm font-bold text-slate-900">{step.stepTitle}</span>
                <ChevronRight size={18} className={`shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
              </button>
            );
          })}
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-6">
          <p className="text-base font-semibold leading-8 text-slate-900">{activeStep.stepExplanation}</p>

          <div className="mt-6 rounded-2xl border bg-white px-5 py-4" style={{ borderColor: `${themeColor}30` }}>
            <div className="flex items-start gap-3">
              <Lightbulb className="mt-0.5 shrink-0" size={18} style={{ color: themeColor }} />
              <div>
                <div className="text-xs font-black uppercase tracking-[0.16em]" style={{ color: themeColor }}>
                  Example
                </div>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-800">{activeStep.microLearningChunk}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
