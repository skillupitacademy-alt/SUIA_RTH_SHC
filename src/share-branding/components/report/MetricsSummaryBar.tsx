import React from 'react';
import { Timer, Clock, Rocket, Layers, Award } from 'lucide-react';
import { SnailIcon } from './DonutGauges';

interface MetricsSummaryBarProps {
  formattedTotalTime: string;
  formattedAvgTime: string;
  formattedFastest: string;
  formattedSlowest: string;
  fastestLabel: string;
  slowestLabel: string;
  deepestLevel?: number;
  totalQuestions: number;
}

export function MetricsSummaryBar({
  formattedTotalTime,
  formattedAvgTime,
  formattedFastest,
  formattedSlowest,
  fastestLabel,
  slowestLabel,
  deepestLevel = 10,
  totalQuestions,
}: MetricsSummaryBarProps) {
  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {/* 1. Total Time */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500 flex-shrink-0">
          <Timer className="w-6 h-6" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Total Time</p>
          <p className="text-sm font-black text-gray-900">{formattedTotalTime}</p>
        </div>
      </div>

      {/* 2. Avg. Time / Question */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
          <Clock className="w-6 h-6" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Avg. Time / Question</p>
          <p className="text-sm font-black text-gray-900">{formattedAvgTime}</p>
        </div>
      </div>

      {/* 3. Fastest Question */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-pink-50 flex items-center justify-center text-[#ff0055] flex-shrink-0">
          <Rocket className="w-6 h-6" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Fastest Question</p>
          <p className="text-sm font-black text-gray-900">{formattedFastest}</p>
          <p className="text-[10px] font-bold text-gray-500">({fastestLabel})</p>
        </div>
      </div>

      {/* 4. Slowest Question */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600 flex-shrink-0">
          <SnailIcon className="w-6 h-6 text-red-600" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Slowest Question</p>
          <p className="text-sm font-black text-gray-900">{formattedSlowest}</p>
          <p className="text-[10px] font-bold text-gray-500">({slowestLabel})</p>
        </div>
      </div>

      {/* 5. Deepest Level Reached */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600 flex-shrink-0">
          <Layers className="w-6 h-6" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Deepest Level Reached</p>
          <p className="text-sm font-black text-gray-900">{deepestLevel}</p>
        </div>
      </div>

      {/* 6. Questions Attempted */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-600 flex-shrink-0">
          <Award className="w-6 h-6" />
        </div>
        <div>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Questions Attempted</p>
          <p className="text-sm font-black text-gray-900">{totalQuestions} / {totalQuestions}</p>
        </div>
      </div>
    </div>
  );
}
