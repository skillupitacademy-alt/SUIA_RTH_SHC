import React from 'react';
import * as Icons from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';

interface RealLifeIndustryCaseProps {
  title: string;
  industryName: string;
  scenarioDescription: string;
  businessContext: string;
  implementation: string;
  impact: string;
  keyTakeaway: string;
  image?: string;
}

/**
 * Real Life Industry Case Component
 * Renderer: industry_case_block
 * Layout Template: enterprise_case_study
 * Purpose: Industry-specific use case examples
 * 
 * Based on AllSectionTutorialPageUIUXDetailed.json specification
 */
export function RealLifeIndustryCase({
  title,
  industryName,
  scenarioDescription,
  businessContext,
  implementation,
  impact,
  keyTakeaway,
  image
}: RealLifeIndustryCaseProps) {
  const brand = useBrand();

  return (
    <div className="w-full mb-8">
      {/* Title */}
      <h2 className="text-2xl font-bold text-slate-950 mb-6">{title}</h2>

      {/* Split Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
        {/* Left Panel - Scenario */}
        <div className="space-y-6">
          {/* Industry Badge */}
          <div className="flex items-center gap-2">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${brand.primaryColor}20` }}
            >
              <Icons.Building2
                size={20}
                style={{ color: brand.primaryColor }}
                aria-hidden="true"
              />
            </div>
            <span className="text-sm font-bold uppercase tracking-wider" style={{ color: brand.primaryColorDark }}>
              {industryName}
            </span>
          </div>

          {/* Scenario Description */}
          <div>
            <h3 className="text-lg font-bold text-slate-950 mb-3">The Scenario</h3>
            <p className="text-base font-medium text-slate-700 leading-relaxed">
              {scenarioDescription}
            </p>
          </div>

          {/* Business Context */}
          <div
            className="p-4 rounded-xl border-l-4"
            style={{
              backgroundColor: `${brand.primaryColor}08`,
              borderLeftColor: brand.primaryColor
            }}
          >
            <h4 className="text-sm font-bold mb-2" style={{ color: brand.primaryColorDark }}>
              Business Context
            </h4>
            <p className="text-sm font-medium text-slate-800 leading-relaxed">
              {businessContext}
            </p>
          </div>

          {/* Image if provided */}
          {image && (
            <div className="flex justify-center p-4 bg-gray-50 rounded-xl">
              <img
                src={image}
                alt={`${industryName} case study`}
                className="max-h-[200px] object-contain drop-shadow-lg"
              />
            </div>
          )}
        </div>

        {/* Right Panel - Implementation & Impact */}
        <div className="space-y-6">
          {/* Implementation */}
          <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <Icons.Cog size={18} className="text-blue-600" aria-hidden="true" />
              <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider">
                Implementation
              </h3>
            </div>
            <p className="text-base font-medium text-blue-900 leading-relaxed">
              {implementation}
            </p>
          </div>

          {/* Impact */}
          <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-200">
            <div className="flex items-center gap-2 mb-3">
              <Icons.TrendingUp size={18} className="text-emerald-600" aria-hidden="true" />
              <h3 className="text-sm font-bold text-emerald-900 uppercase tracking-wider">
                Business Impact
              </h3>
            </div>
            <p className="text-base font-medium text-emerald-900 leading-relaxed">
              {impact}
            </p>
          </div>

          {/* Key Takeaway */}
          <div
            className="p-5 rounded-xl"
            style={{
              backgroundColor: `${brand.primaryColor}15`,
              border: `2px solid ${brand.primaryColor}40`
            }}
          >
            <div className="flex items-start gap-3">
              <Icons.Lightbulb
                size={20}
                className="shrink-0 mt-0.5"
                style={{ color: brand.primaryColorDark }}
                aria-hidden="true"
              />
              <div>
                <h4 className="text-sm font-bold mb-2" style={{ color: brand.primaryColorDark }}>
                  Key Takeaway
                </h4>
                <p className="text-base font-bold text-slate-900">
                  {keyTakeaway}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
