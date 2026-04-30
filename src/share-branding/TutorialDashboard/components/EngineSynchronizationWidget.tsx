import React from 'react';
import { useBrand } from '../../PostLandingPage/app/context/BrandContext';
import { useTutorialDashboardData } from './TutorialDashboardDataContext';
import { DashboardSyncTopic } from '../../tutorialDashboardData';
import { 
  Check, 
  X, 
  AlertTriangle, 
  ArrowRight 
} from 'lucide-react';

export function EngineSynchronizationWidget() {
  const brand = useBrand();
  const { engineSync } = useTutorialDashboardData();

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'failed':
        return { 
          Icon: X, 
          color: '#ef4444', 
          bg: '#fef2f2', 
          label: 'Failed',
          badgeBg: '#fee2e2', 
          badgeText: '#991b1b'
        };
      case 'weak':
        return { 
          Icon: AlertTriangle, 
          color: '#f97316', 
          bg: '#fff7ed', 
          label: 'Weak',
          badgeBg: '#ffedd5', 
          badgeText: '#9a3412'
        };
      case 'mastered':
      default:
        return { 
          Icon: Check, 
          color: '#22c55e', 
          bg: '#f0fdf4', 
          label: 'Mastered',
          badgeBg: '#dcfce7', 
          badgeText: '#166534'
        };
    }
  };

  return (
    <div
      className="flex h-full flex-col rounded-3xl border border-gray-100 bg-white p-8 transition-all duration-500 -translate-y-2 scale-[1.01] shadow-2xl hover:-translate-y-3"
      style={{ boxShadow: `0 20px 50px rgba(${brand.primaryRgb}, 0.05)` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-black text-[#1e293b]">Engine Synchronization</h3>
        <button 
          aria-label="View all sync topics"
          className="text-sm font-bold text-orange-700 hover:underline"
        >
          View All
        </button>
      </div>

      {/* Topics List - Card style as per image */}
      <div className="flex flex-1 flex-col gap-4">
        {engineSync.topics.map((topic: DashboardSyncTopic, index: number) => {
          const config = getStatusConfig(topic.status);
          const StatusIcon = config.Icon;

          return (
            <div 
              key={index} 
              className="group flex items-center gap-5 rounded-2xl border border-slate-50 bg-slate-50/20 p-5 transition-all duration-300 hover:bg-white hover:shadow-md hover:border-slate-100"
            >
              {/* Round Icon */}
              <div 
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: config.bg, color: config.color }}
              >
                <StatusIcon size={24} />
              </div>

              {/* Title & Subtitle */}
              <div className="flex flex-1 flex-col gap-1">
                <h4 className="text-base font-bold text-[#334155]">{topic.title}</h4>
                <span className="text-xs font-semibold text-slate-600">
                  {topic.status === 'failed' ? 'Failed in Exam' : topic.status === 'weak' ? 'Weak in Diagnostic' : 'Fully Mastered'}
                </span>
              </div>

              {/* Right Side Badge */}
              <span 
                className="rounded-lg px-3 py-1.5 text-xs font-black"
                style={{ backgroundColor: config.badgeBg, color: config.badgeText }}
              >
                {config.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer Link */}
      <div className="mt-8 pt-6 border-t border-slate-50 flex justify-center">
        <button 
          aria-label="Auto-deploy tutorial sequence"
          className="flex items-center gap-2 text-base font-bold transition-all hover:gap-3" 
          style={{ color: brand.primaryColor }}
        >
          Auto-Deploy Tutorial Sequence <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}
