import React from 'react';
import { CheckCircle2, XCircle, MinusCircle, Target, Trophy, Star } from 'lucide-react';
import { DonutGauge } from './DonutGauges';

interface OverallPerformanceCardProps {
  correctCount: number;
  incorrectCount: number;
  skippedCount: number;
  totalQuestions: number;
  percentage: number;
  isPassed: boolean;
  percentile: number;
}

export function OverallPerformanceCard({
  correctCount,
  incorrectCount,
  skippedCount,
  totalQuestions,
  percentage,
  isPassed,
  percentile,
}: OverallPerformanceCardProps) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex flex-col justify-between">
      <div>
        <div className="inline-block bg-[#ff0055] text-white text-[11px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full mb-4">
          OVERALL PERFORMANCE
        </div>

        <div className="flex items-center justify-between gap-3">
          {/* Left: Donut Chart */}
          <div className="flex-shrink-0">
            <DonutGauge
              percentage={percentage}
              size={140}
              strokeWidth={14}
              color="#ff0055"
              trackColor="#0b132b"
            >
              <div className="text-center">
                <div className="text-xl font-black">
                  <span className="text-[#ff0055]">{correctCount}</span>
                  <span className="text-gray-900 font-bold"> / {totalQuestions}</span>
                </div>
                <div className="text-xl font-black text-gray-900 mt-0.5">
                  {percentage.toFixed(1)}%
                </div>
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  Score
                </div>
              </div>
            </DonutGauge>
          </div>

          {/* Right: Stats List */}
          <div className="flex-1 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-gray-700 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>Correct Answers</span>
              </div>
              <span className="font-black text-emerald-600 text-sm">{correctCount}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-gray-700 font-bold">
                <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <span>Incorrect Answers</span>
              </div>
              <span className="font-black text-red-500 text-sm">{incorrectCount}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-gray-700 font-bold">
                <MinusCircle className="w-4 h-4 text-orange-400 flex-shrink-0" />
                <span>Skipped Answers</span>
              </div>
              <span className="font-black text-orange-500 text-sm">{skippedCount}</span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-gray-100">
              <div className="flex items-center gap-1.5 text-gray-700 font-bold">
                <Target className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span>Accuracy</span>
              </div>
              <span className="font-black text-gray-900 text-sm">{percentage.toFixed(1)}%</span>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1.5 text-gray-700 font-bold">
                <Trophy className="w-4 h-4 text-[#ff0055] flex-shrink-0" />
                <span>Result</span>
              </div>
              <span className="font-black text-emerald-600 text-sm uppercase">
                {isPassed ? 'PASS' : 'RETRY'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Callout */}
      <div className="mt-4 pt-3 border-t border-gray-100 flex items-start gap-2 text-xs">
        <Star className="w-4 h-4 text-amber-500 fill-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-gray-900">Great Job!</p>
          <p className="text-gray-600 text-[11px]">
            You scored higher than <span className="font-bold text-[#ff0055]">{percentile}%</span> of candidates
          </p>
        </div>
      </div>
    </div>
  );
}
