import React from 'react';
import * as Icons from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';

interface LaymanSimpleRecapProps {
  summaryTitle: string;
  keyTakeaways: string[];
  simpleRecapPoints: string[];
  confidenceBoost: string;
  memoryReinforcement: string;
}

/**
 * Layman Simple Recap Component
 * Renderer: summary_card
 * Layout Template: revision_dashboard
 * Purpose: Beginner recap, reinforcement, and revision dashboard
 * 
 * Based on AllSectionTutorialPageUIUXDetailed.json specification
 */
export function LaymanSimpleRecap({
  summaryTitle,
  keyTakeaways,
  simpleRecapPoints,
  confidenceBoost,
  memoryReinforcement
}: LaymanSimpleRecapProps) {
  const brand = useBrand();

  return (
    <div className="w-full max-w-[1200px] mb-8">
      <div
        className="rounded-[20px] p-10 shadow-2xl border-2 transition-all duration-300 -translate-y-1 hover:-translate-y-3 hover:shadow-[0_30px_60px_rgba(0,0,0,0.15)]"
        style={{
          background: `linear-gradient(135deg, ${brand.primaryColor}08 0%, ${brand.primaryColor}12 100%)`,
          borderColor: `${brand.primaryColor}30`
        }}
      >
        {/* Title */}
        <div className="flex items-center gap-3 mb-8">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${brand.primaryColor}20` }}
          >
            <Icons.CheckCircle2
              size={24}
              style={{ color: brand.primaryColor }}
              aria-hidden="true"
            />
          </div>
          <h3 className="text-3xl font-bold text-slate-950">{summaryTitle}</h3>
        </div>

        {/* Key Takeaways */}
        <div className="mb-8">
          <h4 className="text-xl font-bold text-slate-950 mb-4 flex items-center gap-2">
            <Icons.Star size={20} style={{ color: brand.primaryColor }} aria-hidden="true" />
            Key Takeaways
          </h4>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200">
            <ul className="space-y-3">
              {keyTakeaways.map((takeaway, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Icons.CheckCircle2
                    size={18}
                    className="shrink-0 mt-0.5"
                    style={{ color: brand.primaryColor }}
                    aria-hidden="true"
                  />
                  <span className="text-sm font-medium text-slate-800 leading-relaxed">
                    {takeaway}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Simple Recap Points */}
        <div className="mb-8">
          <h4 className="text-xl font-bold text-slate-950 mb-4 flex items-center gap-2">
            <Icons.BookOpen size={20} style={{ color: brand.primaryColor }} aria-hidden="true" />
            What You've Learned
          </h4>
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-gray-200">
            <ul className="space-y-3">
              {simpleRecapPoints.map((point, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Icons.ArrowRight
                    size={18}
                    className="shrink-0 mt-0.5"
                    style={{ color: brand.primaryColor }}
                    aria-hidden="true"
                  />
                  <span className="text-sm font-medium text-slate-800 leading-relaxed">
                    {point}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Confidence Boost */}
        <div className="mb-8">
          <div
            className="flex gap-4 p-6 rounded-xl border-2"
            style={{
              backgroundColor: `${brand.primaryColor}15`,
              borderColor: `${brand.primaryColor}40`
            }}
          >
            <Icons.Award
              size={32}
              className="shrink-0"
              style={{ color: brand.primaryColorDark }}
              aria-hidden="true"
            />
            <div>
              <h4 className="text-base font-bold mb-2" style={{ color: brand.primaryColorDark }}>
                You Did It!
              </h4>
              <p className="text-lg font-bold text-slate-900 leading-relaxed">
                {confidenceBoost}
              </p>
            </div>
          </div>
        </div>

        {/* Memory Reinforcement */}
        <div
          className="flex gap-4 p-6 rounded-xl border-l-4"
          style={{
            backgroundColor: `${brand.primaryColor}10`,
            borderLeftColor: brand.primaryColor
          }}
        >
          <Icons.Brain
            size={24}
            className="shrink-0 mt-0.5"
            style={{ color: brand.primaryColorDark }}
            aria-hidden="true"
          />
          <div>
            <h4 className="text-base font-bold mb-2" style={{ color: brand.primaryColorDark }}>
              Remember This
            </h4>
            <p className="text-base font-bold text-slate-900 leading-relaxed">
              {memoryReinforcement}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
