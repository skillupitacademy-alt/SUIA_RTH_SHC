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
 * Purpose: Practical real-world example cards
 * 
 * Based on AllSectionTutorialPageUIUXDetailed.json specification
 */
export function NotesExamplePanel({ exampleTitle, scenarios }: NotesExamplePanelProps) {
  const brand = useBrand();

  return (
    <div className="w-full mb-8">
      {/* Example Title */}
      <h3 className="text-2xl font-bold text-slate-950 mb-6">{exampleTitle}</h3>

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {scenarios.map((scenario) => (
          <div
            key={scenario.id}
            className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 border border-gray-200 shadow-lg transition-all duration-300 hover:shadow-2xl"
          >
            {/* Scenario Title */}
            <div className="flex items-start gap-3 mb-4">
              <div 
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${brand.primaryColor}20` }}
              >
                <Icons.Lightbulb 
                  size={20} 
                  style={{ color: brand.primaryColor }}
                  aria-hidden="true"
                />
              </div>
              <h3 className="text-xl font-bold text-slate-950 leading-tight">
                {scenario.title}
              </h3>
            </div>

            {/* Scenario Description */}
            <div className="mb-4">
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Scenario
              </p>
              <p className="text-sm font-medium text-slate-700 leading-relaxed">
                {scenario.scenarioDescription}
              </p>
            </div>

            {/* Practical Solution */}
            <div className="mb-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <p className="text-xs font-bold text-emerald-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Icons.CheckCircle2 size={14} aria-hidden="true" />
                Solution
              </p>
              <p className="text-sm font-medium text-emerald-900 leading-relaxed">
                {scenario.practicalSolution}
              </p>
            </div>

            {/* Industry Context Badge */}
            <div className="flex items-center gap-2">
              <Icons.Building2 size={14} className="text-slate-500" aria-hidden="true" />
              <span className="text-xs font-medium text-slate-600">
                {scenario.industryContext}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
