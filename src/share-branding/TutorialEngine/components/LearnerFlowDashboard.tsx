import { useBrand } from '@/share-branding/PostLandingPage/app/context/BrandContext';
import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useTutorialData } from './TutorialDataContext';

interface LearnerFlowDashboardProps {
  completedCount: number;
  totalCount: number;
}

export const LearnerFlowDashboard: React.FC<LearnerFlowDashboardProps> = ({ completedCount, totalCount }) => {
  const brandConfig = useBrand();
  const data = useTutorialData();
  const percentage = (completedCount / totalCount) * 100;

  const tiers = data.learnerFlow.tierNames.map((name, index) => ({
    name,
    status:
      index === 0 ? (completedCount >= 2 ? 'unlocked' : 'locked') :
      index === 1 ? (completedCount >= 4 ? 'unlocked' : 'locked') :
      completedCount >= totalCount ? 'unlocked' : 'locked',
  }));

  return (
    <div className="w-full min-w-0 overflow-hidden rounded-lg border border-gray-200 bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.12)] sm:p-6">
      <div className="mb-6 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="mb-2 break-words text-2xl font-bold text-gray-800" style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.04em' }}>
            {data.learnerFlow.title}
          </h2>
          <p className="break-words text-sm text-gray-700" style={{ fontFamily: 'Inter, sans-serif' }}>
            {data.learnerFlow.description}
          </p>
        </div>
        <div className="shrink-0 text-left sm:text-right">
          <div className="text-2xl font-bold sm:text-3xl" style={{ fontFamily: 'Outfit, sans-serif', color: brandConfig.primaryColor }}>
            {completedCount}/{totalCount}
          </div>
          <div className="text-xs text-gray-700" style={{ fontFamily: 'Inter, sans-serif' }}>
            sections
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="h-3 overflow-hidden rounded-full border border-gray-200 bg-gray-100">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percentage}%`, background: brandConfig.primaryColor }} />
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="mb-3 text-sm font-semibold text-gray-700" style={{ fontFamily: 'Outfit, sans-serif' }}>
          {data.learnerFlow.tierTitle}
        </h3>
        <div className="grid w-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-3">
          {tiers.map((tier) => (
            <button
              key={tier.name}
              disabled={tier.status === 'locked'}
              className={`w-full min-w-0 overflow-hidden rounded-lg border p-4 text-center transition-all duration-300 ${
                tier.status === 'unlocked'
                  ? 'cursor-pointer border-gray-200 bg-white shadow-[0_8px_20px_rgba(0,0,0,0.06)] hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(0,0,0,0.10)]'
                  : 'cursor-not-allowed border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex min-w-0 flex-wrap items-center justify-center gap-2">
                <span
                  className={`break-words text-sm font-semibold ${tier.status === 'unlocked' ? 'text-gray-800' : 'text-gray-700'}`}
                  style={{ fontFamily: 'Outfit, sans-serif', color: tier.status === 'unlocked' ? brandConfig.primaryColor : undefined }}
                >
                  {tier.name}
                </span>
                {tier.status === 'unlocked' && <ChevronRight className="h-4 w-4 shrink-0" style={{ color: brandConfig.primaryColor }} />}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
