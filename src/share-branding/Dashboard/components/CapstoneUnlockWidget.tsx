import React from 'react';
import { useBrand } from '../../PostLandingPage/app/context/BrandContext';
import { Award, Lock } from 'lucide-react';

export function CapstoneUnlockWidget() {
  const brand = useBrand();
  const progress = 75;

  return (
    <div className="rounded-[2rem] p-6 bg-white border border-gray-200 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Certification Progress</h3>

      <div className="flex flex-col items-center justify-center py-6">
        {/* Progress Ring */}
        <div className="relative w-40 h-40 mb-6">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
            {/* Background circle */}
            <circle
              cx="80"
              cy="80"
              r="70"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="12"
            />
            {/* Progress circle */}
            <circle
              cx="80"
              cy="80"
              r="70"
              fill="none"
              stroke={brand.primaryColor}
              strokeWidth="12"
              strokeDasharray={`${progress * 4.4} 440`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center mb-2"
              style={{ backgroundColor: brand.primaryColor + '15' }}
            >
              {progress >= 100 ? (
                <Award style={{ color: brand.primaryColor }} size={36} />
              ) : (
                <Lock style={{ color: brand.primaryColor }} size={36} />
              )}
            </div>
            <div className="text-3xl font-black" style={{ color: brand.primaryColor }}>
              {progress}%
            </div>
          </div>
        </div>

        <h4 className="text-xl font-bold text-gray-900 mb-2 text-center">
          Tier 2 Certification
        </h4>
        <p className="text-sm text-gray-600 text-center mb-4">
          Complete 2 more exams to unlock
        </p>

        <div className="w-full space-y-2">
          <div className="flex items-center justify-between p-3 rounded-xl bg-green-50 border border-green-200">
            <span className="text-sm font-semibold text-gray-700">Advanced Python</span>
            <span className="text-xs font-bold text-green-600">Completed</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 border border-blue-200">
            <span className="text-sm font-semibold text-gray-700">React Hooks</span>
            <span className="text-xs font-bold text-blue-600">Completed</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-gray-200">
            <span className="text-sm font-semibold text-gray-700">Data Structures</span>
            <span className="text-xs font-bold text-gray-400">Pending</span>
          </div>
        </div>
      </div>
    </div>
  );
}