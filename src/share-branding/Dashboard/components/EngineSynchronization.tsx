import React from 'react';
import { useBrand } from '../../PostLandingPage/app/context/BrandContext';
import { TrendingUp, AlertCircle, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { useDashboardData } from './DashboardDataContext';

export function EngineSynchronization() {
  const brand = useBrand();
  const { sync } = useDashboardData();

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'failed':
        return {
          label: 'FAILED EXAM',
          color: '#dc2626',
          bgColor: '#fef2f2',
          textColor: '#991b1b',
          icon: AlertCircle,
        };
      case 'weak':
        return {
          label: 'WEAK DIAGNOSTIC',
          color: '#f59e0b',
          bgColor: '#fffbeb',
          textColor: '#92400e',
          icon: AlertTriangle,
        };
      case 'mastered':
        return {
          label: 'FULLY MASTERED',
          color: '#10b981',
          bgColor: '#f0fdf4',
          textColor: '#065f46',
          icon: CheckCircle2,
        };
      default:
        return {
          label: 'IN PROGRESS',
          color: '#6b7280',
          bgColor: '#f9fafb',
          textColor: '#6b7280',
          icon: AlertCircle,
        };
    }
  };

  return (
    <div className="rounded-[2rem] border border-gray-200 bg-white p-8 shadow-sm">
      <div className="mb-8 flex min-w-0 items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: brand.primaryColor }}>
          <TrendingUp className="text-white" size={26} />
        </div>
        <h2 className="min-w-0 text-2xl font-black text-gray-900 sm:text-3xl">{sync.title}</h2>
      </div>

      <div className="mb-6 space-y-4">
        {sync.topics.map((topic, index) => {
          const statusConfig = getStatusConfig(topic.status);
          const StatusIcon = statusConfig.icon;

          return (
            <div
              key={index}
              className="rounded-2xl border border-gray-200 bg-gray-50 p-6 transition-all hover:border-gray-300"
            >
              <div className="mb-4 flex items-start justify-between gap-4">
                <h3 className="min-w-0 text-lg font-bold text-gray-900 sm:text-xl">{topic.title}</h3>
                <StatusIcon style={{ color: statusConfig.color }} size={24} />
              </div>

              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span
                  className="rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wide"
                  style={{ backgroundColor: statusConfig.bgColor, color: statusConfig.textColor }}
                >
                  {statusConfig.label}
                </span>
                <span className="font-semibold text-gray-700">Score: {topic.score}%</span>
              </div>

              <div className="mb-4 h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${topic.score}%`, backgroundColor: statusConfig.color }} />
              </div>

              <button className="group flex items-center gap-2 font-bold text-slate-700 transition-colors hover:text-slate-900">
                {topic.action}
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          );
        })}
      </div>

      <button
        className="group flex h-16 w-full items-center justify-center gap-3 rounded-2xl text-lg font-bold text-white shadow-lg transition-all hover:shadow-xl"
        style={{ backgroundColor: brand.primaryColor }}
      >
        {sync.ctaLabel}
        <ArrowRight size={22} className="transition-transform group-hover:translate-x-1" />
      </button>
    </div>
  );
}
