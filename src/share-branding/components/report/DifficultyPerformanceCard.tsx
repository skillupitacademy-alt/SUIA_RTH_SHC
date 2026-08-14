import React from 'react';
import { DonutGauge } from './DonutGauges';
import { PerformanceMetric } from './types';

interface DifficultyPerformanceCardProps {
  difficultyData?: PerformanceMetric[];
}

export function DifficultyPerformanceCard({
  difficultyData = [],
}: DifficultyPerformanceCardProps) {
  const simpleMetric: PerformanceMetric = difficultyData.find((d) => d.name.toLowerCase().includes('simple')) || {
    name: 'Simple',
    score: 4,
    total: 4,
    attempts: 4,
    accuracy: 100,
  };
  const intermediateMetric: PerformanceMetric = difficultyData.find((d) => d.name.toLowerCase().includes('inter')) || {
    name: 'Intermediate',
    score: 6,
    total: 8,
    attempts: 8,
    accuracy: 75,
  };
  const expertMetric: PerformanceMetric = difficultyData.find((d) => d.name.toLowerCase().includes('expert')) || {
    name: 'Expert',
    score: 2,
    total: 3,
    attempts: 3,
    accuracy: 66.7,
  };

  const simpleCorrect = simpleMetric.score ?? 4;
  const simpleTotal = simpleMetric.total ?? simpleMetric.attempts ?? 4;
  const simpleAcc = simpleMetric.accuracy !== undefined ? simpleMetric.accuracy : 100;

  const interCorrect = intermediateMetric.score ?? 6;
  const interTotal = intermediateMetric.total ?? intermediateMetric.attempts ?? 8;
  const interAcc = intermediateMetric.accuracy !== undefined ? intermediateMetric.accuracy : 75;

  const expertCorrect = expertMetric.score ?? 2;
  const expertTotal = expertMetric.total ?? expertMetric.attempts ?? 3;
  const expertAcc = expertMetric.accuracy !== undefined ? expertMetric.accuracy : 66.7;

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex flex-col justify-between">
      <div>
        <div className="inline-block bg-[#ff0055] text-white text-[11px] font-black uppercase tracking-wider px-3.5 py-1 rounded-full mb-4">
          PERFORMANCE BY DIFFICULTY
        </div>

        {/* 3 Difficulty Donut Gauges */}
        <div className="grid grid-cols-3 gap-2 text-center items-center">
          {/* Simple */}
          <div className="flex flex-col items-center">
            <div className="text-sm font-black text-gray-900 mb-1">{simpleAcc}%</div>
            <DonutGauge
              percentage={simpleAcc}
              size={72}
              strokeWidth={8}
              color="#059669"
              trackColor="#f1f5f9"
            />
            <div className="text-xs font-bold text-gray-900 mt-2">Simple</div>
            <div className="text-[10px] font-semibold text-gray-500">
              ({simpleCorrect} / {simpleTotal})
            </div>
          </div>

          {/* Intermediate */}
          <div className="flex flex-col items-center">
            <div className="text-sm font-black text-gray-900 mb-1">{interAcc}%</div>
            <DonutGauge
              percentage={interAcc}
              size={72}
              strokeWidth={8}
              color="#2563eb"
              trackColor="#f1f5f9"
            />
            <div className="text-xs font-bold text-gray-900 mt-2">Intermediate</div>
            <div className="text-[10px] font-semibold text-gray-500">
              ({interCorrect} / {interTotal})
            </div>
          </div>

          {/* Expert */}
          <div className="flex flex-col items-center">
            <div className="text-sm font-black text-gray-900 mb-1">{expertAcc}%</div>
            <DonutGauge
              percentage={expertAcc}
              size={72}
              strokeWidth={8}
              color="#ff0055"
              trackColor="#f1f5f9"
            />
            <div className="text-xs font-bold text-gray-900 mt-2">Expert</div>
            <div className="text-[10px] font-semibold text-gray-500">
              ({expertCorrect} / {expertTotal})
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Legend Box */}
      <div className="mt-4 border border-dashed border-red-200 rounded-xl p-3 bg-red-50/20">
        <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[11px]">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-[#059669] flex-shrink-0" />
            <span className="text-gray-700 font-semibold truncate">Simple (90-100%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-[#2563eb] flex-shrink-0" />
            <span className="text-gray-700 font-semibold truncate">Intermediate (70-89%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-[#f97316] flex-shrink-0" />
            <span className="text-gray-700 font-semibold truncate">Expert (50-69%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-[#ff0055] flex-shrink-0" />
            <span className="text-gray-700 font-semibold truncate">Needs Improvement (&lt;50%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
