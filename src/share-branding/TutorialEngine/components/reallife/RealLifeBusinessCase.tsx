import React from 'react';
import * as Icons from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';

interface RealLifeBusinessCaseProps {
  title: string;
  companyType: string;
  businessChallenge: string;
  technicalApplication: string;
  businessProcess: string;
  roi: string;
  scalability: string;
  keyInsight: string;
}

/**
 * Real Life Business Case Component
 * Renderer: business_case_panel
 * Layout Template: business_process_view
 * Purpose: Business application and enterprise examples
 * 
 * Based on AllSectionTutorialPageUIUXDetailed.json specification
 */
export function RealLifeBusinessCase({
  title,
  companyType,
  businessChallenge,
  technicalApplication,
  businessProcess,
  roi,
  scalability,
  keyInsight
}: RealLifeBusinessCaseProps) {
  const brand = useBrand();

  return (
    <div className="w-full mb-8">
      {/* Title */}
      <h2 className="text-2xl font-bold text-slate-950 mb-6">{title}</h2>

      {/* Business Case Panel */}
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
        {/* Company Type Badge */}
        <div className="flex items-center gap-2 mb-6">
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
            {companyType}
          </span>
        </div>

        {/* Business Challenge */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-slate-950 mb-3 flex items-center gap-2">
            <Icons.Target size={20} style={{ color: brand.primaryColor }} aria-hidden="true" />
            Business Challenge
          </h3>
          <p className="text-base font-medium text-slate-700 leading-relaxed">
            {businessChallenge}
          </p>
        </div>

        {/* Technical Application */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-slate-950 mb-3 flex items-center gap-2">
            <Icons.Code2 size={20} style={{ color: brand.primaryColor }} aria-hidden="true" />
            Technical Application
          </h3>
          <p className="text-base font-medium text-slate-700 leading-relaxed">
            {technicalApplication}
          </p>
        </div>

        {/* Business Process */}
        <div className="bg-blue-50 rounded-xl p-5 border border-blue-200 mb-6">
          <h4 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
            <Icons.Workflow size={18} className="text-blue-600" aria-hidden="true" />
            Business Process
          </h4>
          <p className="text-base font-medium text-blue-900 leading-relaxed">
            {businessProcess}
          </p>
        </div>

        {/* ROI & Scalability Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* ROI */}
          <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-200">
            <div className="flex items-center gap-2 mb-3">
              <Icons.DollarSign size={18} className="text-emerald-600" aria-hidden="true" />
              <h4 className="text-sm font-bold text-emerald-900 uppercase tracking-wider">
                Return on Investment
              </h4>
            </div>
            <p className="text-base font-medium text-emerald-900 leading-relaxed">
              {roi}
            </p>
          </div>

          {/* Scalability */}
          <div className="bg-purple-50 rounded-xl p-5 border border-purple-200">
            <div className="flex items-center gap-2 mb-3">
              <Icons.TrendingUp size={18} className="text-purple-600" aria-hidden="true" />
              <h4 className="text-sm font-bold text-purple-900 uppercase tracking-wider">
                Scalability
              </h4>
            </div>
            <p className="text-base font-medium text-purple-900 leading-relaxed">
              {scalability}
            </p>
          </div>
        </div>

        {/* Key Insight */}
        <div
          className="flex gap-4 p-6 rounded-xl border-l-4"
          style={{
            backgroundColor: `${brand.primaryColor}10`,
            borderLeftColor: brand.primaryColor
          }}
        >
          <Icons.Lightbulb
            size={20}
            className="shrink-0 mt-0.5"
            style={{ color: brand.primaryColorDark }}
            aria-hidden="true"
          />
          <div>
            <h4 className="text-sm font-bold mb-2" style={{ color: brand.primaryColorDark }}>
              Key Business Insight
            </h4>
            <p className="text-base font-bold text-slate-900">
              {keyInsight}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
