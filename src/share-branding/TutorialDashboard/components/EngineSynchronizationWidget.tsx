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
      className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-6 transition-all duration-500 -translate-y-2 scale-[1.01] shadow-2xl hover:-translate-y-3"
      style={{ boxShadow: `0 20px 40px rgba(${brand.primaryRgb}, 0.08)` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-black text-gray-900">Engine Synchronization</h3>
        <button 
          aria-label="View all sync topics"
          className="text-xs font-bold hover:underline"
          style={{ color: brand.accentColor === 'orange' ? '#b43a00' : '#be185d' }}
        >
          View All
        </button>
      </div>

      {/* Topics List */}
      <div className="flex flex-1 flex-col gap-3">
        {engineSync.topics.map((topic: DashboardSyncTopic, index: number) => {
          const config = getStatusConfig(topic.status);
          const StatusIcon = config.Icon;

          return (
            <div 
              key={index} 
              className="group flex items-center gap-3 rounded-xl border border-slate-50 bg-slate-50/20 p-3 transition-all duration-300 hover:bg-white hover:shadow-md hover:border-slate-100"
            >
              {/* Round Icon */}
              <div 
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: config.bg, color: config.color }}
              >
                <StatusIcon size={18} />
              </div>

              {/* Title & Subtitle */}
              <div className="flex flex-1 flex-col">
                <h4 className="text-sm font-bold text-gray-900">{topic.title}</h4>
                <span className="text-[11px] font-semibold text-gray-700">
                  {topic.status === 'failed' ? 'Failed in Exam' : topic.status === 'weak' ? 'Weak in Diagnostic' : 'Fully Mastered'}
                </span>
              </div>

              {/* Right Side Badge */}
              <span 
                className="rounded-lg px-2.5 py-1 text-[10px] font-black"
                style={{ backgroundColor: config.badgeBg, color: config.badgeText }}
              >
                {config.label.toUpperCase()}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer Link */}
      <div className="mt-6 pt-4 border-t border-gray-100 flex justify-center">
        <button 
          aria-label="Auto-deploy tutorial sequence"
          className="flex items-center gap-2 text-sm font-bold transition-all hover:gap-3" 
          style={{ color: brand.accentColor === 'orange' ? '#b43a00' : '#be185d' }}
        >
          Auto-Deploy Tutorial Sequence <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
