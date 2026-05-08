import React from 'react';
import * as Icons from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';

interface NotesDefinitionBlockProps {
  badge: string;
  headline: string;
  definitionText: string;
  importanceCallout: string;
  quickSummary: string[];
}

/**
 * Definition Block Component
 * Renderer: definition_block
 * Layout Template: top_priority_intro
 * Purpose: Hero-style foundational definition section
 * 
 * Based on AllSectionTutorialPageUIUXDetailed.json specification
 */
export function NotesDefinitionBlock({ 
  badge, 
  headline, 
  definitionText, 
  importanceCallout, 
  quickSummary 
}: NotesDefinitionBlockProps) {
  const brand = useBrand();

  return (
    <div 
      className="w-full max-w-[1200px] min-h-[420px] p-10 mb-8 rounded-[20px] shadow-2xl border border-gray-200 transition-all duration-300 -translate-y-1 hover:-translate-y-3 hover:shadow-[0_30px_60px_rgba(0,0,0,0.15)]"
      style={{ 
        background: `linear-gradient(135deg, ${brand.primaryColor}08 0%, ${brand.primaryColor}15 100%)`,
        borderTop: `2px solid ${brand.primaryColor}40`
      }}
    >
      {/* Section Badge */}
      <div className="mb-6">
        <span 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider"
          style={{ 
            backgroundColor: `${brand.primaryColor}20`,
            color: brand.primaryColorDark
          }}
        >
          <Icons.BookOpen size={14} aria-hidden="true" />
          {badge}
        </span>
      </div>

      {/* Headline */}
      <h3 className="text-4xl font-bold text-slate-950 mb-6 leading-tight">
        {headline}
      </h3>

      {/* Definition Text */}
      <p className="text-lg font-medium text-slate-800 leading-relaxed mb-8">
        {definitionText}
      </p>

      {/* Importance Callout */}
      <div 
        className="flex gap-4 p-5 rounded-xl mb-6 border-l-4"
        style={{ 
          backgroundColor: `${brand.primaryColor}10`,
          borderLeftColor: brand.primaryColor
        }}
      >
        <Icons.AlertCircle 
          size={24} 
          className="shrink-0 mt-0.5" 
          style={{ color: brand.primaryColorDark }}
          aria-hidden="true"
        />
        <div>
          <h4 className="text-sm font-bold mb-1" style={{ color: brand.primaryColorDark }}>
            Why This Matters
          </h4>
          <p className="text-sm font-medium text-slate-800">
            {importanceCallout}
          </p>
        </div>
      </div>

      {/* Quick Summary */}
      <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-gray-100">
        <h4 className="text-base font-bold text-slate-950 mb-4 flex items-center gap-2">
          <Icons.Zap size={18} style={{ color: brand.primaryColor }} aria-hidden="true" />
          Quick Summary
        </h4>
        <ul className="space-y-3">
          {quickSummary.map((item, index) => (
            <li key={index} className="flex items-start gap-3">
              <Icons.CheckCircle2 
                size={18} 
                className="shrink-0 mt-0.5" 
                style={{ color: brand.primaryColor }}
                aria-hidden="true"
              />
              <span className="text-sm font-medium text-slate-800">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
