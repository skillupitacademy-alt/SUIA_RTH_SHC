import React from 'react';
import * as Icons from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';

interface RealLifeMappingCardProps {
  badge: string;
  headline: string;
  conceptDefinition: string;
  realWorldTranslation: string;
  importanceBlock: string;
  careerRelevance?: string;
}

/**
 * Real Life Mapping Card Component
 * Renderer: mapping_card
 * Layout Template: concept_translation_panel
 * Purpose: Concept to real-world mapping introduction
 * 
 * Based on AllSectionTutorialPageUIUXDetailed.json specification
 */
export function RealLifeMappingCard({
  badge,
  headline,
  conceptDefinition,
  realWorldTranslation,
  importanceBlock,
  careerRelevance
}: RealLifeMappingCardProps) {
  const brand = useBrand();

  return (
    <div
      className="w-full max-w-[1200px] min-h-[460px] p-10 mb-8 rounded-[20px] shadow-2xl border border-gray-200 transition-all duration-300 -translate-y-1 hover:-translate-y-3 hover:shadow-[0_30px_60px_rgba(0,0,0,0.15)]"
      style={{
        background: `linear-gradient(135deg, ${brand.primaryColor}05 0%, ${brand.primaryColor}12 100%)`
      }}
    >
      {/* Industry Badge */}
      <div className="mb-6">
        <span
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider"
          style={{
            backgroundColor: `${brand.primaryColor}20`,
            color: brand.primaryColorDark
          }}
        >
          <Icons.Globe size={14} aria-hidden="true" />
          {badge}
        </span>
      </div>

      {/* Headline */}
      <h2 className="text-4xl font-bold text-slate-950 mb-6 leading-tight">
        {headline}
      </h2>

      {/* Concept Definition */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Icons.BookOpen size={20} style={{ color: brand.primaryColor }} aria-hidden="true" />
          The Concept
        </h3>
        <p className="text-lg font-medium text-slate-700 leading-relaxed">
          {conceptDefinition}
        </p>
      </div>

      {/* Real World Translation */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
          <Icons.MapPin size={20} style={{ color: brand.primaryColor }} aria-hidden="true" />
          In The Real World
        </h3>
        <p className="text-lg font-medium text-slate-700 leading-relaxed">
          {realWorldTranslation}
        </p>
      </div>

      {/* Importance Block */}
      <div
        className="flex gap-4 p-6 rounded-xl border-l-4 mb-6"
        style={{
          backgroundColor: `${brand.primaryColor}10`,
          borderLeftColor: brand.primaryColor
        }}
      >
        <Icons.Target
          size={24}
          className="shrink-0 mt-0.5"
          style={{ color: brand.primaryColorDark }}
          aria-hidden="true"
        />
        <div>
          <h4 className="text-sm font-bold mb-2" style={{ color: brand.primaryColorDark }}>
            Why This Matters
          </h4>
          <p className="text-base font-medium text-slate-800 leading-relaxed">
            {importanceBlock}
          </p>
        </div>
      </div>

      {/* Career Relevance */}
      {careerRelevance && (
        <div className="flex items-center gap-3 px-4 py-3 bg-white/60 backdrop-blur-sm rounded-lg border border-gray-200">
          <Icons.Briefcase size={18} style={{ color: brand.primaryColor }} aria-hidden="true" />
          <span className="text-sm font-bold text-slate-700">{careerRelevance}</span>
        </div>
      )}
    </div>
  );
}
