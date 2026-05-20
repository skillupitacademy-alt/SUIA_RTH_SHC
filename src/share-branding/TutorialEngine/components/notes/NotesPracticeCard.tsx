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
 */
export function NotesPracticeCard({ 
  bestPracticeTitle, 
  recommendations, 
  optimizationTips, 
  industryStandards 
}: NotesPracticeCardProps) {
  const brand = useBrand();

  return (
    <div className="w-full space-y-8">
      {/* Title */}
      <div className="flex items-center gap-3">
         <div className="h-6 w-1 bg-blue-500 rounded-full" />
         <h3 className="text-xl font-bold text-slate-900 tracking-tight uppercase">{bestPracticeTitle}</h3>
      </div>

      <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[1.5fr,1fr]">
          {/* Recommendations */}
          <div className="space-y-6">
            <h4 className="flex items-center gap-2 text-[16px] font-bold text-slate-900">
              <Icons.CheckCircle2 className="text-emerald-500" size={18} aria-hidden="true" />
              Core Recommendations
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
              {recommendations.map((rec) => (
                <div 
                  key={rec.id}
                  className="rounded-xl border border-slate-100 bg-slate-50 p-4 transition-all hover:bg-white hover:shadow-md"
                >
                  <h5 className="text-[14px] font-bold text-slate-900 mb-2">
                    {rec.title}
                  </h5>
                  <p className="text-[12px] font-medium leading-relaxed text-slate-500">
                    {rec.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Industry Standards & Tips */}
          <div className="space-y-8 rounded-2xl bg-indigo-50/50 p-6 border border-indigo-100/50">
            {/* Optimization Tips */}
            <div className="space-y-4">
              <h4 className="flex items-center gap-2 text-[15px] font-bold text-indigo-900">
                <Icons.Zap className="text-amber-500 fill-amber-500" size={16} aria-hidden="true" />
                Quick Tips
              </h4>
              <ul className="space-y-3">
                {optimizationTips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Icons.ArrowRight className="mt-1 text-indigo-400" size={12} />
                    <span className="text-[13px] font-medium text-indigo-900/80">{tip}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Industry Standards */}
            <div className="space-y-4 pt-4 border-t border-indigo-100">
              <h4 className="flex items-center gap-2 text-[15px] font-bold text-indigo-900">
                <Icons.Award className="text-indigo-600" size={16} aria-hidden="true" />
                Standards
              </h4>
              <div className="flex flex-wrap gap-2">
                {industryStandards.map((standard, index) => (
                  <span
                    key={index}
                    className="rounded-lg bg-white px-3 py-1.5 text-[11px] font-bold text-indigo-600 shadow-sm border border-indigo-100"
                  >
                    {standard}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
