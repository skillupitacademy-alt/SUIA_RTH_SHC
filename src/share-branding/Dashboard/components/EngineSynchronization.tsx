import React from 'react';
import { useBrand } from '../../PostLandingPage/app/context/BrandContext';
import { TrendingUp, AlertCircle, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

interface TopicCard {
  title: string;
  status: 'failed' | 'weak' | 'mastered';
  score: number;
  action: string;
}

const topics: TopicCard[] = [
  {
    title: 'Linked Lists Architecture',
    status: 'failed',
    score: 45,
    action: 'Start Tutorial',
  },
  {
    title: 'Async Await Promises',
    status: 'weak',
    score: 68,
    action: 'Review Concepts',
  },
  {
    title: 'Map & Filter Recursion',
    status: 'mastered',
    score: 94,
    action: 'Advanced Level',
  },
];

export function EngineSynchronization() {
  const brand = useBrand();

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
    <div className="rounded-[2rem] p-8 bg-white border border-gray-200 shadow-sm">
      {/* Header */}
      <div className="mb-8 flex min-w-0 items-center gap-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: brand.primaryColor }}
        >
          <TrendingUp className="text-white" size={26} />
        </div>
        <h2 className="min-w-0 text-2xl font-black text-gray-900 sm:text-3xl">Engine Synchronization</h2>
      </div>

      {/* Topic Cards */}
      <div className="space-y-4 mb-6">
        {topics.map((topic, index) => {
          const statusConfig = getStatusConfig(topic.status);
          const StatusIcon = statusConfig.icon;

          return (
            <div
              key={index}
              className="p-6 rounded-2xl bg-gray-50 border border-gray-200 hover:border-gray-300 transition-all"
            >
              <div className="mb-4 flex items-start justify-between gap-4">
                <h3 className="min-w-0 text-lg font-bold text-gray-900 sm:text-xl">{topic.title}</h3>
                <StatusIcon style={{ color: statusConfig.color }} size={24} />
              </div>

              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span
                  className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide"
                  style={{
                    backgroundColor: statusConfig.bgColor,
                    color: statusConfig.textColor,
                  }}
                >
                  {statusConfig.label}
                </span>
                <span className="font-semibold text-gray-700">Score: {topic.score}%</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-gray-200 rounded-full mb-4 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${topic.score}%`,
                    backgroundColor: statusConfig.color,
                  }}
                />
              </div>

              {/* Action Button */}
              <button
                className="flex items-center gap-2 font-bold text-slate-700 transition-colors group hover:text-slate-900"
              >
                {topic.action}
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Auto-Deploy CTA */}
      <button
        className="w-full h-16 rounded-2xl text-white font-bold text-lg flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all group"
        style={{ backgroundColor: brand.primaryColor }}
      >
        Auto-Deploy Tutorial Sequence
        <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );
}
