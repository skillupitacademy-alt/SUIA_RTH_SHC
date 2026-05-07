import React from 'react';
import * as Icons from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';

interface RealLifePracticalSummaryProps {
  summaryTitle: string;
  keyApplications: string[];
  industryRelevance: string[];
  careerImpact: string;
  nextSteps: string[];
  practicalAdvice: string;
}

/**
 * Real Life Practical Summary Component
 * Renderer: practical_summary_card
 * Layout Template: key_application_summary
 * Purpose: Practical recap and application summary
 * 
 * Based on AllSectionTutorialPageUIUXDetailed.json specification
 */
export function RealLifePracticalSummary({
  summaryTitle,
  keyApplications,
  industryRelevance,
  careerImpact,
  nextSteps,
  practicalAdvice
}: RealLifePracticalSummaryProps) {
  const brand = useBrand();

  return (
    <div className="w-full mb-8">
      {/* Summary Card */}
      <div
        className="w-full max-w-[1200px] p-10 rounded-[20px] shadow-2xl border border-gray-200 transition-all duration-300 -translate-y-1 hover:-translate-y-3 hover:shadow-[0_30px_60px_rgba(0,0,0,0.15)]"
        style={{
          background: `linear-gradient(135deg, ${brand.primaryColor}05 0%, ${brand.primaryColor}12 100%)`
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: brand.primaryColor }}
          >
            <Icons.CheckCircle2 size={24} className="text-white" aria-hidden="true" />
          </div>
          <h2 className="text-3xl font-bold text-slate-950">{summaryTitle}</h2>
        </div>

        {/* Key Applications */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-slate-950 mb-4 flex items-center gap-2">
            <Icons.Zap size={20} style={{ color: brand.primaryColor }} aria-hidden="true" />
            Key Applications
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {keyApplications.map((application, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-gray-200"
              >
                <Icons.CheckCircle2
                  size={18}
                  className="shrink-0 mt-0.5"
                  style={{ color: brand.primaryColor }}
                  aria-hidden="true"
                />
                <span className="text-sm font-medium text-slate-800">{application}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Industry Relevance */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-slate-950 mb-4 flex items-center gap-2">
            <Icons.Building2 size={20} style={{ color: brand.primaryColor }} aria-hidden="true" />
            Industry Relevance
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {industryRelevance.map((industry, index) => (
              <div
                key={index}
                className="p-4 bg-blue-50 rounded-xl border border-blue-200 text-center"
              >
                <span className="text-sm font-bold text-blue-900">{industry}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Career Impact */}
        <div
          className="flex gap-4 p-6 rounded-xl border-l-4 mb-8"
          style={{
            backgroundColor: `${brand.primaryColor}10`,
            borderLeftColor: brand.primaryColor
          }}
        >
          <Icons.Briefcase
            size={24}
            className="shrink-0 mt-0.5"
            style={{ color: brand.primaryColorDark }}
            aria-hidden="true"
          />
          <div>
            <h4 className="text-sm font-bold mb-2" style={{ color: brand.primaryColorDark }}>
              Career Impact
            </h4>
            <p className="text-base font-medium text-slate-800 leading-relaxed">
              {careerImpact}
            </p>
          </div>
        </div>

        {/* Next Steps */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-slate-950 mb-4 flex items-center gap-2">
            <Icons.ArrowRight size={20} style={{ color: brand.primaryColor }} aria-hidden="true" />
            Next Steps
          </h3>
          <div className="space-y-3">
            {nextSteps.map((step, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-200"
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white"
                  style={{ backgroundColor: brand.primaryColor }}
                >
                  {index + 1}
                </div>
                <span className="text-sm font-medium text-emerald-900">{step}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Practical Advice */}
        <div
          className="p-6 rounded-xl"
          style={{
            backgroundColor: `${brand.primaryColor}15`,
            border: `2px solid ${brand.primaryColor}40`
          }}
        >
          <div className="flex items-start gap-3">
            <Icons.Lightbulb
              size={24}
              className="shrink-0 mt-0.5"
              style={{ color: brand.primaryColorDark }}
              aria-hidden="true"
            />
            <div>
              <h4 className="text-sm font-bold mb-2" style={{ color: brand.primaryColorDark }}>
                Practical Advice
              </h4>
              <p className="text-base font-bold text-slate-900">
                {practicalAdvice}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
