import React from 'react';
import * as Icons from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';
import { SVGIconRenderer } from '../shared/SVGIconRenderer';

interface ComparisonPoint {
  label: string;
  comparison: string;
}

interface LaymanAnalogyCardProps {
  title: string;
  storyAnalogy: string;
  comparisonPanel: string;
  visualMetaphor: ComparisonPoint[];
  keyTakeaway: string;
  analogyVisual?: {
    type: 'inline_svg';
    dataUri: string;
    width?: number;
    height?: number;
    alt?: string;
  };
}

/**
 * Layman Analogy Card Component
 * Renderer: analogy_card
 * Layout Template: premium_split_panel
 * Purpose: Everyday analogy + visual comparison learning panel
 */
export function LaymanAnalogyCard({
  title,
  storyAnalogy,
  comparisonPanel,
  visualMetaphor,
  keyTakeaway,
  analogyVisual
}: LaymanAnalogyCardProps) {
  const brand = useBrand();

  return (
    <div className="w-full mb-12">
      <div className="flex items-center gap-3 mb-6">
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg"
          style={{ backgroundColor: '#4CAF50' }} // Green circle like in the image
        >
          2
        </div>
        <h3 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h3>
      </div>

      <div className="bg-white rounded-[24px] overflow-hidden border border-gray-100 shadow-xl p-8 lg:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column: Visual/Illustration */}
          <div className="lg:col-span-4 flex flex-col items-center">
            <div className="w-full bg-gray-50 rounded-[20px] p-6 border border-gray-100 flex items-center justify-center min-h-[280px]">
              {analogyVisual?.dataUri ? (
                <SVGIconRenderer 
                  dataUri={analogyVisual.dataUri} 
                  alt={analogyVisual.alt || storyAnalogy} 
                  className="max-h-[220px] object-contain drop-shadow-xl"
                />
              ) : (
                <div className="opacity-20 flex flex-col items-center gap-4 text-slate-400">
                  <Icons.Component size={64} />
                  <span className="text-sm font-bold uppercase tracking-widest">Analogy Illustration</span>
                </div>
              )}
            </div>
            <div className="mt-4 text-center">
              <span className="text-sm font-bold text-slate-900 bg-gray-100 px-4 py-1.5 rounded-full uppercase tracking-widest">
                {storyAnalogy || 'Analogy Illustration'}
              </span>
            </div>
          </div>

          {/* Right Column: Comparison Details */}
          <div className="lg:col-span-8 flex flex-col justify-center h-full">
            <h4 className="text-xl font-extrabold text-slate-900 mb-4 leading-tight">
              {comparisonPanel}
            </h4>

            <div className="space-y-4 mb-8">
              {visualMetaphor.map((point, index) => (
                <div key={index} className="flex items-start gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
                  <div 
                    className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center shadow-sm"
                    style={{ backgroundColor: '#E8F5E9' }}
                  >
                    <Icons.Check size={14} className="text-emerald-600 font-black" />
                  </div>
                  <div>
                    <span className="text-base font-bold text-slate-900 mr-2">{point.label}</span>
                    <span className="text-base font-medium text-slate-600 leading-relaxed">
                      {point.comparison}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom Insight Callout */}
            <div
              className="mt-auto p-5 rounded-2xl flex items-center gap-5 border border-dashed shadow-sm"
              style={{
                backgroundColor: `${brand.primaryColor}08`,
                borderColor: `${brand.primaryColor}30`
              }}
            >
              <div 
                className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transform -rotate-12"
                style={{ backgroundColor: '#FFD54F' }} // Yellow for the star box
              >
                <Icons.Star
                  size={24}
                  className="text-white fill-white"
                  aria-hidden="true"
                />
              </div>
              <p className="text-base font-bold text-slate-800 leading-snug">
                {keyTakeaway}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
