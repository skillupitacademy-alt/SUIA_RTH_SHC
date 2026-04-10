import React from 'react';
import { Trophy, Calendar, TrendingUp, Clock } from 'lucide-react';
import { useDashboardData } from './DashboardDataContext';

const toneMap = {
  success: { icon: Trophy, color: '#10b981', bg: '#f0fdf4' },
  info: { icon: Calendar, color: '#3b82f6', bg: '#eff6ff' },
  accent: { icon: TrendingUp, color: '#8b5cf6', bg: '#faf5ff' },
  warning: { icon: Clock, color: '#f59e0b', bg: '#fffbeb' },
} as const;

export function ActivityLog() {
  const { activity } = useDashboardData();

  return (
    <div className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-5 text-lg font-bold text-gray-900">{activity.title}</h3>

      <div className="space-y-4">
        {activity.items.map((item, index) => {
          const tone = toneMap[item.tone];
          const Icon = tone.icon;
          return (
            <div
              key={index}
              className="group flex cursor-pointer items-start gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 transition-all hover:bg-gray-100"
            >
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: tone.bg }}>
                <Icon style={{ color: tone.color }} size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="mb-1 font-semibold text-gray-900 transition-transform group-hover:translate-x-1">
                  {item.title}
                </h4>
                <p className="mb-1 text-sm text-gray-600">{item.description}</p>
                <span className="text-xs text-gray-500">{item.time}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
