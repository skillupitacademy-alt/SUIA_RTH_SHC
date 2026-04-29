import React from 'react';
import { useBrand } from '../../PostLandingPage/app/context/BrandContext';
import { useTutorialDashboardData } from './TutorialDashboardDataContext';
import { ChevronDown, Code, Server, Database, Settings } from 'lucide-react';

export function LearningProgressOverview() {
  const brand = useBrand();
  const { learningProgress } = useTutorialDashboardData();

  const getToneColor = (tone: string) => {
    switch (tone) {
      case 'primary': return brand.primaryColor;
      case 'success': return '#22c55e'; // green-500
      case 'info': return '#3b82f6'; // blue-500
      case 'accent': return '#8b5cf6'; // violet-500
      default: return '#94a3b8'; // slate-400
    }
  };

  const getSubjectIcon = (subject: string, toneColor: string) => {
    let Icon = Code;
    if (subject.includes('Backend')) Icon = Server;
    if (subject.includes('Database')) Icon = Database;
    if (subject.includes('DevOps')) Icon = Settings;

    return (
      <div 
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-opacity-10" 
        style={{ backgroundColor: `${toneColor}1A`, color: toneColor }}
      >
        <Icon size={16} />
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-black text-gray-900">Learning Progress Overview</h3>
        <button className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-gray-900">
          This Week <ChevronDown size={14} />
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center gap-8 xl:flex-row">
        {/* Donut Chart (Simulated) */}
        <div className="relative flex h-40 w-40 shrink-0 items-center justify-center">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90 transform">
            <circle cx="50" cy="50" r="40" stroke="#f1f5f9" strokeWidth="12" fill="none" />
            <circle 
              cx="50" cy="50" r="40" 
              stroke={brand.primaryColor} 
              strokeWidth="12" fill="none" 
              strokeDasharray={`${(learningProgress.overallPercent * 251.2) / 100} 251.2`} 
              strokeLinecap="round" 
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-gray-900">{learningProgress.overallPercent}%</span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Overall Progress</span>
          </div>
        </div>

        {/* Subjects Breakdown */}
        <div className="flex w-full flex-1 flex-col justify-center gap-4">
          {learningProgress.subjects.map((subject) => {
            const toneColor = getToneColor(subject.tone);
            return (
              <div key={subject.subject} className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  {getSubjectIcon(subject.subject, toneColor)}
                  <div className="flex flex-1 items-center justify-between">
                    <span className="text-sm font-bold text-gray-700">{subject.subject}</span>
                    <span className="text-xs font-black text-gray-900">{subject.percent}%</span>
                  </div>
                </div>
                <div className="ml-11 h-1.5 overflow-hidden rounded-full bg-gray-100">
                  <div 
                    className="h-full rounded-full transition-all duration-500" 
                    style={{ width: `${subject.percent}%`, backgroundColor: toneColor }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex justify-center border-t border-gray-100 pt-4">
        <button className="text-sm font-bold hover:underline" style={{ color: brand.primaryColor }}>
          View Detailed Analytics →
        </button>
      </div>
    </div>
  );
}
