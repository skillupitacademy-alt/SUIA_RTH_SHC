import React from 'react';
import { useBrand } from '../../PostLandingPage/app/context/BrandContext';
import { Award, Lock } from 'lucide-react';
import { useDashboardData } from './DashboardDataContext';

export function CapstoneUnlockWidget() {
  const brand = useBrand();
  const { certification } = useDashboardData();
  const progress = certification.progressPercent;

  return (
    <div className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-bold text-gray-900">{certification.title}</h3>

      <div className="flex flex-col items-center justify-center py-6">
        <div className="relative mb-6 h-40 w-40">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 160 160">
            <circle cx="80" cy="80" r="70" fill="none" stroke="#e5e7eb" strokeWidth="12" />
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
            <div className="mb-2 flex h-20 w-20 items-center justify-center rounded-2xl" style={{ backgroundColor: `${brand.primaryColor}15` }}>
              {progress >= 100 ? <Award style={{ color: brand.primaryColor }} size={36} /> : <Lock style={{ color: brand.primaryColor }} size={36} />}
            </div>
            <div className="text-3xl font-black" style={{ color: brand.primaryColor }}>
              {progress}%
            </div>
          </div>
        </div>

        <h4 className="mb-2 text-center text-xl font-bold text-gray-900">{certification.tierLabel}</h4>
        <p className="mb-4 text-center text-sm text-gray-600">{certification.subtitle}</p>

        <div className="w-full space-y-2">
          {certification.items.map((item) => (
            <div
              key={item.label}
              className={`flex items-center justify-between rounded-xl border p-3 ${
                item.status === 'completed' ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
              }`}
            >
              <span className="text-sm font-semibold text-gray-700">{item.label}</span>
              <span className={`text-xs font-bold ${item.status === 'completed' ? 'text-green-700' : 'text-gray-700'}`}>
                {item.status === 'completed' ? 'Completed' : 'Pending'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
