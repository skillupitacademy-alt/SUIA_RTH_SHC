import React from 'react';
import { Lightbulb } from 'lucide-react';
import { ConceptSegmentedDonut } from './DonutGauges';
import { SubjectLogo } from '../SubjectLogo';

interface ConceptPerformanceCardProps {
  subject: string;
  strongConcepts: number;
  avgConcepts: number;
  weakConcepts: number;
  primaryColor?: string;
  secondaryColor?: string;
}

export function ConceptPerformanceCard({
  subject,
  strongConcepts,
  avgConcepts,
  weakConcepts,
  primaryColor = '#ff0055',
  secondaryColor = '#0b132b',
}: ConceptPerformanceCardProps) {
  return (
    <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex flex-col justify-between">
      <div>
        <div className="inline-block bg-[#ff0055] text-white text-[11px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full mb-4">
          CONCEPT WISE PERFORMANCE (HIGHLIGHTS)
        </div>

        <div className="grid grid-cols-12 gap-3 items-center">
          {/* 4-Color Donut with Dynamic Subject Logo in Center (col-span-4) */}
          <div className="col-span-4 flex justify-center">
            <ConceptSegmentedDonut size={105} strokeWidth={13}>
              <div className="w-10 h-10 flex items-center justify-center">
                <SubjectLogo
                  subject={subject}
                  primaryColor={primaryColor}
                  secondaryColor={secondaryColor}
                  size="sm"
                />
              </div>
            </ConceptSegmentedDonut>
          </div>

          {/* Progress bars (col-span-8) */}
          <div className="col-span-8 space-y-2.5">
            {/* Strong */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="font-bold text-gray-800 text-[11px]">Strong (80-100%)</span>
                </div>
                <span className="font-black text-gray-900 text-xs">{strongConcepts} Concepts</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '85%' }} />
              </div>
            </div>

            {/* Average */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                  <span className="font-bold text-gray-800 text-[11px]">Average (50-79%)</span>
                </div>
                <span className="font-black text-gray-900 text-xs">{avgConcepts} Concepts</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '55%' }} />
              </div>
            </div>

            {/* Weak */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                  <span className="font-bold text-gray-800 text-[11px]">Weak (&lt;50%)</span>
                </div>
                <span className="font-black text-gray-900 text-xs">{weakConcepts} Concepts</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-orange-500 h-2 rounded-full" style={{ width: '35%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Tip Box */}
      <div className="mt-4 border border-dashed border-red-300 rounded-xl p-3 bg-white flex items-center gap-2.5">
        <Lightbulb className="w-5 h-5 text-red-500 flex-shrink-0" />
        <p className="text-[11px] font-bold text-gray-800 leading-tight">
          Keep strengthening weak concepts for better accuracy!
        </p>
      </div>
    </div>
  );
}
