import React from 'react';
import { useBrand } from '../../PostLandingPage/app/context/BrandContext';
import { useTutorialDashboardData } from './TutorialDashboardDataContext';
import { Briefcase, MessageSquare, Globe, ArrowRight } from 'lucide-react';

export function ProjectsWidget() {
  const brand = useBrand();
  const { projects } = useTutorialDashboardData();

  const getProjectIcon = (title: string) => {
    if (title.includes('Chat')) return { Icon: MessageSquare, color: '#22c55e', bg: '#f0fdf4' };
    if (title.includes('Portfolio') || title.includes('Website')) return { Icon: Globe, color: '#8b5cf6', bg: '#f5f3ff' };
    return { Icon: Briefcase, color: '#f97316', bg: '#fff7ed' };
  };

  return (
    <div 
      className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-6 transition-transform duration-300 hover:-translate-y-1"
      style={{ boxShadow: `0 8px 24px rgba(${brand.primaryRgb}, 0.08)` }}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-black text-gray-900">Projects</h3>
        <button 
          aria-label="View all projects"
          className="text-xs font-bold hover:underline" 
          style={{ color: brand.accentColor === 'orange' ? '#b43a00' : '#be185d' }}
        >
          View All
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-5">
        {projects.items.map((project) => {
          const { Icon, color, bg } = getProjectIcon(project.title);
          
          return (
            <div key={project.id} className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div 
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" 
                  style={{ backgroundColor: bg, color: color }}
                >
                  <Icon size={18} />
                </div>
                
                <div className="flex flex-1 flex-col">
                  <span className="text-sm font-bold text-gray-900">{project.title}</span>
                  <span className="text-[11px] font-semibold text-gray-700">{project.type}</span>
                </div>

                <span className="text-xs font-black text-gray-900">
                  {project.percent}%
                </span>
              </div>
              
              <div className="ml-13 h-1.5 overflow-hidden rounded-full bg-gray-100">
                <div 
                  className="h-full rounded-full transition-all duration-500" 
                  style={{ width: `${project.percent}%`, backgroundColor: color }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex justify-center border-t border-gray-100 pt-4">
        <button 
          aria-label="View detailed projects dashboard"
          className="flex items-center gap-2 text-sm font-bold hover:underline" 
          style={{ color: brand.accentColor === 'orange' ? '#b43a00' : '#be185d' }}
        >
          View All Projects <ArrowRight size={14} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
