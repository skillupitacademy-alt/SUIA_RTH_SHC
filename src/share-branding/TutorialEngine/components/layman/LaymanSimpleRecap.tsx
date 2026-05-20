import React from 'react';
import * as Icons from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';

interface SimpleRecapPoint {
  id: string;
  item: string;
  checked: boolean;
}

interface LaymanSimpleRecapProps {
  summaryTitle: string;
  keyTakeaways: string[];
  simpleRecapPoints: SimpleRecapPoint[];
  confidenceBoost: string;
  memoryReinforcement: string;
}

/**
 * Layman Simple Recap Component
 * Renderer: summary_card
 * Purpose: Beginner recap, reinforcement, and revision dashboard
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
    <div className="w-full mb-12">
      <div className="flex items-center gap-3 mb-6">
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg"
          style={{ backgroundColor: '#2196F3' }} // Blue circle like in the image
        >
          8
        </div>
        <h3 className="text-2xl font-black text-slate-900 tracking-tight">{summaryTitle}</h3>
      </div>

      <div className="bg-white rounded-[32px] border border-gray-100 shadow-xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Left Column: Key Takeaways */}
          <div className="p-8 lg:p-12 border-r border-gray-100">
            <h4 className="text-xl font-black text-slate-900 mb-8 tracking-tight">Key Takeaways</h4>
            <ul className="space-y-6">
              {keyTakeaways.map((takeaway, index) => (
                <li key={index} className="flex items-start gap-4 group">
                  <div className="shrink-0 w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                    <Icons.Check size={14} className="text-blue-600 font-black" />
                  </div>
                  <p className="text-base font-bold text-slate-700 leading-tight">
                    {takeaway}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          {/* Right Column: Remember This! Card */}
          <div className="p-8 lg:p-12 bg-blue-50/30">
            <div className="bg-white rounded-[24px] shadow-lg border border-white p-8 h-full flex flex-col items-center text-center">
              <div className="mb-6 flex flex-col items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center"
                  style={{ backgroundColor: `${brand.primaryColor}15` }}
                >
                  <Icons.Lightbulb size={24} style={{ color: brand.primaryColor }} />
                </div>
                <h4 className="text-xl font-black text-slate-900">{confidenceBoost || 'Confidence Boost'}</h4>
              </div>

              {/* Memory Reinforcement Summary */}
              <p className="text-base font-bold text-slate-600 leading-relaxed mb-4">
                {memoryReinforcement}
              </p>

              {/* Simple Recap Points Checklist */}
              <div className="w-full text-left space-y-3 mt-4">
                 {simpleRecapPoints.map((point) => (
                   <div key={point.id} className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center ${point.checked ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'}`}>
                        {point.checked && <Icons.Check size={12} className="text-white" />}
                      </div>
                      <span className="text-sm font-bold text-slate-700">{point.item}</span>
                   </div>
                 ))}
              </div>

              <div className="mt-auto pt-6">
                <span className="text-2xl">🚀</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
