import React from 'react';
import { useBrand } from '../../PostLandingPage/app/context/BrandContext';
import { useTutorialDashboardData } from './TutorialDashboardDataContext';
import { ChevronDown, Code, Server, Database, Settings, ArrowRight } from 'lucide-react';

export function LearningProgressOverview() {
  const brand = useBrand();
  const { learningProgress } = useTutorialDashboardData();

  const getToneColor = (tone: string) => {
    switch (tone) {
      case 'primary': return brand.primaryColor;
      case 'success': return '#22c55e';
      case 'info': return '#3b82f6';
      case 'accent': return '#8b5cf6';
      default: return '#94a3b8';
    }
  };

  const getSubjectIcon = (subject: string, toneColor: string) => {
    let Icon = Code;
    if (subject.includes('Backend')) Icon = Server;
    if (subject.includes('Database')) Icon = Database;
    if (subject.includes('DevOps')) Icon = Settings;

    return (
      <div 
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" 
        style={{ backgroundColor: `${toneColor}15`, color: toneColor }}
      >
        <Icon size={20} />
      </div>
    );
  };

  return (
    <div 
      className="flex h-full min-w-0 flex-col rounded-3xl border border-gray-100 bg-white p-5 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-8"
      style={{ boxShadow: `0 20px 50px rgba(${brand.primaryRgb}, 0.05)` }}
    >
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <h3 className="min-w-0 break-words text-xl font-black text-[#1e293b]">Learning Progress Overview</h3>
        <button 
          aria-label="Filter progress"
          className="flex items-center gap-1 text-sm font-bold text-slate-600 hover:text-slate-800 transition-colors"
        >
          This Week <ChevronDown size={16} />
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center gap-10 lg:flex-row lg:items-start lg:justify-between">
        {/* Large Donut Chart */}
        <div className="relative flex h-40 w-40 max-w-full shrink-0 items-center justify-center sm:h-48 sm:w-48">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90 transform">
            <circle cx="50" cy="50" r="42" stroke="#f1f5f9" strokeWidth="10" fill="none" />
            <circle 
              cx="50" cy="50" r="42" 
              stroke={brand.primaryColor} 
              strokeWidth="10" fill="none" 
              strokeDasharray={`${(learningProgress.overallPercent * 263.8) / 100} 263.8`} 
              strokeLinecap="round" 
              style={{ transition: 'stroke-dasharray 1s ease-out' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black text-[#1e293b] sm:text-4xl">{learningProgress.overallPercent}%</span>
            <span className="mt-1 max-w-[7rem] text-center text-[10px] font-bold uppercase text-slate-600 sm:max-w-none sm:text-xs">Overall Progress</span>
          </div>
        </div>

        {/* Subjects Breakdown - Vertical List */}
        <div className="flex flex-1 flex-col gap-6 w-full">
          {learningProgress.subjects.map((subject) => {
            const toneColor = getToneColor(subject.tone);
            return (
              <div key={subject.subject} className="flex min-w-0 items-center gap-4">
                {getSubjectIcon(subject.subject, toneColor)}
                
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <span className="break-words text-sm font-bold text-[#334155]">{subject.subject}</span>
                  <div className="flex items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div 
                        className="h-full rounded-full transition-all duration-1000 ease-out" 
                        style={{ width: `${subject.percent}%`, backgroundColor: brand.primaryColor }}
                      />
                    </div>
                    <span className="text-xs font-black text-slate-500 w-8">{subject.percent}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Link */}
      <div className="mt-10 pt-6 border-t border-slate-50 flex justify-center">
        <button 
          aria-label="View detailed analytics"
          className="flex max-w-full flex-wrap items-center justify-center gap-2 text-center text-base font-bold transition-colors" 
          style={{ color: brand.primaryColor }}
        >
          View Detailed Analytics <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}
