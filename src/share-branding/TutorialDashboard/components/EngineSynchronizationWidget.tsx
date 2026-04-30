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
      className="flex h-full min-w-0 flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-6"
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
              className="group grid min-w-0 grid-cols-[2.5rem_minmax(0,1fr)] gap-x-3 gap-y-2 rounded-xl border border-slate-50 bg-slate-50/20 p-3 transition-all duration-300 hover:border-slate-100 hover:bg-white hover:shadow-md"
            >
              {/* Round Icon */}
              <div 
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                style={{ backgroundColor: config.bg, color: config.color }}
              >
                <StatusIcon size={18} />
              </div>

              {/* Title & Subtitle */}
              <div className="flex min-w-0 flex-1 flex-col">
                <h4 className="break-words text-sm font-bold leading-snug text-gray-900">{topic.title}</h4>
                <span className="break-words text-[11px] font-semibold leading-snug text-gray-700">
                  {topic.status === 'failed' ? 'Failed in Exam' : topic.status === 'weak' ? 'Weak in Diagnostic' : 'Fully Mastered'}
                </span>
              </div>

              {/* Right Side Badge */}
              <span 
                className="col-start-2 w-fit rounded-lg px-2.5 py-1 text-[10px] font-black"
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
          className="flex max-w-full flex-wrap items-center justify-center gap-2 text-center text-sm font-bold transition-colors" 
          style={{ color: brand.accentColor === 'orange' ? '#b43a00' : '#be185d' }}
        >
          Auto-Deploy Tutorial Sequence <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
