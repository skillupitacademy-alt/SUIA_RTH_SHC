import React from 'react';
import * as Icons from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';

interface RealLifeScenarioBlockProps {
  title: string;
  problemStatement: string;
  context: string;
  solution: string;
  implementation: string;
  outcome: string;
  lessonsLearned: string;
}

/**
 * Real Life Scenario Block Component
 * Renderer: scenario_block
 * Layout Template: problem_solution_flow
 * Purpose: Problem-solution context scenarios
 * 
 * Based on AllSectionTutorialPageUIUXDetailed.json specification
 */
export function RealLifeScenarioBlock({
  title,
  problemStatement,
  context,
  solution,
  implementation,
  outcome,
  lessonsLearned
}: RealLifeScenarioBlockProps) {
  const brand = useBrand();

  return (
    <div className="w-full mb-8">
      {/* Title */}
      <h2 className="text-2xl font-bold text-slate-950 mb-6">{title}</h2>

      {/* Scenario Flow */}
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200 space-y-6">
        {/* Problem Statement */}
        <div className="bg-red-50 rounded-xl p-6 border border-red-200">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
              <Icons.AlertCircle size={20} className="text-red-600" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-red-900 mb-2">The Problem</h3>
              <p className="text-base font-medium text-red-900 leading-relaxed">
                {problemStatement}
              </p>
            </div>
          </div>
          {/* Context */}
          <div className="mt-4 pl-13">
            <h4 className="text-sm font-bold text-red-800 mb-2">Context</h4>
            <p className="text-sm font-medium text-red-800 leading-relaxed">
              {context}
            </p>
          </div>
        </div>

        {/* Arrow Down */}
        <div className="flex justify-center">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${brand.primaryColor}20` }}
          >
            <Icons.ArrowDown
              size={24}
              style={{ color: brand.primaryColor }}
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Solution */}
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
              <Icons.Lightbulb size={20} className="text-blue-600" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-blue-900 mb-2">The Solution</h3>
              <p className="text-base font-medium text-blue-900 leading-relaxed">
                {solution}
              </p>
            </div>
          </div>
          {/* Implementation */}
          <div className="mt-4 pl-13">
            <h4 className="text-sm font-bold text-blue-800 mb-2">Implementation</h4>
            <p className="text-sm font-medium text-blue-800 leading-relaxed">
              {implementation}
            </p>
          </div>
        </div>

        {/* Arrow Down */}
        <div className="flex justify-center">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${brand.primaryColor}20` }}
          >
            <Icons.ArrowDown
              size={24}
              style={{ color: brand.primaryColor }}
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Outcome */}
        <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-200">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
              <Icons.CheckCircle2 size={20} className="text-emerald-600" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-emerald-900 mb-2">The Outcome</h3>
              <p className="text-base font-medium text-emerald-900 leading-relaxed">
                {outcome}
              </p>
            </div>
          </div>
        </div>

        {/* Lessons Learned */}
        <div
          className="flex gap-4 p-6 rounded-xl border-l-4"
          style={{
            backgroundColor: `${brand.primaryColor}10`,
            borderLeftColor: brand.primaryColor
          }}
        >
          <Icons.BookOpen
            size={20}
            className="shrink-0 mt-0.5"
            style={{ color: brand.primaryColorDark }}
            aria-hidden="true"
          />
          <div>
            <h4 className="text-sm font-bold mb-2" style={{ color: brand.primaryColorDark }}>
              Lessons Learned
            </h4>
            <p className="text-base font-bold text-slate-900">
              {lessonsLearned}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
