import React from 'react';
import * as Icons from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';
import { SVGIconRenderer } from '../shared/SVGIconRenderer';

interface LaymanIntroCardProps {
  badge: string;
  headline: string;
  simpleDefinition: string;
  subExplanation: string;
  importanceBlock: string;
  heroVisual?: {
    type: 'inline_svg';
    dataUri: string;
    width?: number;
    height?: number;
    alt?: string;
  };
}

/**
 * Layman Intro Card Component
 * Renderer: intro_card
 * Layout Template: hero_card
 * Purpose: Large beginner-friendly foundational intro section with visual
 */
export function LaymanIntroCard({
  badge,
  headline,
  simpleDefinition,
  subExplanation,
  importanceBlock,
  heroVisual
}: LaymanIntroCardProps) {
  const brand = useBrand();

  return (
    <div
      className="w-full max-w-[1200px] min-h-[460px] p-10 mb-8 rounded-[24px] shadow-2xl border border-gray-100 transition-all duration-500 hover:shadow-[0_40px_80px_rgba(0,0,0,0.12)] overflow-hidden relative group"
      style={{
        background: `linear-gradient(135deg, #ffffff 0%, ${brand.primaryColor}08 100%)`
      }}
    >
      {/* Background Decorative Pattern */}
      <div 
        className="absolute top-0 right-0 w-64 h-64 opacity-5 pointer-events-none"
        style={{ color: brand.primaryColor }}
      >
        <Icons.Circle className="w-full h-full -mr-20 -mt-20 scale-150" />
      </div>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        {/* Left Column: Content */}
        <div className="lg:col-span-7">
          <div className="mb-6">
            <span
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest shadow-sm"
              style={{
                backgroundColor: brand.primaryColor,
                color: '#ffffff'
              }}
            >
              <Icons.Compass size={14} aria-hidden="true" />
              {badge}
            </span>
          </div>

          <h3 className="text-5xl font-black text-slate-900 mb-6 leading-[1.1] tracking-tight">
            {headline}
          </h3>

          <p className="text-2xl font-semibold text-slate-800 leading-snug mb-6">
            {simpleDefinition}
          </p>

          <p className="text-lg font-medium text-slate-600 leading-relaxed mb-8 max-w-xl">
            {subExplanation}
          </p>

          {/* In Short Callout */}
          <div
            className="flex gap-4 p-5 rounded-2xl border border-dashed shadow-sm max-w-lg"
            style={{
              backgroundColor: `${brand.primaryColor}08`,
              borderColor: `${brand.primaryColor}30`
            }}
          >
            <div 
              className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-inner"
              style={{ backgroundColor: `${brand.primaryColor}15` }}
            >
              <Icons.Lightbulb
                size={24}
                style={{ color: brand.primaryColor }}
                aria-hidden="true"
              />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-tighter mb-1">
                In short:
              </p>
              <p className="text-base font-bold text-slate-800 leading-tight">
                {importanceBlock}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Visual */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="relative w-full max-w-[400px] aspect-square rounded-[32px] overflow-hidden shadow-2xl bg-white p-4 border border-gray-100 transform transition-transform duration-700 group-hover:scale-[1.02] group-hover:rotate-1">
             {heroVisual?.dataUri ? (
               <SVGIconRenderer 
                 dataUri={heroVisual.dataUri} 
                 alt={heroVisual.alt || headline} 
                 className="w-full h-full object-contain"
               />
             ) : (
               <div className="w-full h-full flex items-center justify-center bg-gray-50 opacity-20">
                 <Icons.Image size={64} />
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
