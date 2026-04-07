import { useBrand } from '../../PostLandingPage/app/context/BrandContext';
import React from 'react';
import { ChevronRight } from 'lucide-react';

interface LearnerFlowDashboardProps {
  completedCount: number;
  totalCount: number;
  
}

export const LearnerFlowDashboard: React.FC<LearnerFlowDashboardProps> = ({ completedCount, totalCount }) => {
  const brandConfig = useBrand();

  const percentage = (completedCount / totalCount) * 100;

  const tiers = [
    { name: 'Basic', status: completedCount >= 2 ? 'unlocked' : 'locked' },
    { name: 'Intermediate', status: completedCount >= 4 ? 'unlocked' : 'locked' },
    { name: 'Advanced', status: completedCount >= 6 ? 'unlocked' : 'locked' },
  ];

  return (
    <div className="rounded-lg p-6 bg-white border border-gray-200 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(0,0,0,0.10)]">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2
            className="text-2xl font-bold text-gray-800 mb-2"
            style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.04em' }}
          >
            Your Learning Progress
          </h2>
          <p className="text-sm text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>
            Complete all sections to unlock assignments
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: brandConfig.primaryColor }}>
            {completedCount}/{totalCount}
          </div>
          <div className="text-xs text-gray-600" style={{ fontFamily: 'Inter, sans-serif' }}>
            sections
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="h-3 rounded-full bg-gray-100 overflow-hidden border border-gray-200">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${percentage}%`,
              background: brandConfig.primaryColor,
            }}
          />
        </div>
      </div>

      {/* Assignment Tiers */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-700 mb-3" style={{ fontFamily: 'Outfit, sans-serif' }}>
          Assignment Paths
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {tiers.map((tier) => (
            <button
              key={tier.name}
              disabled={tier.status === 'locked'}
              className={`p-4 rounded-lg text-center transition-all duration-300 border ${
                tier.status === 'unlocked' 
                  ? 'hover:scale-105 hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(0,0,0,0.10)] cursor-pointer bg-white border-gray-200 shadow-sm' 
                  : 'opacity-60 cursor-not-allowed bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <span
                  className={`text-sm font-semibold ${
                    tier.status === 'unlocked' ? 'text-gray-800' : 'text-gray-500'
                  }`}
                  style={{ fontFamily: 'Outfit, sans-serif', color: tier.status === 'unlocked' ? brandConfig.primaryColor : undefined }}
                >
                  {tier.name}
                </span>
                {tier.status === 'unlocked' && <ChevronRight className="w-4 h-4" style={{ color: brandConfig.primaryColor }} />}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};