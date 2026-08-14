import React from 'react';
import { CheckCircle2, XCircle, MinusCircle, Target } from 'lucide-react';
import { SegmentedDonut } from './DonutGauges';

interface QuestionStatusCardProps {
  correctCount: number;
  incorrectCount: number;
  skippedCount: number;
  totalQuestions: number;
}

export function QuestionStatusCard({
  correctCount,
  incorrectCount,
  skippedCount,
  totalQuestions,
}: QuestionStatusCardProps) {
  const correctPct = totalQuestions > 0 ? ((correctCount / totalQuestions) * 100).toFixed(1) : '0';
  const incorrectPct = totalQuestions > 0 ? ((incorrectCount / totalQuestions) * 100).toFixed(1) : '0';
  const skippedPct = totalQuestions > 0 ? ((skippedCount / totalQuestions) * 100).toFixed(0) : '0';

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex flex-col justify-between">
      <div>
        <div className="inline-block bg-[#ff0055] text-white text-[11px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full mb-4">
          QUESTION STATUS OVERVIEW
        </div>

        <div className="flex items-center justify-between gap-3">
          {/* Left: Multi-segment Donut */}
          <div className="flex-shrink-0">
            <SegmentedDonut
              correct={correctCount}
              incorrect={incorrectCount}
              skipped={skippedCount}
              size={135}
              strokeWidth={16}
            >
              <div className="text-center">
                <div className="text-2xl font-black text-gray-900">{totalQuestions}</div>
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  Total Questions
                </div>
              </div>
            </SegmentedDonut>
          </div>

          {/* Right: Breakdown list */}
          <div className="flex-1 space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-gray-700 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Correct</span>
              </div>
              <div className="text-right">
                <span className="font-black text-gray-900 text-sm mr-1">{correctCount}</span>
                <span className="text-gray-500 font-semibold text-[11px]">({correctPct}%)</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-gray-700 font-bold">
                <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span>Incorrect</span>
              </div>
              <div className="text-right">
                <span className="font-black text-gray-900 text-sm mr-1">{incorrectCount}</span>
                <span className="text-gray-500 font-semibold text-[11px]">({incorrectPct}%)</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-gray-700 font-bold">
                <MinusCircle className="w-4 h-4 text-orange-400 flex-shrink-0" />
                <span>Skipped</span>
              </div>
              <div className="text-right">
                <span className="font-black text-gray-900 text-sm mr-1">{skippedCount}</span>
                <span className="text-gray-500 font-semibold text-[11px]">({skippedPct}%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Callout Target */}
      <div className="mt-4 border border-dashed border-red-300 rounded-xl p-3 bg-white flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center text-red-600 flex-shrink-0">
          <Target className="w-4 h-4" />
        </div>
        <p className="text-[11px] font-bold text-gray-800 leading-tight">
          Focus on expert level topics to improve further performance!
        </p>
      </div>
    </div>
  );
}
