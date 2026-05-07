import React from 'react';
import * as Icons from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';

interface LaymanAnalogyCardProps {
  title: string;
  storyAnalogy: string;
  comparisonPanel: {
    realWorld: string;
    technical: string;
  };
  visualMetaphor: string;
  keyTakeaway: string;
  image?: string;
}

/**
 * Layman Analogy Card Component
 * Renderer: analogy_card
 * Layout Template: split_panel
 * Purpose: Everyday analogy + visual comparison learning panel
 * 
 * Based on AllSectionTutorialPageUIUXDetailed.json specification
 */
export function LaymanAnalogyCard({
  title,
  storyAnalogy,
  comparisonPanel,
  visualMetaphor,
  keyTakeaway,
  image
}: LaymanAnalogyCardProps) {
  const brand = useBrand();

  return (
    <div className="w-full mb-8">
      {/* Title */}
      <h2 className="text-2xl font-bold text-slate-950 mb-6">{title}</h2>

      {/* Split Panel Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
        {/* Story Analogy Panel */}
        <div className="space-y-6">
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: `${brand.primaryColor}20` }}
            >
              <Icons.BookOpen
                size={20}
                style={{ color: brand.primaryColor }}
                aria-hidden="true"
              />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-950 mb-3">The Story</h3>
              <p className="text-base font-medium text-slate-700 leading-relaxed">
                {storyAnalogy}
              </p>
            </div>
          </div>

          {/* Image if provided */}
          {image && (
            <div className="flex justify-center p-4 bg-gray-50 rounded-xl">
              <img
                src={image}
                alt="Visual analogy"
                className="max-h-[200px] object-contain drop-shadow-lg"
              />
            </div>
          )}

          {/* Visual Metaphor */}
          <div
            className="p-4 rounded-xl border-l-4"
            style={{
              backgroundColor: `${brand.primaryColor}08`,
              borderLeftColor: brand.primaryColor
            }}
          >
            <p className="text-sm font-medium text-slate-800 leading-relaxed">
              💡 {visualMetaphor}
            </p>
          </div>
        </div>

        {/* Comparison Panel */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold text-slate-950">Real World vs Technical</h3>

          {/* Real World */}
          <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <Icons.Home size={18} className="text-blue-600" aria-hidden="true" />
              <h4 className="text-sm font-bold text-blue-900 uppercase tracking-wider">
                Real World
              </h4>
            </div>
            <p className="text-base font-medium text-blue-900 leading-relaxed">
              {comparisonPanel.realWorld}
            </p>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <Icons.ArrowDown size={24} className="text-gray-400" aria-hidden="true" />
          </div>

          {/* Technical */}
          <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-200">
            <div className="flex items-center gap-2 mb-3">
              <Icons.Code2 size={18} className="text-emerald-600" aria-hidden="true" />
              <h4 className="text-sm font-bold text-emerald-900 uppercase tracking-wider">
                Technical
              </h4>
            </div>
            <p className="text-base font-medium text-emerald-900 leading-relaxed">
              {comparisonPanel.technical}
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
