import React from 'react';
import { useBrand } from '../../PostLandingPage/app/context/BrandContext';
import { Trophy, Calendar, TrendingUp, Clock } from 'lucide-react';

const activities = [
  {
    icon: Trophy,
    title: 'Passed JavaScript Hooks Exam',
    description: 'Scored 82% on React Hooks Mastery',
    time: '2 hours ago',
    color: '#10b981',
    bg: '#f0fdf4',
  },
  {
    icon: Calendar,
    title: 'Scheduled Live Mentorship',
    description: 'Tuesday, 3:00 PM - Advanced Python',
    time: '4 hours ago',
    color: '#3b82f6',
    bg: '#eff6ff',
  },
  {
    icon: TrendingUp,
    title: 'Skill Level Increased',
    description: 'Data Structures: Intermediate → Advanced',
    time: '1 day ago',
    color: '#8b5cf6',
    bg: '#faf5ff',
  },
  {
    icon: Clock,
    title: 'Completed Coding Challenge',
    description: 'Binary Tree Traversal - 45 minutes',
    time: '2 days ago',
    color: '#f59e0b',
    bg: '#fffbeb',
  },
];

export function ActivityLog() {
  const brand = useBrand();

  return (
    <div className="rounded-[2rem] p-6 bg-white border border-gray-200 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 mb-5">Recent Activity</h3>
      
      <div className="space-y-4">
        {activities.map((activity, index) => {
          const Icon = activity.icon;
          return (
            <div
              key={index}
              className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition-all border border-gray-200 group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: activity.bg }}>
                <Icon style={{ color: activity.color }} size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 mb-1 group-hover:translate-x-1 transition-transform">
                  {activity.title}
                </h4>
                <p className="text-sm text-gray-600 mb-1">{activity.description}</p>
                <span className="text-xs text-gray-400">{activity.time}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}