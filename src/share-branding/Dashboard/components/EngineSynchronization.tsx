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
          textColor: '#dc2626',
          icon: AlertCircle,
        };
      case 'weak':
        return {
          label: 'WEAK DIAGNOSTIC',
          color: '#f59e0b',
          bgColor: '#fffbeb',
          textColor: '#d97706',
          icon: AlertTriangle,
        };
      case 'mastered':
        return {
          label: 'FULLY MASTERED',
          color: '#10b981',
          bgColor: '#f0fdf4',
          textColor: '#059669',
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
      <div className="flex items-center gap-4 mb-8">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: brand.primaryColor }}
        >
          <TrendingUp className="text-white" size={26} />
        </div>
        <h2 className="text-3xl font-black text-gray-900">Engine Synchronization</h2>
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
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">{topic.title}</h3>
                <StatusIcon style={{ color: statusConfig.color }} size={24} />
              </div>

              <div className="flex items-center gap-4 mb-4">
                <span
                  className="px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide"
                  style={{
                    backgroundColor: statusConfig.bgColor,
                    color: statusConfig.textColor,
                  }}
                >
                  {statusConfig.label}
                </span>
                <span className="text-gray-600 font-semibold">Score: {topic.score}%</span>
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
                className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-2 transition-colors group"
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
