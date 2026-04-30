import React from 'react';
import { useBrand } from '../../PostLandingPage/app/context/BrandContext';
import { useTutorialDashboardData } from './TutorialDashboardDataContext';
import { DashboardDomainItem } from '../../tutorialDashboardData';
import { 
  Code2, 
  BarChart3, 
  Cloud, 
  Brain, 
  ShieldCheck, 
  Database,
  BookOpen,
  Briefcase,
  Bookmark,
  ArrowRight
} from 'lucide-react';

export function MyDomainsGrid() {
  const brand = useBrand();
  const { myDomains } = useTutorialDashboardData();

  const getDomainConfig = (title: string) => {
    if (title.includes('Full Stack')) return { Icon: Code2, color: '#c2410c', colorDark: '#9a3412', bg: '#fff7ed', border: '#ffedd5' };
    if (title.includes('Data Science')) return { Icon: BarChart3, color: '#1d4ed8', colorDark: '#1e3a8a', bg: '#eff6ff', border: '#dbeafe' };
    if (title.includes('Data Engineering')) return { Icon: Database, color: '#15803d', colorDark: '#064e3b', bg: '#f0fdf4', border: '#dcfce7' };
    if (title.includes('DevOps')) return { Icon: Cloud, color: '#7e22ce', colorDark: '#4c1d95', bg: '#f5f3ff', border: '#ede9fe' };
    if (title.includes('AI')) return { Icon: Brain, color: '#0e7490', colorDark: '#164e63', bg: '#ecfeff', border: '#cffafe' };
    if (title.includes('Cyber')) return { Icon: ShieldCheck, color: '#b91c1c', colorDark: '#7f1d1d', bg: '#fef2f2', border: '#fee2e2' };
    return { Icon: Code2, color: '#c2410c', colorDark: '#9a3412', bg: '#fff7ed', border: '#ffedd5' };
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-black text-gray-900">My Domains</h3>
        <button 
          aria-label="View all learning domains"
          className="text-sm font-bold hover:underline" 
          style={{ color: brand.accentColor === 'orange' ? '#b43a00' : '#be185d' }}
        >
          View All
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {myDomains.items.map((domain: DashboardDomainItem) => {
          const config = getDomainConfig(domain.title);
          const Icon = config.Icon;

          return (
            <div 
              key={domain.id} 
              className="group flex min-w-0 flex-col rounded-3xl border bg-white p-5 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-6"
              style={{ 
                borderColor: config.border,
                boxShadow: `0 20px 50px rgba(${brand.primaryRgb}, 0.05)`
              }}
            >
              {/* Header */}
              <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-4">
                  <div 
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full shadow-inner"
                    style={{ backgroundColor: config.color, color: '#ffffff' }}
                  >
                    <Icon size={28} />
                  </div>
                  <div className="flex min-w-0 flex-col">
                    <h4 className="break-words text-lg font-black leading-tight text-gray-900">
                      {domain.title}
                    </h4>
                  </div>
                </div>
                {domain.isPopular && (
                  <span className="shrink-0 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[10px] font-bold text-orange-800">
                    Popular
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="mb-6 text-[13px] font-medium leading-relaxed text-gray-600">
                {domain.description}
              </p>

              {/* Progress */}
              <div className="mb-6">
                <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                  <span style={{ color: config.color }}>Your Progress</span>
                  <span style={{ color: config.color }}>{domain.percent}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                  <div 
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${domain.percent}%`, backgroundColor: config.color }}
                  />
                </div>
              </div>

              {/* Stats Row */}
              <div className="mb-6 grid grid-cols-3 gap-3">
                <div className="flex min-w-0 flex-col items-center justify-center rounded-xl border border-gray-50 bg-gray-50/50 p-2">
                  <div className="mb-1 flex items-center gap-1.5 text-gray-500">
                    <BookOpen size={14} style={{ color: config.color }} />
                    <span className="text-[13px] font-black text-gray-900">{domain.stats.topics}</span>
                  </div>
                  <span className="w-full min-w-0 truncate text-center text-[10px] font-bold uppercase text-gray-500">Topics</span>
                </div>
                <div className="flex min-w-0 flex-col items-center justify-center rounded-xl border border-gray-50 bg-gray-50/50 p-2">
                  <div className="mb-1 flex items-center gap-1.5 text-gray-500">
                    <Briefcase size={14} style={{ color: config.color }} />
                    <span className="text-[13px] font-black text-gray-900">{domain.stats.projects}</span>
                  </div>
                  <span className="w-full min-w-0 truncate text-center text-[10px] font-bold uppercase text-gray-500">Projects</span>
                </div>
                <div className="flex min-w-0 flex-col items-center justify-center rounded-xl border border-gray-50 bg-gray-50/50 p-2">
                  <div className="mb-1 flex items-center gap-1.5 text-gray-500">
                    <Bookmark size={14} style={{ color: config.color }} />
                    <span className="text-[13px] font-black text-gray-900">{domain.stats.exams}</span>
                  </div>
                  <span className="w-full min-w-0 truncate text-center text-[10px] font-bold uppercase text-gray-500">Exams</span>
                </div>
              </div>

              {/* Career Outcomes */}
              <div className="mb-8">
                <span className="mb-3 block text-xs font-bold uppercase tracking-wider text-gray-500">
                  Career Outcomes
                </span>
                <div className="flex flex-wrap gap-2">
                  {domain.careerOutcomes.map((outcome, idx) => (
                    <span 
                      key={idx}
                      className="rounded-lg px-2.5 py-1 text-[11px] font-bold transition-colors"
                      style={{ backgroundColor: config.bg, color: config.colorDark }}
                    >
                      {outcome}
                    </span>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-gray-50 pt-4">
                <button 
                  className="min-w-0 rounded-xl px-4 py-2.5 text-xs font-black text-white shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0 sm:px-5"
                  style={{ backgroundColor: config.color }}
                >
                  Continue Learning
                </button>
                <button className="group flex shrink-0 items-center gap-1.5 text-xs font-black text-gray-700 hover:text-gray-900">
                  View Details
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
