import React from 'react';
import * as Icons from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';
import { SVGIconRenderer } from '../shared/SVGIconRenderer';

interface RealLifeDailyStoryProps {
  title: string;
  storyTitle: string;
  storyNarrative: string;
  everydayConnection: string;
  technicalMapping: string;
  relatableInsight: string;
  image?: string;
}

/**
 * Real Life Daily Story Component
 * Renderer: daily_life_story
 * Layout Template: storytelling_card
 * Purpose: Daily life examples with storytelling approach
 * 
 * Based on AllSectionTutorialPageUIUXDetailed.json specification
 */
export function RealLifeDailyStory({
  title,
  storyTitle,
  storyNarrative,
  everydayConnection,
  technicalMapping,
  relatableInsight,
  image
}: RealLifeDailyStoryProps) {
  const brand = useBrand();

  return (
    <div className="w-full mb-8">
      {/* Title */}
      <h2 className="text-2xl font-bold text-slate-950 mb-6">{title}</h2>

      {/* Story Card */}
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
        {/* Story Header */}
        <div className="flex items-start gap-4 mb-6">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${brand.primaryColor}20` }}
          >
            <Icons.Coffee
              size={24}
              style={{ color: brand.primaryColor }}
              aria-hidden="true"
            />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-slate-950 mb-2">{storyTitle}</h3>
            <p className="text-base font-medium text-slate-700 leading-relaxed">
              {storyNarrative}
            </p>
          </div>
        </div>

        {/* Image if provided */}
        {image && (
          <div className="mb-6 overflow-hidden rounded-2xl border border-slate-100 shadow-sm bg-slate-50/50 p-3 mx-auto max-w-full">
            <SVGIconRenderer
              dataUri={image}
              alt="Daily life illustration"
              className="w-full h-auto max-h-[240px] object-contain mx-auto"
            />
          </div>
        )}

        {/* Connection Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Everyday Connection */}
          <div className="bg-amber-50 rounded-xl p-5 border border-amber-200">
            <div className="flex items-center gap-2 mb-3">
              <Icons.Home size={18} className="text-amber-600" aria-hidden="true" />
              <h4 className="text-sm font-bold text-amber-900 uppercase tracking-wider">
                Everyday Life
              </h4>
            </div>
            <p className="text-base font-medium text-amber-900 leading-relaxed">
              {everydayConnection}
            </p>
          </div>

          {/* Technical Mapping */}
          <div className="bg-purple-50 rounded-xl p-5 border border-purple-200">
            <div className="flex items-center gap-2 mb-3">
              <Icons.Code2 size={18} className="text-purple-600" aria-hidden="true" />
              <h4 className="text-sm font-bold text-purple-900 uppercase tracking-wider">
                Technical Equivalent
              </h4>
            </div>
            <p className="text-base font-medium text-purple-900 leading-relaxed">
              {technicalMapping}
            </p>
          </div>
        </div>

        {/* Relatable Insight */}
        <div
          className="flex gap-4 p-5 rounded-xl border-l-4"
          style={{
            backgroundColor: `${brand.primaryColor}10`,
            borderLeftColor: brand.primaryColor
          }}
        >
          <Icons.Heart
            size={20}
            className="shrink-0 mt-0.5"
            style={{ color: brand.primaryColorDark }}
            aria-hidden="true"
          />
          <div>
            <h4 className="text-sm font-bold mb-2" style={{ color: brand.primaryColorDark }}>
              The Connection
            </h4>
            <p className="text-base font-bold text-slate-900">
              {relatableInsight}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
