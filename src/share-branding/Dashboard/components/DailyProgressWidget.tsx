import React from 'react';
import { useBrand } from '../../PostLandingPage/app/context/BrandContext';
import { Clock } from 'lucide-react';

export function DailyProgressWidget() {
  const brand = useBrand();
  const hoursToday = 4;
  const dailyGoal = 6;
  const progressPercent = Math.round((hoursToday / dailyGoal) * 100);

  return (
    <div className="rounded-[2rem] p-6 bg-white border border-gray-200 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Daily Progress</h3>

      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-5xl font-black" style={{ color: brand.primaryColor }}>
              {hoursToday}
            </span>
            <span className="text-xl font-bold text-gray-400">hrs</span>
          </div>
          <p className="text-sm text-gray-600">
            Goal: {dailyGoal} hours daily
          </p>
        </div>

        {/* Circular Progress */}
        <div className="relative w-28 h-28">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 112 112">
            <circle
              cx="56"
              cy="56"
              r="50"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="10"
            />
            <circle
              cx="56"
              cy="56"
              r="50"
              fill="none"
              stroke={brand.primaryColor}
              strokeWidth="10"
              strokeDasharray={`${progressPercent * 3.14} 314`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Clock style={{ color: brand.primaryColor }} size={24} className="mb-1" />
            <span className="text-xl font-black" style={{ color: brand.primaryColor }}>
              {progressPercent}%
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Weekly Average</span>
          <span className="font-bold text-gray-900">3.8 hrs</span>
        </div>
      </div>
    </div>
  );
}