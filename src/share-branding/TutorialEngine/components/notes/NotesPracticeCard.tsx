import React from 'react';
import * as Icons from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';

interface Recommendation {
  id: string;
  title: string;
  description: string;
}

interface NotesPracticeCardProps {
  bestPracticeTitle: string;
  recommendations: Recommendation[];
  optimizationTips: string[];
  industryStandards: string[];
}

/**
 * Practice Card Component
 * Renderer: practice_card
 * Layout Template: recommendation_block
 * Purpose: Best practices and optimization guidance
 * 
 * Based on AllSectionTutorialPageUIUXDetailed.json specification
 */
export function NotesPracticeCard({ 
  bestPracticeTitle, 
  recommendations, 
  optimizationTips, 
  industryStandards 
}: NotesPracticeCardProps) {
  const brand = useBrand();

  return (
    <div className="w-full mb-8">
      {/* Title */}
      <h2 className="text-2xl font-bold text-slate-950 mb-6">{bestPracticeTitle}</h2>

      <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-8 border-2 border-emerald-200 shadow-lg">
        {/* Recommendations */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-emerald-950 mb-4 flex items-center gap-2">
            <Icons.CheckCircle2 size={20} className="text-emerald-600" aria-hidden="true" />
            Core Recommendations
          </h3>
          <div className="space-y-4">
            {recommendations.map((rec) => (
              <div 
                key={rec.id}
                className="bg-white rounded-xl p-5 border border-emerald-200 shadow-sm"
              >
                <h4 className="text-base font-bold text-slate-950 mb-2">
                  {rec.title}
                </h4>
                <p className="text-sm font-medium text-slate-700 leading-relaxed">
                  {rec.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Optimization Tips */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-emerald-950 mb-4 flex items-center gap-2">
            <Icons.Zap size={20} className="text-emerald-600" aria-hidden="true" />
            Optimization Tips
          </h3>
          <ul className="space-y-3">
            {optimizationTips.map((tip, index) => (
              <li key={index} className="flex items-start gap-3">
                <Icons.ArrowRight 
                  size={18} 
                  className="shrink-0 mt-0.5 text-emerald-600"
                  aria-hidden="true"
                />
                <span className="text-sm font-medium text-slate-800">{tip}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Industry Standards */}
        <div>
          <h3 className="text-lg font-bold text-emerald-950 mb-4 flex items-center gap-2">
            <Icons.Award size={20} className="text-emerald-600" aria-hidden="true" />
            Industry Standards
          </h3>
          <ul className="space-y-3">
            {industryStandards.map((standard, index) => (
              <li key={index} className="flex items-start gap-3">
                <Icons.Star 
                  size={18} 
                  className="shrink-0 mt-0.5 text-emerald-600"
                  aria-hidden="true"
                />
                <span className="text-sm font-medium text-slate-800">{standard}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
