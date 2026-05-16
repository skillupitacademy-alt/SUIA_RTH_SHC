import React from 'react';
import * as Icons from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';

interface Scenario {
  id: string;
  title: string;
  scenarioDescription: string;
  practicalSolution: string;
  industryContext: string;
}

interface NotesExamplePanelProps {
  exampleTitle: string;
  scenarios: Scenario[];
}

/**
 * Example Panel Component
 * Renderer: example_panel
 * Layout Template: practical_example_cards
 */
export function NotesExamplePanel({ exampleTitle, scenarios }: NotesExamplePanelProps) {
  const brand = useBrand();

  return (
    <div className="w-full space-y-8">
      {/* Example Title */}
      <div className="flex items-center gap-3">
         <div className="h-6 w-1 bg-emerald-500 rounded-full" />
         <h3 className="text-xl font-bold text-slate-900 tracking-tight uppercase">{exampleTitle}</h3>
      </div>

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {scenarios.map((scenario) => (
          <div
            key={scenario.id}
            className="group overflow-hidden rounded-[24px] border border-slate-200 bg-white p-6 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-start gap-4 mb-6">
              <div 
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-transform group-hover:scale-110"
                style={{ backgroundColor: `${brand.primaryColor}10` }}
              >
                <Icons.Lightbulb 
                  size={24} 
                  style={{ color: brand.primaryColor }}
                  aria-hidden="true"
                />
              </div>
              <h4 className="text-lg font-bold text-slate-900 leading-tight pt-1">
                {scenario.title}
              </h4>
            </div>

            {/* Scenario Content */}
            <div className="space-y-6">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-2 block">The Scenario</span>
                <p className="text-[14px] font-medium leading-relaxed text-slate-600">
                  {scenario.scenarioDescription}
                </p>
              </div>

              {/* Practical Solution */}
              <div className="rounded-2xl bg-emerald-50 p-5 border border-emerald-100 relative group-hover:bg-white group-hover:shadow-md transition-all">
                <div className="flex items-center gap-2 mb-2">
                   <Icons.CheckCircle2 className="text-emerald-600" size={16} aria-hidden="true" />
                   <span className="text-[12px] font-bold text-emerald-900 uppercase tracking-tight">The Solution</span>
                </div>
                <p className="text-[14px] font-medium text-emerald-900/90 leading-relaxed">
                  {scenario.practicalSolution}
                </p>
              </div>

              {/* Footer / Context */}
              <div className="flex items-center gap-2 border-t border-slate-100 pt-4">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                  <Icons.Building2 size={12} aria-hidden="true" />
                </div>
                <span className="text-[12px] font-bold text-slate-400">
                  {scenario.industryContext}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
